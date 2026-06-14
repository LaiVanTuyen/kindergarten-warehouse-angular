import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  booleanAttribute,
  input,
  output,
} from '@angular/core';

/**
 * Slide-in drawer from the right edge of the viewport. Body scroll is
 * intentionally preserved so deep pages behind don't jump (use Dialog instead
 * for heavy modal flows). ESC closes automatically.
 */
@Component({
  selector: 'app-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId()"
        class="fixed inset-0 z-50 flex items-stretch justify-end"
      >
        <button
          type="button"
          (click)="closeDrawer.emit()"
          aria-label="Đóng"
          class="absolute inset-0 bg-kindy-ink/40 backdrop-blur-sm animate-fade-in"
        ></button>
        <aside
          [class]="asideClass()"
          class="relative bg-surface h-full shadow-2xl flex flex-col animate-slide-in-right"
        >
          <header
            class="sticky top-0 bg-surface border-b border-line px-5 py-4 flex items-center justify-between gap-3 z-10"
          >
            <div class="min-w-0">
              <h3
                [id]="titleId()"
                class="text-base font-bold text-kindy-ink font-display truncate"
              >
                {{ title() }}
              </h3>
              @if (subtitle()) {
                <p class="text-xs text-kindy-ink-soft truncate mt-0.5">
                  {{ subtitle() }}
                </p>
              }
            </div>
            <button
              type="button"
              (click)="closeDrawer.emit()"
              aria-label="Đóng"
              class="p-1 text-kindy-ink-soft hover:text-kindy-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-md flex-shrink-0"
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
          </header>

          <div class="flex-1 overflow-y-auto p-5">
            <ng-content />
          </div>

          <ng-content select="[drawer-footer]" />
        </aside>
      </div>
    }
  `,
  styles: [
    `
      @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slide-in-right {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
      }
      .animate-fade-in { animation: fade-in 0.15s ease-out; }
      .animate-slide-in-right { animation: slide-in-right 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
    `,
  ],
})
export class DrawerComponent {
  readonly open = input(false, { transform: booleanAttribute });
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly titleId = input<string>('drawer-title');
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  readonly closeDrawer = output<void>();

  asideClass(): string {
    const sizes = {
      sm: 'w-full max-w-sm',
      md: 'w-full max-w-md',
      lg: 'w-full max-w-lg',
    };
    return sizes[this.size()];
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.open()) this.closeDrawer.emit();
  }
}
