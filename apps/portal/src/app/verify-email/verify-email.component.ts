import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  DestroyRef,
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
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';

import { AuthService, ToastService } from '@kindergarten-warehouse/data-access';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './verify-email.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyEmailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly email = signal('');
  readonly isLoading = signal(false);
  readonly isResending = signal(false);
  readonly countdown = signal(0);
  private timerInterval?: any;

  readonly verifyForm: FormGroup = this.fb.group({
    otp: [
      '',
      [Validators.required, Validators.pattern(/^\d{6}$/)],
    ],
  });

  get f() {
    return this.verifyForm.controls;
  }

  ngOnInit(): void {
    const emailParam = this.route.snapshot.queryParamMap.get('email');
    if (!emailParam) {
      this.toast.show('Không tìm thấy thông tin email cần xác thực.', 'error');
      this.router.navigate(['/login']);
      return;
    }
    this.email.set(emailParam);
    this.startCountdown();
  }

  onSubmit(): void {
    if (this.verifyForm.invalid) {
      this.verifyForm.markAllAsTouched();
      return;
    }

    const { otp } = this.verifyForm.getRawValue();
    this.isLoading.set(true);

    this.auth
      .verifyEmail(this.email(), otp)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.toast.show('Xác thực email thành công! Bạn có thể đăng nhập.', 'success');
          this.router.navigate(['/login'], {
            queryParams: { email: this.email() },
          });
        },
        error: (err: HttpErrorResponse) => {
          const msg =
            err.status === 400
              ? 'Mã xác thực không hợp lệ hoặc đã hết hạn.'
              : err.status === 404
              ? 'Không tìm thấy tài khoản tương ứng với email.'
              : (err.error as { message?: string } | null)?.message ||
                'Xác thực thất bại. Vui lòng thử lại.';
          this.toast.show(msg, 'error');
        },
      });
  }

  resendOtp(): void {
    if (this.countdown() > 0 || this.isResending()) return;

    this.isResending.set(true);
    this.auth
      .resendVerificationOtp(this.email())
      .pipe(
        finalize(() => this.isResending.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.toast.show('Mã OTP mới đã được gửi tới email của bạn.', 'success');
          this.startCountdown();
        },
        error: (err: HttpErrorResponse) => {
          const msg =
            (err.error as { message?: string } | null)?.message ||
            'Không gửi được mã OTP. Vui lòng thử lại sau.';
          this.toast.show(msg, 'error');
        },
      });
  }

  private startCountdown(): void {
    this.countdown.set(60);
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      this.countdown.update((c) => {
        if (c <= 1) {
          clearInterval(this.timerInterval);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }
}
