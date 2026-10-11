import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, map } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  CollectionService,
  CollectionSummary,
  Resource,
  ResourceService,
} from '@kindergarten-warehouse/data-access';

/**
 * Picks a resource for a plan step: search the warehouse, or take one from a collection.
 * Both sources only return resources the teacher can open (backend-filtered).
 */
@Component({
  selector: 'app-resource-picker-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true"
      aria-labelledby="picker-title" (click)="closed.emit()">
      <div class="w-full max-w-xl bg-surface rounded-2xl shadow-xl p-6 max-h-[90vh] flex flex-col" (click)="$event.stopPropagation()">
        <h2 id="picker-title" class="text-lg font-bold text-ink mb-3">Gắn học liệu cho bước “{{ stepTitle }}”</h2>

        <div class="flex gap-1 bg-surface-2 rounded-xl p-1 mb-3" role="tablist">
          <button type="button" role="tab" [attr.aria-selected]="tab() === 'search'" (click)="openSearch()"
            class="flex-1 px-3 py-1.5 rounded-lg text-sm font-bold" [ngClass]="tab() === 'search' ? 'bg-surface shadow-sm text-primary' : 'text-ink-soft'">Tìm trong kho</button>
          <button type="button" role="tab" [attr.aria-selected]="tab() === 'collections'" (click)="openCollections()"
            class="flex-1 px-3 py-1.5 rounded-lg text-sm font-bold" [ngClass]="tab() === 'collections' ? 'bg-surface shadow-sm text-primary' : 'text-ink-soft'">Từ bộ học liệu</button>
        </div>

        <form *ngIf="tab() === 'search'" (ngSubmit)="search()" class="flex gap-2 mb-3" role="search">
          <label for="picker-keyword" class="sr-only">Từ khoá</label>
          <input id="picker-keyword" name="keyword" [(ngModel)]="keyword" placeholder="VD: bài hát màu sắc"
            class="flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-focus" />
          <button type="submit" class="px-4 py-2 rounded-xl bg-primary text-ink-onbrand text-sm font-semibold">Tìm</button>
        </form>

        <select *ngIf="tab() === 'collections'" [ngModel]="collectionId()" (ngModelChange)="pickCollection($event)"
          aria-label="Chọn bộ học liệu"
          class="mb-3 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink">
          <option [ngValue]="null">— Chọn bộ học liệu —</option>
          <option *ngFor="let c of collections()" [ngValue]="c.id">{{ c.title }} ({{ c.itemCount }})</option>
        </select>

        <p *ngIf="loading()" class="text-sm text-ink-muted">Đang tải…</p>
        <p *ngIf="!loading() && searched() && !results().length" class="text-sm text-ink-muted">Không có tài liệu phù hợp.</p>

        <ul class="overflow-y-auto space-y-2 flex-1 min-h-0">
          <li *ngFor="let r of results()" class="flex items-center gap-3 rounded-xl border border-line px-3 py-2">
            <span class="flex-1 min-w-0">
              <span class="block font-semibold text-ink truncate">{{ r.title }}</span>
              <span class="block text-xs text-ink-muted">{{ r.topic?.name }} · {{ r.fileType || r.resourceType }}</span>
            </span>
            <span *ngIf="selectedIds.includes(r.id)" class="text-sm text-success font-semibold">Đã gắn</span>
            <button *ngIf="!selectedIds.includes(r.id)" type="button" (click)="picked.emit(r)"
              class="px-3 py-1.5 rounded-lg bg-primary text-ink-onbrand text-sm font-semibold">Gắn</button>
          </li>
        </ul>

        <div class="flex justify-end mt-4">
          <button type="button" (click)="closed.emit()" class="px-4 py-2 rounded-xl border border-line text-ink-soft font-semibold">Xong</button>
        </div>
      </div>
    </div>
  `,
})
export class ResourcePickerDialogComponent implements OnInit {
  private readonly resources = inject(ResourceService);
  private readonly collectionsApi = inject(CollectionService);
  private readonly destroy = inject(DestroyRef);
  private request?: Subscription;

  constructor() { this.destroy.onDestroy(() => this.request?.unsubscribe()); }

  @Input() stepTitle = '';
  /** Ids already on the step (shown as "Đã gắn"). */
  @Input() selectedIds: string[] = [];
  @Output() picked = new EventEmitter<Resource>();
  @Output() closed = new EventEmitter<void>();

  readonly tab = signal<'search' | 'collections'>('search');
  readonly results = signal<Resource[]>([]);
  readonly loading = signal(false);
  readonly searched = signal(false);
  readonly collections = signal<CollectionSummary[]>([]);
  readonly collectionId = signal<number | null>(null);
  keyword = '';

  ngOnInit(): void {
    this.search();
  }

  search(): void {
    this.request?.unsubscribe();
    this.results.set([]);
    this.loading.set(true);
    this.request = this.resources
      .getPortalResources({ keyword: this.keyword.trim() || undefined, page: 1, size: 12 })
      .pipe(
        map((res) => (res.result ?? res.data)?.content ?? []),
        finalize(() => {
          this.loading.set(false);
          this.searched.set(true);
        })
      )
      .subscribe({ next: (list) => this.results.set(list), error: () => this.results.set([]) });
  }

  openSearch(): void { this.tab.set('search'); this.search(); }

  openCollections(): void {
    this.request?.unsubscribe();
    this.loading.set(false);
    this.tab.set('collections');
    this.results.set([]);
    this.searched.set(false);
    if (this.collections().length) return;
    this.collectionsApi.listMine(1, 50).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: (page) => this.collections.set(page?.content ?? []),
      error: () => void 0,
    });
  }

  pickCollection(id: number | null): void {
    this.request?.unsubscribe();
    this.loading.set(false);
    this.collectionId.set(id);
    this.results.set([]);
    if (!id) return;
    this.loading.set(true);
    this.request = this.collectionsApi
      .get(id)
      .pipe(finalize(() => {
        this.loading.set(false);
        this.searched.set(true);
      }))
      .subscribe({
        next: (d) => this.results.set(d.items.filter((i) => i.available && i.resource).map((i) => i.resource as Resource)),
        error: () => this.results.set([]),
      });
  }
}
