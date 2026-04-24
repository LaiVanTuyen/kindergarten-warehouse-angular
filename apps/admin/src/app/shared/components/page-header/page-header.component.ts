import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Standard page header used by every admin management page.
 * Projected content is displayed in the action slot (right side) — typically
 * a primary "Add new" button or a group of filter toggles.
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-6 mb-5"
    >
      <div class="min-w-0">
        <h1 class="text-2xl font-bold font-display text-kindy-ink tracking-tight truncate">
          {{ title() }}
        </h1>
        @if (subtitle()) {
          <p class="text-sm text-kindy-ink-soft mt-1">{{ subtitle() }}</p>
        }
      </div>
      <div class="flex-shrink-0 flex items-center gap-2 flex-wrap">
        <ng-content />
      </div>
    </header>
  `,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
}
