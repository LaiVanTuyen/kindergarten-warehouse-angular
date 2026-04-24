import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

export type StatusPillTone =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'neutral'
  | 'admin'
  | 'teacher'
  | 'user';

const TONE_CLASSES: Record<StatusPillTone, string> = {
  active: 'bg-kindy-mint-soft text-emerald-700',
  inactive: 'bg-gray-100 text-gray-600',
  pending: 'bg-kindy-sun-soft text-amber-700',
  approved: 'bg-kindy-mint-soft text-emerald-700',
  rejected: 'bg-kindy-coral-soft text-kindy-coral-strong',
  neutral: 'bg-kindy-surface-soft text-kindy-sidebar',
  admin: 'bg-kindy-coral-soft text-kindy-coral-strong',
  teacher: 'bg-kindy-sky-soft text-blue-700',
  user: 'bg-gray-100 text-gray-600',
};

/**
 * Small colored pill used to show status/role in tables.
 * Tone is a semantic keyword — the component owns the visual mapping so the
 * palette can evolve in one place.
 */
@Component({
  selector: 'app-status-pill',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      [class]="cls()"
      class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold leading-5"
    >
      @if (dot()) {
        <span
          aria-hidden="true"
          [class]="dotCls()"
          class="w-1.5 h-1.5 rounded-full"
        ></span>
      }
      {{ label() }}
    </span>
  `,
})
export class StatusPillComponent {
  readonly label = input.required<string>();
  readonly tone = input<StatusPillTone>('neutral');
  readonly dot = input<boolean>(false);

  readonly cls = computed(() => TONE_CLASSES[this.tone()]);
  readonly dotCls = computed(() => {
    const map: Record<StatusPillTone, string> = {
      active: 'bg-emerald-500',
      inactive: 'bg-gray-400',
      pending: 'bg-amber-500',
      approved: 'bg-emerald-500',
      rejected: 'bg-kindy-coral-strong',
      neutral: 'bg-kindy-sidebar',
      admin: 'bg-kindy-coral-strong',
      teacher: 'bg-blue-500',
      user: 'bg-gray-400',
    };
    return map[this.tone()];
  });
}
