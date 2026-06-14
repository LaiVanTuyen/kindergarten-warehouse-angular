import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';

@Component({
  selector: 'app-multi-select-filter',
  standalone: true,
  imports: [CommonModule, SafeHtmlPipe],
  template: `
    <div class="relative group">
      <button
        type="button"
        (click)="toggleOpen.emit()"
        class="min-w-[180px] pl-4 pr-10 py-2.5 bg-surface border border-line rounded-xl text-sm font-medium text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors shadow-sm hover:border-slate-300 relative z-40"
        [class.ring-2]="isOpen"
        [class.border-blue-500]="isOpen"
      >
        <span
          class="truncate block text-ink-soft"
          *ngIf="selectedValues.size === 0"
        >
          {{ label }}
        </span>
        <span
          class="truncate block text-ink font-bold"
          *ngIf="selectedValues.size > 0"
        >
          {{ label }}: {{ selectedValues.size }}
        </span>
        <span
          class="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-ink-muted"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </button>

      <div
        *ngIf="isOpen"
        class="absolute z-50 mt-1 w-64 bg-surface rounded-xl shadow-xl border border-line ring-1 ring-black/5 max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-100 left-0"
      >
        <!-- Quick Actions Header -->
        <div
          class="sticky top-0 bg-surface-2 border-b border-line px-3 py-2 flex items-center justify-between z-10"
        >
          <button
            (click)="onSelectAll($event)"
            class="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
          >
            Select All
          </button>
          <button
            (click)="onClear($event)"
            class="text-xs font-semibold text-ink-muted hover:text-red-600 hover:underline"
          >
            Clear
          </button>
        </div>

        <div class="p-1.5 space-y-0.5">
          <div
            *ngFor="let option of options"
            class="flex items-center px-3 py-2.5 rounded-lg hover:bg-surface-2 cursor-pointer transition-colors group/item"
            (click)="onOptionClick(option.value)"
            (keydown.enter)="onOptionClick(option.value)"
            tabindex="0"
          >
            <div class="relative flex items-center justify-center w-5 h-5 mr-3">
              <input
                type="checkbox"
                [checked]="selectedValues.has(option.value)"
                class="peer appearance-none h-5 w-5 border-2 border-slate-300 rounded text-blue-600 bg-surface checked:bg-blue-600 checked:border-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                tabindex="-1"
              />
              <svg
                class="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="4"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <span
              class="text-sm text-ink-soft font-medium truncate select-none flex-1 group-hover/item:text-ink flex items-center gap-2.5"
            >
              <span
                *ngIf="option.icon"
                [innerHTML]="option.icon | safeHtml"
                [class]="option.colorClass || 'text-ink-muted'"
                class="flex items-center justify-center w-4 h-4 mt-px"
              ></span>
              {{ option.label }}
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MultiSelectFilterComponent<T> {
  @Input() label = '';
  @Input() options: {
    label: string;
    value: T;
    icon?: string;
    colorClass?: string;
  }[] = [];
  @Input() selectedValues = new Set<T>();
  @Input() isOpen = false;

  @Output() selectionChange = new EventEmitter<Set<T>>();
  @Output() toggleOpen = new EventEmitter<void>();

  onOptionClick(value: T) {
    const newSet = new Set(this.selectedValues);
    if (newSet.has(value)) {
      newSet.delete(value);
    } else {
      newSet.add(value);
    }
    this.selectionChange.emit(newSet);
  }

  onSelectAll(event: MouseEvent) {
    event.stopPropagation();
    const allValues = this.options.map((opt) => opt.value);
    this.selectionChange.emit(new Set(allValues));
  }

  onClear(event: MouseEvent) {
    event.stopPropagation();
    this.selectionChange.emit(new Set());
  }
}
