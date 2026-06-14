import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Lightweight confirm dialog shared across the portal. Kindergarten-friendly
 * visuals (rounded, pastel) but accessible: role="dialog", aria-modal,
 * Escape-to-cancel, focus ring on confirm button.
 *
 * Parent renders it with *ngIf="showDialog" and listens to (confirm)/(cancel).
 * Keeping markup in the parent-controlled `*ngIf` means we never leak a DOM
 * node that absorbs clicks when closed.
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center px-4 animate-[fade-in_0.15s_ease-out]"
      role="dialog"
      aria-modal="true"
      [attr.aria-labelledby]="titleId"
      (click)="backdropClose ? cancel.emit() : null"
    >
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>

      <div
        class="relative w-full max-w-md rounded-3xl bg-surface shadow-2xl ring-1 ring-black/5 p-6 sm:p-7"
        (click)="$event.stopPropagation()"
      >
        <div class="flex items-start gap-4">
          <div
            class="flex size-12 shrink-0 items-center justify-center rounded-2xl"
            [ngClass]="{
              'bg-red-50 text-red-500': tone === 'danger',
              'bg-amber-50 text-amber-500': tone === 'warning',
              'bg-sky-50 text-sky-500': tone === 'info'
            }"
            aria-hidden="true"
          >
            <ng-container [ngSwitch]="tone">
              <svg *ngSwitchCase="'danger'" xmlns="http://www.w3.org/2000/svg"
                class="size-6" fill="none" viewBox="0 0 24 24" stroke-width="2"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <svg *ngSwitchCase="'warning'" xmlns="http://www.w3.org/2000/svg"
                class="size-6" fill="none" viewBox="0 0 24 24" stroke-width="2"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <svg *ngSwitchDefault xmlns="http://www.w3.org/2000/svg"
                class="size-6" fill="none" viewBox="0 0 24 24" stroke-width="2"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
            </ng-container>
          </div>

          <div class="flex-1 min-w-0">
            <h3 [id]="titleId" class="text-lg font-bold text-slate-900 leading-snug">
              {{ title }}
            </h3>
            <p *ngIf="message" class="mt-1 text-sm text-slate-600 leading-relaxed">
              {{ message }}
            </p>
          </div>
        </div>

        <div class="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            [disabled]="busy"
            (click)="cancel.emit()"
          >
            {{ cancelLabel }}
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            [ngClass]="{
              'bg-red-500 hover:bg-red-600 focus-visible:ring-red-400': tone === 'danger',
              'bg-amber-500 hover:bg-amber-600 focus-visible:ring-amber-400': tone === 'warning',
              'bg-sky-500 hover:bg-sky-600 focus-visible:ring-sky-400': tone === 'info'
            }"
            [disabled]="busy"
            (click)="confirm.emit()"
            cdkFocusInitial
          >
            <svg *ngIf="busy" class="animate-spin size-4 mr-2" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  @Input() title = 'Xác nhận';
  @Input() message = '';
  @Input() confirmLabel = 'Đồng ý';
  @Input() cancelLabel = 'Huỷ';
  @Input() tone: 'danger' | 'warning' | 'info' = 'danger';
  @Input() busy = false;
  @Input() backdropClose = true;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  readonly titleId = `confirm-dialog-${Math.random().toString(36).slice(2, 8)}`;

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (!this.busy) this.cancel.emit();
  }
}
