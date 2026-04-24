import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import {
  ApiResponse,
  AuthResponse,
  AuthService,
  LoginRequest,
  ToastService,
  extractErrorMessage,
  isSafeInternalUrl,
} from '@kindergarten-warehouse/data-access';
import { AuthShellComponent } from '../shared/components/auth-shell/auth-shell.component';

const REQUIRED_ROLE = 'ADMIN';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthShellComponent],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  private title = inject(Title);

  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly showPassword = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.title.setTitle('Đăng nhập | Mầm Non Admin');
    // Already-logged-in admin → bounce to returnUrl or dashboard.
    if (this.authService.hasRole(REQUIRED_ROLE)) {
      this.router.navigateByUrl(this.safeReturnUrl());
    }
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  onSubmit(): void {
    if (this.form.invalid || this.isLoading()) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set('');

    const credentials = this.form.getRawValue() as LoginRequest;

    this.authService.login(credentials).subscribe({
      next: (response: ApiResponse<AuthResponse>) => {
        this.isLoading.set(false);
        const user = response?.result?.user;
        if (response?.code !== 1000 || !user) {
          this.errorMessage.set(
            response?.message || 'Email hoặc mật khẩu không đúng.'
          );
          return;
        }
        if (!this.authService.hasAnyRole([REQUIRED_ROLE])) {
          this.authService.logout(undefined, false);
          this.errorMessage.set(
            'Từ chối truy cập: Khu vực này chỉ dành cho quản trị viên.'
          );
          return;
        }
        this.toast.show(`Chào mừng trở lại, ${user.fullName}! 👋`, 'success');
        this.router.navigateByUrl(this.safeReturnUrl());
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          extractErrorMessage(err, 'Đăng nhập thất bại. Vui lòng thử lại.')
        );
      },
    });
  }

  private safeReturnUrl(): string {
    const raw = this.route.snapshot.queryParamMap.get('returnUrl');
    return isSafeInternalUrl(raw) ? (raw as string) : '/dashboard';
  }
}
