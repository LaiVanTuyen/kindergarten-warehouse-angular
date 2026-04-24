import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

import {
  AuthService,
  LoginRequest,
  ToastService,
} from '@kindergarten-warehouse/data-access';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly isLoading = signal(false);
  readonly showPassword = signal(false);

  readonly loginForm: FormGroup = this.fb.group({
    email: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
      ],
    ],
    password: ['', [Validators.required]],
    rememberMe: [false],
  });

  get f() {
    return this.loginForm.controls;
  }

  ngOnInit(): void {
    // Prefill email when redirected here right after registration.
    const prefill = this.route.snapshot.queryParamMap.get('email');
    if (prefill) this.loginForm.patchValue({ email: prefill });
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.getRawValue();
    const payload: LoginRequest = {
      email: (email ?? '').trim().toLowerCase(),
      password,
    };

    this.isLoading.set(true);
    this.auth
      .login(payload)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.toast.show('Đăng nhập thành công! Chào mừng trở lại.', 'success');
          const returnUrl =
            this.route.snapshot.queryParamMap.get('returnUrl') || '/';
          this.router.navigateByUrl(returnUrl);
        },
        error: (err: HttpErrorResponse | Error) => {
          this.toast.show(this.resolveErrorMessage(err), 'error');
        },
      });
  }

  private resolveErrorMessage(err: HttpErrorResponse | Error): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 401) return 'Email hoặc mật khẩu không đúng.';
      if (err.status === 403) return 'Tài khoản của bạn đang bị khoá.';
      if (err.status === 0) {
        return 'Không thể kết nối đến máy chủ. Kiểm tra mạng và thử lại.';
      }
      const msg = (err.error as { message?: string } | null)?.message;
      if (msg) return msg;
    }
    return err.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
  }
}
