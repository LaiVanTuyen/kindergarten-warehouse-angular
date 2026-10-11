import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, switchMap, tap } from 'rxjs/operators';

import {
  COLLECTION_ERRORS,
  CollectionMembership,
  CollectionService,
  ToastService,
} from '@kindergarten-warehouse/data-access';

/** "Thêm vào bộ": lists my collections, adds the resource to one, or creates a new one with it. */
@Component({
  selector: 'app-add-to-collection-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true"
      aria-labelledby="add-to-collection-title" (click)="closed.emit()">
      <div class="w-full max-w-md bg-surface rounded-2xl shadow-xl p-6" (click)="$event.stopPropagation()">
        <h2 id="add-to-collection-title" class="text-lg font-bold text-ink mb-1">Thêm vào bộ học liệu</h2>
        <p class="text-sm text-ink-soft mb-4 break-words">“{{ resourceTitle }}”</p>

        <p *ngIf="loading()" class="text-sm text-ink-muted">Đang tải…</p>

        <ul *ngIf="!loading() && collections().length" class="max-h-72 overflow-y-auto space-y-2 mb-4">
          <li *ngFor="let c of collections()" class="flex items-center gap-3 rounded-xl border border-line px-3 py-2">
            <span class="flex-1 min-w-0">
              <span class="block font-semibold text-ink truncate">{{ c.title }}</span>
              <span class="block text-xs text-ink-muted">{{ c.itemCount }} tài liệu</span>
            </span>
            <span *ngIf="c.containsResource" class="text-sm font-semibold text-success flex items-center gap-1">
              <i class="ph-bold ph-check" aria-hidden="true"></i> Đã có
            </span>
            <button *ngIf="!c.containsResource" type="button" (click)="add(c)" [disabled]="busyId() !== null"
              class="px-3 py-1.5 rounded-lg bg-primary text-ink-onbrand text-sm font-semibold disabled:opacity-60">
              {{ busyId() === c.id ? 'Đang thêm…' : 'Thêm' }}
            </button>
          </li>
        </ul>
        <p *ngIf="!loading() && !collections().length" class="text-sm text-ink-soft mb-4">Bạn chưa có bộ học liệu nào.</p>

        <form (ngSubmit)="createAndAdd()" class="flex gap-2 border-t border-line pt-4">
          <label for="new-collection-title" class="sr-only">Tên bộ mới</label>
          <input id="new-collection-title" name="newTitle" [(ngModel)]="newTitle" maxlength="200"
            placeholder="Tạo bộ mới, VD: Động vật quanh bé"
            class="flex-1 min-w-0 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-focus" />
          <button type="submit" [disabled]="!newTitle.trim() || busyId() !== null"
            class="px-3 py-2 rounded-xl border border-line text-sm font-semibold text-ink-soft hover:text-primary disabled:opacity-50">
            Tạo và thêm
          </button>
        </form>

        <div class="flex justify-between items-center mt-4">
          <a routerLink="/collections" (click)="closed.emit()" class="text-sm text-ink-muted hover:text-primary">Quản lý bộ học liệu</a>
          <button type="button" (click)="closed.emit()" class="px-4 py-2 rounded-xl border border-line text-ink-soft font-semibold">Đóng</button>
        </div>
      </div>
    </div>
  `,
})
export class AddToCollectionDialogComponent implements OnInit {
  private readonly api = inject(CollectionService);
  private readonly toast = inject(ToastService);

  @Input({ required: true }) resourceId!: string;
  @Input() resourceTitle = '';
  @Output() closed = new EventEmitter<void>();

  readonly collections = signal<CollectionMembership[]>([]);
  readonly loading = signal(true);
  /** Collection id being added to; -1 while creating a new one. */
  readonly busyId = signal<number | null>(null);
  newTitle = '';

  ngOnInit(): void {
    this.api
      .membership(this.resourceId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (list) => this.collections.set(list),
        error: () => this.toast.show('Không tải được danh sách bộ học liệu.', 'error'),
      });
  }

  add(c: CollectionMembership): void {
    this.busyId.set(c.id);
    this.api
      .addItem(c.id, this.resourceId)
      .pipe(finalize(() => this.busyId.set(null)))
      .subscribe({
        next: () => {
          this.markAdded(c.id);
          this.toast.show(`Đã thêm vào “${c.title}”.`, 'success');
        },
        error: (err: HttpErrorResponse) => this.showError(err, c.id),
      });
  }

  createAndAdd(): void {
    const title = this.newTitle.trim();
    if (!title) return;
    this.busyId.set(-1);
    this.api
      .create({ title, visibility: 'PRIVATE' })
      .pipe(
        switchMap((created) => {
          this.collections.update((list) => [
            { id: created.id, title: created.title, itemCount: 0, containsResource: false },
            ...list,
          ]);
          return this.api.addItem(created.id, this.resourceId).pipe(tap(() => this.markAdded(created.id)));
        }),
        finalize(() => this.busyId.set(null))
      )
      .subscribe({
        next: () => {
          this.newTitle = '';
          this.toast.show(`Đã tạo bộ “${title}” và thêm tài liệu.`, 'success');
        },
        error: (err: HttpErrorResponse) => this.showError(err),
      });
  }

  private markAdded(id: number): void {
    this.collections.update((list) =>
      list.map((c) => (c.id === id ? { ...c, containsResource: true, itemCount: c.itemCount + 1 } : c))
    );
  }

  private showError(err: HttpErrorResponse, collectionId?: number): void {
    const code = err.error?.code;
    if (code === COLLECTION_ERRORS.ITEM_EXISTS && collectionId) {
      this.markAdded(collectionId);
      this.toast.show('Tài liệu đã có trong bộ này.', 'info');
    } else if (code === COLLECTION_ERRORS.FULL) {
      this.toast.show('Bộ này đã đủ 50 tài liệu.', 'error');
    } else if (code === COLLECTION_ERRORS.LIMIT) {
      this.toast.show('Bạn đã đạt số bộ học liệu tối đa.', 'error');
    } else {
      this.toast.show('Không thêm được vào bộ học liệu.', 'error');
    }
  }
}
