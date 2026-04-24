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
 * Shared star-rating widget. Two modes:
 *   - read-only (default): shows the current average with half-star precision.
 *   - interactive ([readonly]="false"): arrow keys + click to set value.
 */
@Component({
  selector: 'app-rating-stars',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="inline-flex items-center gap-0.5"
      [attr.role]="readonly ? 'img' : 'radiogroup'"
      [attr.aria-label]="
        readonly
          ? 'Đánh giá ' + display() + ' trên ' + max + ' sao'
          : 'Chọn số sao đánh giá'
      "
    >
      <button
        *ngFor="let i of stars(); trackBy: trackByIndex"
        type="button"
        class="transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
        [class.cursor-default]="readonly"
        [attr.role]="readonly ? null : 'radio'"
        [attr.aria-checked]="!readonly && i === value ? 'true' : null"
        [attr.aria-label]="readonly ? null : i + ' sao'"
        [tabindex]="readonly ? -1 : 0"
        [disabled]="readonly"
        (click)="readonly ? null : select(i)"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          class="shrink-0"
          [class.size-5]="size === 'md'"
          [class.size-4]="size === 'sm'"
          [class.size-7]="size === 'lg'"
          aria-hidden="true"
        >
          <defs>
            <linearGradient [attr.id]="gradientId(i)">
              <stop [attr.offset]="fillPercent(i) + '%'" stop-color="#f59e0b" />
              <stop [attr.offset]="fillPercent(i) + '%'" stop-color="#e5e7eb" />
            </linearGradient>
          </defs>
          <path
            [attr.fill]="'url(#' + gradientId(i) + ')'"
            stroke="#f59e0b"
            stroke-width="1"
            d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
          />
        </svg>
      </button>
    </div>
  `,
})
export class RatingStarsComponent {
  @Input() max = 5;
  @Input() readonly = true;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  private valueSignal = signal(0);
  @Input()
  set value(v: number | null | undefined) {
    this.valueSignal.set(Math.max(0, Math.min(this.max, Number(v) || 0)));
  }
  get value(): number {
    return this.valueSignal();
  }

  @Output() valueChange = new EventEmitter<number>();

  private readonly instanceId = Math.random().toString(36).slice(2, 8);

  protected stars = computed(() =>
    Array.from({ length: this.max }, (_, i) => i + 1)
  );

  protected display = computed(() => this.valueSignal().toFixed(1));

  protected trackByIndex = (i: number) => i;

  protected gradientId = (i: number) => `rs-${this.instanceId}-${i}`;

  protected fillPercent(i: number): number {
    const v = this.valueSignal();
    if (v >= i) return 100;
    if (v > i - 1) return Math.round((v - (i - 1)) * 100);
    return 0;
  }

  protected select(i: number): void {
    if (this.readonly) return;
    this.valueSignal.set(i);
    this.valueChange.emit(i);
  }
}
