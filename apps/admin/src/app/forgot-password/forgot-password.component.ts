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
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import {
  AuthService,
  extractErrorMessage,
} from '@kindergarten-warehouse/data-access';
import { AuthShellComponent } from '../shared/components/auth-shell/auth-shell.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthShellComponent],
  templateUrl: './forgot-password.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private title = inject(Title);

  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly submitted = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  ngOnInit(): void {
    this.title.setTitle('Quên mật khẩu | Mầm Non Admin');
  }

  onSubmit(): void {
    if (this.form.invalid || this.isLoading()) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.forgotPassword(this.form.getRawValue().email).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.submitted.set(true);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        // Security: if the server returned a rate-limit/validation error we show it,
        // but for "email not found" the server should still respond 200 to avoid enumeration.
        this.errorMessage.set(
          extractErrorMessage(err, 'Không thể gửi yêu cầu. Vui lòng thử lại.')
        );
      },
    });
  }
}
