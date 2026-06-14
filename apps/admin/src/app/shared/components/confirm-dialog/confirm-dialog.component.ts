import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { DialogShellComponent } from '../dialog-shell/dialog-shell.component';

export type ConfirmTone = 'danger' | 'warning' | 'primary';
export type ConfirmIcon = 'trash' | 'alert' | 'info' | 'logout';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmTone;
  /** Override the icon. Defaults from `tone` (danger→trash, warning→alert, else info). */
  icon?: ConfirmIcon;
}

const CONFIRM_BTN_CLASSES: Record<ConfirmTone, string> = {
  danger: 'bg-danger hover:brightness-95 focus-visible:ring-danger',
  warning: 'bg-warning text-ink hover:brightness-95 focus-visible:ring-warning',
  primary: 'bg-primary-600 hover:bg-primary-700 focus-visible:ring-focus',
};

const BTN_BASE =
  'px-4 py-2.5 text-sm font-bold rounded-xl text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition-all';

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
      <div class="flex items-start gap-4 py-2">
        <div [class]="iconWrapClass" aria-hidden="true">
          @switch (iconKind) {
            @case ('trash') {
              <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-1 13a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7m5 4v6m4-6v6M10 4V2h4v2m-9 3h14" />
              </svg>
            }
            @case ('alert') {
              <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
            @case ('logout') {
              <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            }
            @default {
              <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          }
        </div>

        <div class="text-sm text-ink-soft leading-relaxed pt-1 flex-1" id="dialog-subtitle">
          {{ data.message }}
        </div>
      </div>

      <div actions class="contents">
        <button
          type="button"
          (click)="ref.close(false)"
          class="px-4 py-2.5 text-sm font-bold rounded-xl border border-line text-ink-soft hover:bg-surface-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-focus transition-all"
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

  get iconKind(): ConfirmIcon {
    if (this.data.icon) return this.data.icon;
    if (this.data.tone === 'danger') return 'trash';
    if (this.data.tone === 'warning') return 'alert';
    return 'info';
  }

  get iconWrapClass(): string {
    const base =
      'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0';
    const tone = this.data.tone ?? 'primary';
    const byTone: Record<ConfirmTone, string> = {
      danger: 'bg-danger-soft text-danger',
      warning: 'bg-warning-soft text-warning',
      primary: 'bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300',
    };
    return `${base} ${byTone[tone]}`;
  }
}
