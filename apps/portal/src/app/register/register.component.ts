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
  passwordValidator,
  PASSWORD_RULE_TEXT,
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
  readonly passwordRuleText = PASSWORD_RULE_TEXT;

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
      password: ['', [Validators.required, passwordValidator()]],
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
    };

    this.isLoading.set(true);
    this.auth
      .register(payload)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          // Backend may either auto-login (returns user) or require email
          // verification first. Both paths land on a useful screen.
          if (response.result?.user) {
            this.toast.show(
              `Chào mừng bạn đến với KinderWorld, ${payload.fullName}!`,
              'success'
            );
            this.router.navigate(['/']);
          } else {
            this.toast.show(
              'Tạo tài khoản thành công. Vui lòng đăng nhập.',
              'success'
            );
            this.router.navigate(['/login'], {
              queryParams: { email: payload.email },
            });
          }
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
}
