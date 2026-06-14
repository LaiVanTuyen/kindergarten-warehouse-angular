import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { ICONS, IconName } from '../../icons';

export type IconButtonTone =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger';
export type IconButtonSize = 'xs' | 'sm' | 'md';

const TONE_CLASSES: Record<IconButtonTone, string> = {
  neutral:
    'text-kindy-ink-soft hover:bg-kindy-surface-soft hover:text-kindy-sidebar focus-visible:ring-focus',
  primary:
    'text-kindy-ink-soft hover:bg-kindy-sky-soft hover:text-blue-700 focus-visible:ring-focus',
  success:
    'text-kindy-ink-soft hover:bg-kindy-mint-soft hover:text-emerald-700 focus-visible:ring-kindy-mint',
  warning:
    'text-kindy-ink-soft hover:bg-kindy-sun-soft hover:text-amber-700 focus-visible:ring-kindy-sun',
  danger:
    'text-kindy-ink-soft hover:bg-kindy-coral-soft hover:text-kindy-coral-strong focus-visible:ring-kindy-coral-strong',
};

const SIZE_CLASSES: Record<IconButtonSize, string> = {
  xs: 'w-7 h-7',
  sm: 'w-8 h-8',
  md: 'w-9 h-9',
};

const ICON_SIZE: Record<IconButtonSize, string> = {
  xs: 'w-3.5 h-3.5',
  sm: 'w-4 h-4',
  md: 'w-4 h-4',
};

/**
 * Reusable square icon-only button. Centralizes row-level actions that were
 * duplicated across every admin table. Pass the click handler on the host
 * element — native button bubbling reaches the listener.
 */
@Component({
  selector: 'app-icon-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      [disabled]="disabled()"
      [attr.aria-label]="ariaLabel()"
      [attr.title]="title() || ariaLabel()"
      [attr.aria-pressed]="pressed()"
      [class]="btnClass()"
    >
      <svg
        [class]="iconClass()"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        viewBox="0 0 24 24"
      >
        <path [attr.d]="iconPath()" />
      </svg>
    </button>
  `,
})
export class IconButtonComponent {
  readonly icon = input.required<IconName>();
  readonly ariaLabel = input.required<string>();
  readonly title = input<string>('');
  readonly tone = input<IconButtonTone>('neutral');
  readonly size = input<IconButtonSize>('md');
  readonly disabled = input<boolean>(false);
  readonly pressed = input<boolean | null>(null);

  readonly iconPath = computed(() => ICONS[this.icon()]);
  readonly iconClass = computed(() => ICON_SIZE[this.size()]);

  readonly btnClass = computed(
    () =>
      `${SIZE_CLASSES[this.size()]} rounded-lg flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${TONE_CLASSES[this.tone()]}`
  );
}
