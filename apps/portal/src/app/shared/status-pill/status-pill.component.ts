import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ResourceStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'HIDDEN'
  | 'DELETED';

const STATUS_META: Record<
  ResourceStatus,
  { label: string; classes: string; icon: string }
> = {
  PENDING: {
    label: 'Đang chờ duyệt',
    classes: 'bg-amber-50 text-amber-700 ring-amber-200',
    icon: 'clock',
  },
  APPROVED: {
    label: 'Đã duyệt',
    classes: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    icon: 'check',
  },
  REJECTED: {
    label: 'Bị từ chối',
    classes: 'bg-rose-50 text-rose-700 ring-rose-200',
    icon: 'x',
  },
  HIDDEN: {
    label: 'Đang ẩn',
    classes: 'bg-slate-100 text-slate-600 ring-slate-200',
    icon: 'eye-off',
  },
  DELETED: {
    label: 'Đã xoá',
    classes: 'bg-slate-100 text-slate-500 ring-slate-200 line-through',
    icon: 'trash',
  },
};

/**
 * Small badge rendering a resource status in a consistent, accessible way.
 * Screen readers get the full label; the icon is purely decorative.
 */
@Component({
  selector: 'app-status-pill',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset"
      [ngClass]="meta().classes"
    >
      <svg
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        class="size-3.5"
      >
        <ng-container [ngSwitch]="meta().icon">
          <path *ngSwitchCase="'clock'" stroke-linecap="round" stroke-linejoin="round"
            d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
          <path *ngSwitchCase="'check'" stroke-linecap="round" stroke-linejoin="round"
            d="M5 13l4 4L19 7" />
          <path *ngSwitchCase="'x'" stroke-linecap="round" stroke-linejoin="round"
            d="M6 18L18 6M6 6l12 12" />
          <path *ngSwitchCase="'eye-off'" stroke-linecap="round" stroke-linejoin="round"
            d="M3.98 8.223A10.5 10.5 0 001.323 12c1.274 4.057 5.064 7 9.542 7 .99 0 1.95-.14 2.853-.405M6.228 6.228A10.451 10.451 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.525 10.525 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
          <path *ngSwitchCase="'trash'" stroke-linecap="round" stroke-linejoin="round"
            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56.775c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </ng-container>
      </svg>
      <span>{{ meta().label }}</span>
    </span>
  `,
})
export class StatusPillComponent {
  private readonly statusSignal = signal<ResourceStatus>('PENDING');

  @Input({ required: true })
  set status(value: ResourceStatus | string | undefined | null) {
    this.statusSignal.set(this.normalize(value));
  }

  protected readonly meta = computed(() => STATUS_META[this.statusSignal()]);

  private normalize(value: ResourceStatus | string | undefined | null): ResourceStatus {
    const upper = (value ?? 'PENDING').toString().toUpperCase();
    if (upper in STATUS_META) return upper as ResourceStatus;
    return 'PENDING';
  }
}
