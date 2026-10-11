import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';

import {
  COLLECTION_ERRORS,
  CollectionDetail,
  CollectionItem,
  CollectionService,
  CollectionUpsert,
  LessonPlanService,
  ToastService,
} from '@kindergarten-warehouse/data-access';
import { ErrorStateComponent } from '../shared/error-state/error-state.component';
import { SpinnerComponent } from '../shared/spinner/spinner.component';
import { FileHelper } from '../shared/utils/file-helper';
import { CollectionFormDialogComponent } from './collection-form-dialog.component';

@Component({
  selector: 'app-collection-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ErrorStateComponent, SpinnerComponent, CollectionFormDialogComponent],
  templateUrl: './collection-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(CollectionService);
  private readonly toast = inject(ToastService);
  private readonly plans = inject(LessonPlanService);

  readonly id = signal<number | null>(null);
  readonly detail = signal<CollectionDetail | null>(null);
  readonly error = signal<string | null>(null);
  readonly busy = signal(false);
  readonly editing = signal(false);
  /** Item whose note is open for editing, and the draft text. */
  readonly editingNoteId = signal<number | null>(null);
  noteDraft = '';

  readonly isOwner = computed(() => this.detail()?.collection.isOwner ?? false);
  readonly unavailableCount = computed(
    () => this.detail()?.items.filter((i) => !i.available).length ?? 0
  );

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const id = Number(params.get('id'));
      if (!Number.isInteger(id) || id <= 0) {
        this.error.set('Không tìm thấy bộ học liệu.');
        return;
      }
      this.id.set(id);
      this.load();
    });
  }

  load(): void {
    const id = this.id();
    if (!id) return;
    this.error.set(null);
    this.api.get(id).subscribe({
      next: (detail) => this.detail.set(detail),
      error: (err: HttpErrorResponse) =>
        this.error.set(
          err.status === 404
            ? 'Không tìm thấy bộ học liệu, hoặc bộ chưa được chia sẻ với bạn.'
            : 'Không tải được bộ học liệu.'
        ),
    });
  }

  fileIcon(item: CollectionItem): string {
    return FileHelper.getFileIcon(item.resource?.fileType ?? item.resource?.type);
  }

  // --- collection-level actions ------------------------------------------

  saveMeta(body: CollectionUpsert): void {
    const id = this.id();
    if (!id) return;
    this.busy.set(true);
    this.api
      .update(id, body)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: () => {
          this.editing.set(false);
          this.toast.show('Đã lưu bộ học liệu.', 'success');
          this.load();
        },
        error: (err) => this.handleWriteError(err, 'Không lưu được bộ học liệu.'),
      });
  }

  toggleShare(): void {
    const c = this.detail()?.collection;
    if (!c) return;
    this.saveMeta({
      title: c.title,
      description: c.description ?? null,
      ageGroupId: c.ageGroup?.id ?? null,
      topicId: c.topic?.id ?? null,
      visibility: c.visibility === 'SHARED' ? 'PRIVATE' : 'SHARED',
      version: c.version,
    });
  }

  copy(): void {
    const id = this.id();
    if (!id) return;
    this.busy.set(true);
    this.api
      .copy(id)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (created) => {
          this.toast.show('Đã sao chép về bộ của bạn.', 'success');
          this.router.navigate(['/collections', created.id]);
        },
        error: (err) => this.handleWriteError(err, 'Không sao chép được bộ học liệu.'),
      });
  }

  remove(): void {
    const c = this.detail()?.collection;
    if (!c || !confirm(`Xoá bộ "${c.title}"? Tài liệu trong kho không bị xoá.`)) return;
    this.busy.set(true);
    this.api
      .delete(c.id)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: () => {
          this.toast.show('Đã xoá bộ học liệu.', 'success');
          this.router.navigate(['/collections']);
        },
        error: (err) => this.handleWriteError(err, 'Không xoá được bộ học liệu.'),
      });
  }

  /** New plan with default steps; the collection's resources go into "Khám phá". */
  planFromCollection(): void {
    const c = this.detail()?.collection;
    if (!c) return;
    this.busy.set(true);
    this.plans
      .create({ title: c.title, ageGroupId: c.ageGroup?.id ?? null, topicId: c.topic?.id ?? null,
        status: 'DRAFT', collectionId: c.id })
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (plan) => this.router.navigate(['/plans', plan.id, 'edit']),
        error: () => this.toast.show('Không tạo được kế hoạch.', 'error'),
      });
  }

  // --- item actions --------------------------------------------------------

  move(index: number, delta: -1 | 1): void {
    const detail = this.detail();
    const id = this.id();
    if (!detail || !id) return;
    const target = index + delta;
    if (target < 0 || target >= detail.items.length) return;
    const reordered = [...detail.items];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    // Optimistic: show the new order now, roll back by reloading if the server refuses.
    this.detail.set({ ...detail, items: reordered.map((item, i) => ({ ...item, position: i })) });
    this.api.reorder(id, reordered.map((i) => i.id)).subscribe({
      error: (err) => this.handleWriteError(err, 'Không đổi được thứ tự.'),
    });
  }

  startNote(item: CollectionItem): void {
    this.noteDraft = item.note ?? '';
    this.editingNoteId.set(item.id);
  }

  saveNote(item: CollectionItem): void {
    const id = this.id();
    if (!id) return;
    const note = this.noteDraft.trim();
    this.api.updateItem(id, item.id, note).subscribe({
      next: () => {
        this.editingNoteId.set(null);
        this.patchItem(item.id, { note: note || null });
      },
      error: (err) => this.handleWriteError(err, 'Không lưu được ghi chú.'),
    });
  }

  removeItem(item: CollectionItem): void {
    const id = this.id();
    if (!id) return;
    this.api.removeItem(id, item.id).subscribe({
      next: () => {
        const detail = this.detail();
        if (!detail) return;
        const items = detail.items.filter((i) => i.id !== item.id).map((i, idx) => ({ ...i, position: idx }));
        this.detail.set({
          ...detail,
          items,
          collection: { ...detail.collection, itemCount: items.length },
        });
      },
      error: (err) => this.handleWriteError(err, 'Không gỡ được tài liệu khỏi bộ.'),
    });
  }

  trackById = (_: number, item: CollectionItem) => item.id;

  private patchItem(itemId: number, patch: Partial<CollectionItem>): void {
    const detail = this.detail();
    if (!detail) return;
    this.detail.set({ ...detail, items: detail.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) });
  }

  private handleWriteError(err: HttpErrorResponse, fallback: string): void {
    const code = err.error?.code;
    if (code === COLLECTION_ERRORS.STALE || err.status === 409) {
      this.toast.show('Bộ học liệu vừa được thay đổi ở nơi khác. Đã tải lại bản mới nhất.', 'info');
    } else if (code === COLLECTION_ERRORS.LIMIT) {
      this.toast.show('Bạn đã đạt số bộ học liệu tối đa.', 'error');
    } else {
      this.toast.show(fallback, 'error');
    }
    this.load();
  }
}
