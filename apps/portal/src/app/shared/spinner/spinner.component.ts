import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Generic centered spinner. Accepts `label` for aria-label + visible text. */
@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center gap-3 py-8"
         role="status" [attr.aria-label]="label">
      <svg class="animate-spin text-primary" xmlns="http://www.w3.org/2000/svg"
        fill="none" viewBox="0 0 24 24"
        [class.size-6]="size === 'sm'"
        [class.size-10]="size === 'md'"
        [class.size-14]="size === 'lg'"
        aria-hidden="true">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span *ngIf="showLabel" class="text-sm text-slate-500">{{ label }}</span>
    </div>
  `,
})
export class SpinnerComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() label = 'Đang tải…';
  @Input() showLabel = false;
}
