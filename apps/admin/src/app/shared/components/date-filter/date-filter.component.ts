import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { DashboardPeriod } from '@kindergarten-warehouse/data-access';

interface PeriodOption {
  value: DashboardPeriod;
  label: string;
  iconPath: string;
}

const OPTIONS: PeriodOption[] = [
  {
    value: 'last_7_days',
    label: '7 ngày qua',
    iconPath:
      'M12 8v4l3 3M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z',
  },
  {
    value: 'this_month',
    label: 'Tháng này',
    iconPath:
      'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  },
  {
    value: 'this_year',
    label: 'Năm nay',
    iconPath:
      'M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93 4.93 19.07',
  },
  {
    value: 'custom',
    label: 'Tuỳ chỉnh',
    iconPath:
      'M12 20h9M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z',
  },
];

@Component({
  selector: 'app-date-filter',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative flex items-center gap-3 flex-wrap">
      @if (value() === 'custom') {
        <div class="flex items-center gap-2" role="group" aria-label="Khoảng ngày tuỳ chỉnh">
          <label class="sr-only" for="date-filter-start">Từ ngày</label>
          <input
            id="date-filter-start"
            type="date"
            [ngModel]="startDate()"
            (ngModelChange)="startDateChange.emit($event)"
            [attr.max]="endDate() || null"
            class="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-kindy-ink focus:outline-none focus:ring-2 focus:ring-kindy-sidebar"
          />
          <span aria-hidden="true" class="text-kindy-ink-soft">→</span>
          <label class="sr-only" for="date-filter-end">Đến ngày</label>
          <input
            id="date-filter-end"
            type="date"
            [ngModel]="endDate()"
            (ngModelChange)="endDateChange.emit($event)"
            [attr.min]="startDate() || null"
            class="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-kindy-ink focus:outline-none focus:ring-2 focus:ring-kindy-sidebar"
          />
        </div>
      }

      <button
        type="button"
        (click)="toggleMenu()"
        aria-label="Chọn khoảng thời gian"
        aria-haspopup="menu"
        [attr.aria-expanded]="isMenuOpen()"
        class="inline-flex items-center gap-2 bg-white border border-gray-200 text-kindy-ink py-2 pl-4 pr-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-kindy-sidebar font-medium text-sm hover:bg-kindy-surface-soft transition-colors"
      >
        <svg
          aria-hidden="true"
          class="w-4 h-4 text-kindy-sidebar"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          viewBox="0 0 24 24"
        >
          <path [attr.d]="activeIconPath()" />
        </svg>
        <span>{{ activeLabel() }}</span>
        <svg
          aria-hidden="true"
          class="w-4 h-4 text-kindy-ink-soft"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      @if (isMenuOpen()) {
        <div
          role="menu"
          aria-label="Chọn khoảng thời gian"
          class="absolute right-0 top-full mt-2 z-50 bg-white text-kindy-ink rounded-xl shadow-xl border border-gray-100 py-1 min-w-[180px] focus:outline-none"
        >
          @for (opt of options; track opt.value) {
            <button
              role="menuitem"
              type="button"
              (click)="select(opt.value)"
              [attr.aria-current]="value() === opt.value ? 'true' : null"
              class="w-full text-left px-4 py-2.5 text-sm text-kindy-ink hover:bg-kindy-surface-soft flex items-center gap-2 focus:outline-none focus:bg-kindy-surface-soft"
              [class.bg-kindy-surface-soft]="value() === opt.value"
              [class.text-kindy-sidebar]="value() === opt.value"
              [class.font-semibold]="value() === opt.value"
            >
              <svg
                aria-hidden="true"
                class="w-4 h-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                viewBox="0 0 24 24"
              >
                <path [attr.d]="opt.iconPath" />
              </svg>
              {{ opt.label }}
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class DateFilterComponent {
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly value = input.required<DashboardPeriod>();
  readonly startDate = input<string>('');
  readonly endDate = input<string>('');
  readonly isMenuOpen = signal(false);

  readonly valueChange = output<DashboardPeriod>();
  readonly startDateChange = output<string>();
  readonly endDateChange = output<string>();

  readonly options = OPTIONS;

  readonly activeLabel = computed(
    () => OPTIONS.find((o) => o.value === this.value())?.label ?? 'Chọn'
  );
  readonly activeIconPath = computed(
    () => OPTIONS.find((o) => o.value === this.value())?.iconPath ?? ''
  );

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(event: MouseEvent) {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.isMenuOpen.set(false);
    }
  }

  toggleMenu() {
    this.isMenuOpen.update((open) => !open);
  }

  select(value: DashboardPeriod) {
    this.isMenuOpen.set(false);
    if (value !== this.value()) {
      this.valueChange.emit(value);
    }
  }
}
