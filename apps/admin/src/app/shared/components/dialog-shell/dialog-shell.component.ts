import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASSES: Record<DialogSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

/**
 * Dialog-level chrome used by every form/info modal opened via CDK Dialog.
 * Provides: title, close button, scrollable body, and an actions footer slot.
 * Usage:
 *
 *   <app-dialog-shell title="Sửa banner" size="xl">
 *     <form> ... </form>
 *     <ng-container actions>
 *       <button>Huỷ</button>
 *       <button>Lưu</button>
 *     </ng-container>
 *   </app-dialog-shell>
 */
@Component({
  selector: 'app-dialog-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      [class]="shellClass()"
      class="bg-white rounded-2xl shadow-2xl flex flex-col"
    >
      <header [class]="headerClass()">
        <div class="min-w-0">
          <h3
            id="dialog-title"
            class="text-lg font-bold text-kindy-ink font-display truncate"
          >
            {{ title() }}
          </h3>
          @if (subtitle()) {
            <p id="dialog-subtitle" class="text-xs text-kindy-ink-soft mt-0.5 truncate">
              {{ subtitle() }}
            </p>
          }
        </div>
        @if (closable()) {
          <button
            type="button"
            (click)="onClose()"
            aria-label="Đóng"
            class="p-1 text-kindy-ink-soft hover:text-kindy-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-kindy-sidebar rounded-md flex-shrink-0"
          >
            <svg
              aria-hidden="true"
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        }
      </header>

      <div [class]="bodyClass()">
        <ng-content />
      </div>

      <footer [class]="footerClass()">
        <ng-content select="[actions]" />
      </footer>
    </div>
  `,
})
export class DialogShellComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly size = input<DialogSize>('md');
  readonly scrollable = input<boolean>(true);
  readonly closable = input<boolean>(true);
  readonly noBorder = input<boolean>(false);

  private dialogRef = inject(DialogRef, { optional: true });

  readonly shellClass = computed(
    () => `${SIZE_CLASSES[this.size()]} w-[calc(100vw-2rem)] max-h-[calc(100vh-4rem)]`
  );

  readonly headerClass = computed(() => {
    const base = 'px-6 py-4 flex items-center justify-between gap-3';
    return this.noBorder() ? base : `${base} border-b border-gray-100`;
  });

  readonly bodyClass = computed(() =>
    this.scrollable() ? 'flex-1 overflow-y-auto px-6 py-5' : 'px-6 py-5'
  );

  readonly footerClass = computed(() => {
    const base = 'px-6 py-4 flex justify-end gap-3 flex-wrap';
    return this.noBorder() ? base : `${base} border-t border-gray-100`;
  });

  onClose() {
    this.dialogRef?.close();
  }
}
