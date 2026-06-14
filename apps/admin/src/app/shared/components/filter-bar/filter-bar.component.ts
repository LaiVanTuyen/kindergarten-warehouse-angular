import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Filter bar shell. Projects filter inputs (search, dropdowns, chips).
 * Shows a "Clear filters" link when `canReset` is true.
 *
 *   <app-filter-bar [canReset]="hasFilters()" (reset)="resetFilters()">
 *     <app-search-input ... />
 *     <select>...</select>
 *   </app-filter-bar>
 */
@Component({
  selector: 'app-filter-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="bg-surface border border-line rounded-xl p-3 mb-4 flex flex-wrap items-center gap-3"
      role="search"
    >
      <ng-content />
      @if (canReset()) {
        <button
          type="button"
          (click)="resetFilters.emit()"
          class="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-kindy-sidebar hover:text-kindy-sidebar-hover hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-kindy-sky rounded-md px-2 py-1"
        >
          <svg
            aria-hidden="true"
            class="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          Xoá bộ lọc
        </button>
      }
    </div>
  `,
})
export class FilterBarComponent {
  readonly canReset = input<boolean>(false);
  readonly resetFilters = output<void>();
}
