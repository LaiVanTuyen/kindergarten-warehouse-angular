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
