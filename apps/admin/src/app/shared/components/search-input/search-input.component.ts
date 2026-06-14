import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Debounced search input. Emits `valueChange` 300ms after the user stops typing.
 * Two-way bind via `value` / `valueChange`; resetting `value` programmatically
 * is supported.
 */
@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="relative block">
      <span class="sr-only">{{ placeholder() }}</span>
      <span
        aria-hidden="true"
        class="absolute inset-y-0 left-0 flex items-center pl-3 text-kindy-ink-soft pointer-events-none"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      </span>
      <input
        #input
        type="search"
        [ngModel]="local()"
        (ngModelChange)="onInput($event)"
        [placeholder]="placeholder()"
        class="w-full pl-9 pr-9 py-2 text-sm border border-line rounded-lg bg-surface text-kindy-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-focus focus:border-transparent"
      />
      @if (local()) {
        <button
          type="button"
          (click)="clear()"
          aria-label="Xoá tìm kiếm"
          class="absolute inset-y-0 right-0 flex items-center pr-3 text-kindy-ink-soft hover:text-kindy-sidebar focus:outline-none"
        >
          <svg
            aria-hidden="true"
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      }
    </label>
  `,
})
export class SearchInputComponent {
  private destroyRef = inject(DestroyRef);

  readonly value = input<string>('');
  readonly placeholder = input<string>('Tìm kiếm…');
  readonly debounce = input<number>(300);
  readonly valueChange = output<string>();

  readonly local = signal<string>('');
  readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('input');

  private typed$ = new Subject<string>();

  constructor() {
    // Reflect external value changes into the local model.
    effect(() => this.local.set(this.value()));

    this.typed$
      .pipe(
        debounceTime(this.debounce()),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((v) => this.valueChange.emit(v));
  }

  onInput(v: string) {
    this.local.set(v);
    this.typed$.next(v);
  }

  clear() {
    this.local.set('');
    this.typed$.next('');
    this.inputEl()?.nativeElement.focus();
  }
}
