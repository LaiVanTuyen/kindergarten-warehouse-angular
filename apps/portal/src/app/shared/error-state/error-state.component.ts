import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Reusable error state for "API failed / nothing loaded" situations.
 * Gives the user a visible diagnosis + a single "try again" button that emits
 * `(retry)`. Rendered inside a card by default so it slots naturally into
 * list pages without extra wrapper divs.
 */
@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      [class.bg-white]="boxed"
      [class.rounded-3xl]="boxed"
      [class.shadow-sm]="boxed"
      [class.border]="boxed"
      [class.border-gray-100]="boxed"
      class="flex flex-col items-center justify-center py-14 px-6 text-center"
      role="alert"
    >
      <div
        class="w-20 h-20 rounded-full flex items-center justify-center mb-5 ring-1 ring-inset"
        [ngClass]="{
          'bg-rose-50 text-rose-400 ring-rose-100': tone === 'error',
          'bg-amber-50 text-amber-400 ring-amber-100': tone === 'warning'
        }"
        aria-hidden="true"
      >
        <i class="text-4xl" [class]="icon"></i>
      </div>
      <h3 class="text-lg font-bold text-gray-900 mb-1.5">{{ title }}</h3>
      <p class="text-gray-500 mb-6 max-w-md">{{ message }}</p>
      <button
        *ngIf="retryLabel"
        type="button"
        (click)="retry.emit()"
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white font-bold hover:shadow-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:ring-offset-2"
      >
        <i class="ph ph-arrow-clockwise" aria-hidden="true"></i>
        {{ retryLabel }}
      </button>
    </div>
  `,
})
export class ErrorStateComponent {
  @Input() title = 'Rất tiếc, đã có lỗi';
  @Input() message = 'Vui lòng thử lại sau ít phút.';
  @Input() retryLabel = 'Thử lại';
  @Input() icon = 'ph ph-warning';
  @Input() tone: 'error' | 'warning' = 'error';
  /** When false, render without card chrome (for use inside an existing panel). */
  @Input() boxed = true;

  @Output() retry = new EventEmitter<void>();
}
