import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Shared password policy — API Contract v1 §5 / decision D3.
 * ≥ 8 chars, at least one lowercase, one uppercase, one digit.
 * Single source of truth for register / reset-password / change-password
 * across both the portal and admin apps (mirror of the backend rule).
 */
export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

/** Human-readable description shown as a form hint. */
export const PASSWORD_RULE_TEXT =
  'Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số.';

/** True when the value satisfies the shared password policy. */
export function isValidPassword(value: string | null | undefined): boolean {
  return !!value && PASSWORD_PATTERN.test(value);
}

/**
 * Reactive-forms validator enforcing the shared policy.
 * Emits `{ weakPassword: true }` when the value is non-empty but fails.
 * (Empty is left to a separate `Validators.required` so messages don't stack.)
 */
export function passwordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) return null;
    return PASSWORD_PATTERN.test(value) ? null : { weakPassword: true };
  };
}
