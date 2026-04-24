import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Generic white-card wrapper used on dashboards and detail pages.
 * Projects any content. Optional right-aligned link renders "Xem tất cả".
 */
@Component({
  selector: 'app-dashboard-card',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full flex flex-col"
    >
      @if (title()) {
        <header class="flex items-center justify-between mb-5 gap-3">
          <div class="min-w-0">
            <h3 class="text-base font-bold text-kindy-ink font-display truncate">
              {{ title() }}
            </h3>
            @if (subtitle()) {
              <p class="text-xs text-kindy-ink-soft mt-0.5">{{ subtitle() }}</p>
            }
          </div>
          @if (linkTo()) {
            <a
              [routerLink]="linkTo()"
              [queryParams]="linkQueryParams()"
              class="text-sm font-medium text-kindy-sidebar hover:text-kindy-sidebar-hover hover:underline flex items-center gap-1 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-kindy-sky rounded-md px-1"
            >
              {{ linkLabel() }}
              <svg
                aria-hidden="true"
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>
          }
        </header>
      }
      <div class="flex-1 min-h-0">
        <ng-content />
      </div>
    </section>
  `,
})
export class DashboardCardComponent {
  readonly title = input<string>('');
  readonly subtitle = input<string>('');
  readonly linkTo = input<string | null>(null);
  readonly linkLabel = input<string>('Xem tất cả');
  readonly linkQueryParams = input<Record<string, unknown> | null>(null);
}
