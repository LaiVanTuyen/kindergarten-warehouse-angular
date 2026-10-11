import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import {
  AuthService,
  extractErrorMessage,
  passwordValidator,
  ToastService,
} from '@kindergarten-warehouse/data-access';
import { AuthShellComponent } from '../shared/components/auth-shell/auth-shell.component';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pw = group.get('newPassword')?.value;
  const cf = group.get('confirmPassword')?.value;
  return pw && cf && pw !== cf ? { passwordsMismatch: true } : null;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthShellComponent],
  templateUrl: './reset-password.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private title = inject(Title);

  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly showPassword = signal(false);
  readonly showConfirm = signal(false);

  readonly token = signal('');
  readonly tokenMissing = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],
      otp: ['', [Validators.required, Validators.pattern(/^\d{6,8}$/)]],
      newPassword: [
        '',
        [Validators.required, passwordValidator(), Validators.maxLength(100)],
      ],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch }
  );

  ngOnInit(): void {
    this.title.setTitle('Đặt lại mật khẩu | Mầm Non Admin');
    this.form.controls.email.setValue(this.route.snapshot.queryParamMap.get('email') ?? '');
  }

  toggleNewPassword(): void {
    this.showPassword.update((v) => !v);
  }

  toggleConfirm(): void {
    this.showConfirm.update((v) => !v);
  }

  onSubmit(): void {
    if (this.form.invalid || this.isLoading()) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set('');

    const { email, otp, newPassword } = this.form.getRawValue();
    this.authService.resetPassword(email, otp, newPassword).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.toast.show(
          'Đặt lại mật khẩu thành công. Vui lòng đăng nhập.',
          'success'
        );
        this.router.navigate(['/login']);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          extractErrorMessage(
            err,
            'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.'
          )
        );
      },
    });
  }
}
