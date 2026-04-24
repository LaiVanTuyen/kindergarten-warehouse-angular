import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Accessible pagination control.
 *
 *   <app-paginator [page]="page()" [totalPages]="totalPages()"
 *                  (pageChange)="onPageChange($event)"></app-paginator>
 *
 * Renders up to 7 pages with ellipses on either side. Pages are 1-indexed for
 * humans. Buttons have aria-label and aria-current="page" on the active item.
 */
@Component({
  selector: 'app-paginator',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav
      *ngIf="totalPages > 1"
      class="flex items-center justify-center gap-1"
      role="navigation"
      aria-label="Phân trang"
    >
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-xl size-9 text-slate-600 bg-white ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        (click)="go(page - 1)"
        [disabled]="page <= 1"
        aria-label="Trang trước"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none"
          viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
          aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      <ng-container *ngFor="let item of items(); trackBy: trackByItem">
        <span
          *ngIf="item === -1; else pageBtn"
          class="inline-flex items-center justify-center size-9 text-slate-400"
          aria-hidden="true"
        >…</span>
        <ng-template #pageBtn>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-xl size-9 text-sm font-semibold transition ring-1 ring-inset"
            [class.bg-pink-500]="item === page"
            [class.text-white]="item === page"
            [class.ring-pink-500]="item === page"
            [class.bg-white]="item !== page"
            [class.text-slate-700]="item !== page"
            [class.ring-slate-200]="item !== page"
            [class.hover:bg-slate-50]="item !== page"
            [attr.aria-current]="item === page ? 'page' : null"
            [attr.aria-label]="'Trang ' + item"
            (click)="go(item)"
          >
            {{ item }}
          </button>
        </ng-template>
      </ng-container>

      <button
        type="button"
        class="inline-flex items-center justify-center rounded-xl size-9 text-slate-600 bg-white ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        (click)="go(page + 1)"
        [disabled]="page >= totalPages"
        aria-label="Trang sau"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none"
          viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
          aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </nav>
  `,
})
export class PaginatorComponent {
  private pageSignal = signal(1);
  private totalSignal = signal(1);

  @Input()
  set page(value: number) {
    this.pageSignal.set(Math.max(1, value || 1));
  }
  get page(): number {
    return this.pageSignal();
  }

  @Input()
  set totalPages(value: number) {
    this.totalSignal.set(Math.max(1, value || 1));
  }
  get totalPages(): number {
    return this.totalSignal();
  }

  @Output() pageChange = new EventEmitter<number>();

  /** -1 → ellipsis. Otherwise a 1-indexed page number. */
  protected items = computed<number[]>(() => {
    const total = this.totalSignal();
    const current = this.pageSignal();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages = new Set<number>([1, total, current - 1, current, current + 1]);
    if (current <= 3) {
      pages.add(2);
      pages.add(3);
      pages.add(4);
    }
    if (current >= total - 2) {
      pages.add(total - 1);
      pages.add(total - 2);
      pages.add(total - 3);
    }

    const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
    const out: number[] = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push(-1);
      out.push(sorted[i]);
    }
    return out;
  });

  trackByItem = (idx: number, value: number): string =>
    value === -1 ? `ellipsis-${idx}` : `p-${value}`;

  protected go(page: number): void {
    const clamped = Math.min(Math.max(1, page), this.totalSignal());
    if (clamped !== this.pageSignal()) {
      this.pageChange.emit(clamped);
    }
  }
}
