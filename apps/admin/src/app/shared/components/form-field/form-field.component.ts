import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { AbstractControl } from '@angular/forms';

/**
 * Reusable form-field wrapper that renders label + projected input + error.
 * The `control` input is required so the wrapper can read touched/dirty state
 * and show messages consistently across every admin form.
 */
@Component({
  selector: 'app-form-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-1.5">
      @if (label()) {
        <label
          [attr.for]="forId()"
          class="text-sm font-medium text-kindy-ink flex items-center gap-1"
        >
          {{ label() }}
          @if (required()) {
            <span aria-hidden="true" class="text-kindy-coral-strong">*</span>
          }
        </label>
      }
      <ng-content />
      @if (hint() && !showError()) {
        <p class="text-xs text-kindy-ink-soft">{{ hint() }}</p>
      }
      @if (showError()) {
        <p
          role="alert"
          aria-live="polite"
          class="text-xs text-kindy-coral-strong"
        >
          {{ errorText() }}
        </p>
      }
    </div>
  `,
})
export class FormFieldComponent {
  readonly label = input<string>('');
  readonly forId = input<string>('');
  readonly required = input<boolean>(false);
  readonly hint = input<string>('');
  readonly control = input<AbstractControl | null>(null);
  readonly errors = input<Record<string, string>>({});

  readonly showError = computed(() => {
    const c = this.control();
    return !!c && c.invalid && (c.touched || c.dirty);
  });

  readonly errorText = computed(() => {
    const c = this.control();
    if (!c || !c.errors) return '';
    const errs = this.errors();
    for (const key of Object.keys(c.errors)) {
      if (errs[key]) return errs[key];
    }
    // Sensible defaults
    if (c.errors['required']) return 'Trường này là bắt buộc.';
    if (c.errors['email']) return 'Email không đúng định dạng.';
    if (c.errors['minlength']) {
      const rl = c.errors['minlength'].requiredLength;
      return `Tối thiểu ${rl} ký tự.`;
    }
    if (c.errors['maxlength']) {
      const rl = c.errors['maxlength'].requiredLength;
      return `Tối đa ${rl} ký tự.`;
    }
    if (c.errors['pattern']) return 'Định dạng chưa đúng.';
    return 'Giá trị không hợp lệ.';
  });
}
