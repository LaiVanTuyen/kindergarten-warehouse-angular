import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: string;
}

/**
 * Pill-style segmented control used for small enum filters
 * (e.g. "Tất cả / WEB / MOBILE"). Keyboard + ARIA tab semantics.
 *
 *   <app-segmented-control
 *     [options]="[{value:'ALL',label:'Tất cả'},...]"
 *     [value]="filter()"
 *     (valueChange)="filter.set($event)"
 *   />
 */
@Component({
  selector: 'app-segmented-control',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      role="tablist"
      [attr.aria-label]="ariaLabel()"
      class="inline-flex rounded-lg bg-gray-100 p-0.5"
    >
      @for (opt of options(); track opt.value) {
        <button
          type="button"
          role="tab"
          [attr.aria-selected]="opt.value === value()"
          (click)="valueChange.emit(opt.value)"
          class="px-3 py-1.5 text-xs font-semibold rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-kindy-sidebar"
          [class.bg-white]="opt.value === value()"
          [class.text-kindy-sidebar]="opt.value === value()"
          [class.shadow-sm]="opt.value === value()"
          [class.text-kindy-ink-soft]="opt.value !== value()"
        >
          {{ opt.label }}
        </button>
      }
    </div>
  `,
})
export class SegmentedControlComponent<T extends string = string> {
  readonly options = input.required<SegmentedOption<T>[]>();
  readonly value = input.required<T>();
  readonly ariaLabel = input<string>('Chọn chế độ');
  readonly valueChange = output<T>();
}
