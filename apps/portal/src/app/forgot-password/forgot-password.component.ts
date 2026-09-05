import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AuthService, ToastService } from '@kindergarten-warehouse/data-access';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly isLoading = signal(false);
  readonly submittedEmail = signal('');

  readonly form = this.fb.group({
    email: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
      ],
    ],
  });

  onSubmit(): void {
    if (this.form.invalid || this.isLoading()) {
      this.form.markAllAsTouched();
      return;
    }

    const email = (this.form.getRawValue().email ?? '').trim().toLowerCase();
    this.isLoading.set(true);
    this.auth
      .forgotPassword(email)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.submittedEmail.set(email);
          this.toast.show(
            'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.',
            'success'
          );
        },
        error: (err: HttpErrorResponse) => {
          const message =
            err.status === 0
              ? 'Không thể kết nối đến máy chủ. Vui lòng thử lại.'
              : (err.error as { message?: string } | null)?.message ||
                'Không thể gửi yêu cầu đặt lại mật khẩu.';
          this.toast.show(message, 'error');
        },
      });
  }
}
