import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

export type SortDirection = 'asc' | 'desc';
export interface SortState {
  key: string;
  dir: SortDirection;
}

/**
 * Clickable table-header cell. Emits `sort` events that the parent can feed
 * back into a signal and pass to the server. Use inside `<th>`:
 *
 *   <th scope="col" class="...">
 *     <app-sort-header key="fullName" [current]="sort()" (sortChange)="setSort($event)">
 *       Họ tên
 *     </app-sort-header>
 *   </th>
 */
@Component({
  selector: 'app-sort-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      (click)="toggle()"
      [attr.aria-sort]="ariaSort()"
      class="group inline-flex items-center gap-1 text-xs uppercase tracking-wider font-semibold text-kindy-ink-soft hover:text-kindy-sidebar focus:outline-none focus-visible:ring-2 focus-visible:ring-kindy-sidebar rounded-md transition-colors"
    >
      <ng-content />
      <svg
        aria-hidden="true"
        class="w-3 h-3 transition-all"
        [class.opacity-30]="!active()"
        [class.group-hover:opacity-60]="!active()"
        [class.text-kindy-sidebar]="active()"
        [style.transform]="direction() === 'desc' ? 'rotate(180deg)' : ''"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        viewBox="0 0 24 24"
      >
        <path d="M5 15l7-7 7 7" />
      </svg>
    </button>
  `,
})
export class SortHeaderComponent {
  readonly key = input.required<string>();
  readonly current = input<SortState | null>(null);
  readonly sortChange = output<SortState>();

  readonly active = computed(() => this.current()?.key === this.key());
  readonly direction = computed<SortDirection>(() =>
    this.active() ? this.current()!.dir : 'asc'
  );
  readonly ariaSort = computed(() =>
    this.active() ? (this.direction() === 'asc' ? 'ascending' : 'descending') : 'none'
  );

  toggle() {
    const nextDir: SortDirection = this.active()
      ? this.direction() === 'asc'
        ? 'desc'
        : 'asc'
      : 'desc';
    this.sortChange.emit({ key: this.key(), dir: nextDir });
  }
}
