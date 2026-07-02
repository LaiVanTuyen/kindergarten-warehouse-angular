import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';

import {
  AuthService,
  RegisterRequest,
  ToastService,
} from '@kindergarten-warehouse/data-access';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly isLoading = signal(false);
  readonly showPassword = signal(false);

  readonly registerForm: FormGroup = this.fb.group(
    {
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
        ],
      ],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: RegisterComponent.matchPasswords }
  );

  get f() {
    return this.registerForm.controls;
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { fullName, email, password } = this.registerForm.getRawValue();
    const payload: RegisterRequest = {
      fullName: (fullName ?? '').trim(),
      email: (email ?? '').trim().toLowerCase(),
      password,
      username: this.buildUsername(email ?? ''),
    };

    this.isLoading.set(true);
    this.auth
      .register(payload)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.toast.show(
            'Đăng ký tài khoản thành công! Vui lòng kiểm tra email và nhập mã OTP để xác thực tài khoản.',
            'success'
          );
          this.router.navigate(['/verify-email'], {
            queryParams: { email: payload.email },
          });
        },
        error: (err: HttpErrorResponse) => {
          this.toast.show(this.resolveErrorMessage(err), 'error');
        },
      });
  }

  private static matchPasswords(
    group: AbstractControl
  ): ValidationErrors | null {
    const pwd = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pwd === confirm ? null : { passwordMismatch: true };
  }

  private resolveErrorMessage(err: HttpErrorResponse): string {
    if (err.status === 409) {
      return 'Email này đã được sử dụng. Vui lòng chọn email khác.';
    }
    if (err.status === 0) {
      return 'Không thể kết nối đến máy chủ. Kiểm tra mạng và thử lại.';
    }
    const backendMessage = (err.error as { message?: string } | null)?.message;
    return backendMessage || 'Đăng ký thất bại. Vui lòng thử lại sau.';
  }

  private buildUsername(email: string): string {
    const localPart = email.split('@')[0] || 'user';
    return (
      localPart
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^[-._]+|[-._]+$/g, '')
        .slice(0, 50) || `user-${Date.now()}`
    );
  }
}
