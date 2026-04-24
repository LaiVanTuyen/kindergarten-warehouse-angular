import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';

export type StatCardTone = 'coral' | 'sun' | 'mint' | 'sky' | 'lavender';

const TONE_CLASSES: Record<StatCardTone, string> = {
  coral: 'bg-kindy-coral-soft text-kindy-coral-strong',
  sun: 'bg-kindy-sun-soft text-amber-600',
  mint: 'bg-kindy-mint-soft text-emerald-600',
  sky: 'bg-kindy-sky-soft text-blue-600',
  lavender: 'bg-kindy-lavender/40 text-violet-600',
};

const CARD_STATIC =
  'block bg-white rounded-2xl p-5 shadow-sm border border-gray-100';
const CARD_INTERACTIVE =
  CARD_STATIC +
  ' hover:shadow-md hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-kindy-sidebar focus:ring-offset-2';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [DecimalPipe, NgTemplateOutlet, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (linkTo(); as to) {
      <a
        [routerLink]="to"
        [queryParams]="linkQueryParams()"
        [class]="CARD_INTERACTIVE"
        [attr.aria-label]="ariaLabel()"
      >
        <ng-container *ngTemplateOutlet="body"></ng-container>
      </a>
    } @else {
      <div [class]="CARD_STATIC" [attr.aria-label]="ariaLabel()">
        <ng-container *ngTemplateOutlet="body"></ng-container>
      </div>
    }

    <ng-template #body>
      <div class="flex justify-between items-start mb-3 gap-3">
        <div class="min-w-0">
          <p class="text-sm font-medium text-kindy-ink-soft">{{ label() }}</p>
          <h3 class="text-3xl font-bold text-kindy-ink mt-1 font-display">
            {{ value() | number }}
          </h3>
        </div>
        <div
          aria-hidden="true"
          [class]="'p-2.5 rounded-xl flex-shrink-0 ' + toneClass()"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path [attr.d]="iconPath()" />
          </svg>
        </div>
      </div>

      @if (trend() !== null && trend() !== undefined) {
        <div class="text-xs flex items-center gap-1">
          <span [class]="trendClass()">
            {{ trendArrow() }} {{ trendAbs() | number: '1.0-1' }}%
          </span>
          <span class="text-kindy-ink-soft">so với kỳ trước</span>
        </div>
      } @else if (subLabel()) {
        <div class="text-xs">
          <span class="text-kindy-coral-strong font-semibold">{{ subLabel() }}</span>
        </div>
      }
    </ng-template>
  `,
})
export class StatCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<number>();
  readonly iconPath = input.required<string>();
  readonly tone = input<StatCardTone>('sky');
  readonly trend = input<number | null>(null);
  readonly subLabel = input<string>('');
  readonly linkTo = input<string | null>(null);
  readonly linkQueryParams = input<Record<string, unknown> | null>(null);

  readonly CARD_STATIC = CARD_STATIC;
  readonly CARD_INTERACTIVE = CARD_INTERACTIVE;

  readonly toneClass = computed(() => TONE_CLASSES[this.tone()]);
  readonly trendAbs = computed(() => Math.abs(this.trend() ?? 0));
  readonly trendArrow = computed(() => ((this.trend() ?? 0) >= 0 ? '↑' : '↓'));
  readonly trendClass = computed(() =>
    (this.trend() ?? 0) >= 0
      ? 'text-emerald-600 font-semibold'
      : 'text-kindy-coral-strong font-semibold'
  );
  readonly ariaLabel = computed(
    () =>
      `${this.label()}: ${this.value().toLocaleString('vi-VN')}` +
      (this.subLabel() ? ` — ${this.subLabel()}` : '')
  );
}
