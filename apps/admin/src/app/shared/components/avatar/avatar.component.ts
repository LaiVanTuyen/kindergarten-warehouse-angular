import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<AvatarSize, string> = {
  xs: 'w-7 h-7 text-xs',
  sm: 'w-9 h-9 text-sm',
  md: 'w-11 h-11 text-base',
  lg: 'w-16 h-16 text-xl',
};

/**
 * Accessible avatar that falls back to colored initials when no URL is given
 * or the image fails to load. Initials are derived from the `name` input.
 */
@Component({
  selector: 'app-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (src() && !failed()) {
      <img
        [src]="src()"
        [alt]="alt() || name()"
        [class]="sizeClass() + ' rounded-full object-cover flex-shrink-0'"
        (error)="onError()"
      />
    } @else {
      <span
        [class]="sizeClass() + ' rounded-full bg-kindy-sidebar text-white font-semibold flex items-center justify-center flex-shrink-0 uppercase select-none'"
        [attr.aria-label]="alt() || name()"
      >
        {{ initials() }}
      </span>
    }
  `,
})
export class AvatarComponent {
  readonly src = input<string | null | undefined>('');
  readonly name = input<string>('');
  readonly alt = input<string>('');
  readonly size = input<AvatarSize>('sm');

  readonly failed = signal(false);

  readonly sizeClass = computed(() => SIZE_CLASSES[this.size()]);

  readonly initials = computed(() => {
    const n = this.name().trim();
    if (!n) return '?';
    const parts = n.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return n.substring(0, 2).toUpperCase();
  });

  onError() {
    this.failed.set(true);
  }
}
