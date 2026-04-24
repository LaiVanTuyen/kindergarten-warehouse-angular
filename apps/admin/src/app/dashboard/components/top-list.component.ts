import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

export interface TopListItem {
  id: string | number;
  label: string;
  sublabel?: string;
  imageUrl?: string;
  fallbackInitial?: string;
  metric: number;
}

@Component({
  selector: 'app-top-list',
  standalone: true,
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (items().length === 0) {
      <p class="text-sm text-kindy-ink-soft py-8 text-center">
        {{ emptyMessage() }}
      </p>
    } @else {
      <ol class="space-y-3">
        @for (item of items(); track item.id; let i = $index) {
          <li class="flex items-center gap-3">
            <span
              aria-hidden="true"
              [class]="rankClass(i)"
            >{{ i + 1 }}</span>

            @if (item.imageUrl) {
              <img
                [src]="item.imageUrl"
                alt=""
                class="w-10 h-10 rounded-lg object-cover flex-shrink-0"
              />
            } @else {
              <span
                aria-hidden="true"
                class="w-10 h-10 rounded-lg bg-kindy-surface-soft text-kindy-sidebar font-bold flex items-center justify-center flex-shrink-0"
              >
                {{ item.fallbackInitial || '?' }}
              </span>
            }

            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-kindy-ink truncate">
                {{ item.label }}
              </p>
              @if (item.sublabel) {
                <p class="text-xs text-kindy-ink-soft truncate">
                  {{ item.sublabel }}
                </p>
              }
            </div>

            <span class="text-sm font-bold text-kindy-ink whitespace-nowrap">
              {{ item.metric | number }}
              @if (metricSuffix()) {
                <span class="text-xs font-normal text-kindy-ink-soft ml-0.5">
                  {{ metricSuffix() }}
                </span>
              }
            </span>
          </li>
        }
      </ol>
    }
  `,
})
export class TopListComponent {
  readonly items = input.required<TopListItem[]>();
  readonly metricSuffix = input<string>('');
  readonly emptyMessage = input<string>('Chưa có dữ liệu.');

  rankClass(index: number): string {
    const base =
      'w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0';
    if (index === 0) return `${base} bg-kindy-sun text-white`;
    if (index === 1) return `${base} bg-kindy-lavender text-white`;
    if (index === 2) return `${base} bg-kindy-coral text-white`;
    return `${base} bg-kindy-surface-soft text-kindy-ink-soft`;
  }
}
