import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { DialogShellComponent } from '../dialog-shell/dialog-shell.component';

export type ConfirmTone = 'danger' | 'warning' | 'primary';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmTone;
}

const CONFIRM_BTN_CLASSES: Record<ConfirmTone, string> = {
  danger:
    'bg-kindy-coral-strong hover:bg-rose-700 focus-visible:ring-kindy-coral-strong',
  warning:
    'bg-kindy-sun text-kindy-ink hover:bg-amber-500 focus-visible:ring-kindy-sun',
  primary:
    'bg-kindy-sidebar hover:bg-kindy-sidebar-hover focus-visible:ring-kindy-sidebar',
};

const BTN_BASE =
  'px-4 py-2 text-sm font-semibold rounded-lg text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition-colors';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [DialogShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-shell
      [title]="data.title"
      size="sm"
      [scrollable]="false"
      [noBorder]="true"
    >
      <p class="text-base text-gray-700" id="dialog-subtitle">
        {{ data.message }}
      </p>
      <div class="flex items-start gap-4 py-1">
        @if (data.tone === 'danger') {
          <div class="w-10 h-10 rounded-full bg-rose-50 text-kindy-coral-strong flex items-center justify-center flex-shrink-0" aria-hidden="true">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-1 13a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7m5 4v6m4-6v6M10 4V2h4v2m-9 3h14" />
            </svg>
          </div>
        } @else if (data.tone === 'warning') {
          <div class="w-10 h-10 rounded-full bg-amber-50 text-kindy-sun flex items-center justify-center flex-shrink-0" aria-hidden="true">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        } @else {
          <div class="w-10 h-10 rounded-full bg-blue-50 text-kindy-sidebar flex items-center justify-center flex-shrink-0" aria-hidden="true">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        }
        
        <div class="text-sm text-gray-600 leading-relaxed pt-1">
          {{ data.message }}
        </div>
      </div>

      <div actions class="contents">
        <button
          type="button"
          (click)="ref.close(false)"
          class="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-kindy-sky"
        >
          {{ data.cancelText || 'Huỷ' }}
        </button>
        <button
          type="button"
          (click)="ref.close(true)"
          [class]="confirmClass"
        >
          {{ data.confirmText || 'Đồng ý' }}
        </button>
      </div>
    </app-dialog-shell>
  `,
})
export class ConfirmDialogComponent {
  readonly data = inject<ConfirmDialogData>(DIALOG_DATA);
  readonly ref = inject<DialogRef<boolean>>(DialogRef);

  get confirmClass(): string {
    const tone = this.data.tone ?? 'primary';
    return `${BTN_BASE} ${CONFIRM_BTN_CLASSES[tone]}`;
  }
}
