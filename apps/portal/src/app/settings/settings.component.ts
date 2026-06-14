import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';

import {
  AuthService,
  ToastService,
  UserService,
  passwordValidator,
  PASSWORD_RULE_TEXT,
} from '@kindergarten-warehouse/data-access';

type Tab = 'general' | 'security';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly currentUser = this.authService.currentUser;
  readonly activeTab = signal<Tab>('general');
  readonly isSavingGeneral = signal(false);
  readonly isSavingPassword = signal(false);
  readonly isUploadingAvatar = signal(false);

  readonly generalForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required]],
    phoneNumber: ['', [Validators.pattern(/(84|0[3|5|7|8|9])+([0-9]{8})\b/)]],
  });

  readonly passwordRuleText = PASSWORD_RULE_TEXT;

  readonly passwordForm: FormGroup = this.fb.group({
    oldPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, passwordValidator()]],
    confirmNewPassword: ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        if (user) {
          this.generalForm.patchValue(
            {
              fullName: user.fullName,
              phoneNumber: user.phoneNumber ?? '',
            },
            { emitEvent: false }
          );
        }
      });
  }

  onTabChange(tab: Tab): void {
    this.activeTab.set(tab);
  }

  updateProfile(): void {
    if (this.generalForm.invalid || this.isSavingGeneral()) {
      this.generalForm.markAllAsTouched();
      return;
    }
    const { fullName, phoneNumber } = this.generalForm.getRawValue();

    this.isSavingGeneral.set(true);
    this.userService
      .updateProfile({
        fullName: fullName!,
        phoneNumber: phoneNumber || undefined,
      })
      .pipe(finalize(() => this.isSavingGeneral.set(false)))
      .subscribe({
        next: (res) => {
          this.toast.show('Cập nhật thông tin thành công!', 'success');
          if (res.result) this.authService.updateCurrentUser(res.result);
        },
        error: (err: HttpErrorResponse) => {
          this.toast.show(this.messageFor(err, 'Cập nhật thất bại.'), 'error');
        },
      });
  }

  changePassword(): void {
    if (this.passwordForm.invalid || this.isSavingPassword()) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const { oldPassword, newPassword, confirmNewPassword } =
      this.passwordForm.getRawValue();

    if (newPassword !== confirmNewPassword) {
      this.toast.show('Mật khẩu nhập lại không khớp.', 'error');
      return;
    }

    this.isSavingPassword.set(true);
    this.userService
      .changePassword({
        currentPassword: oldPassword!,
        newPassword: newPassword!,
        confirmNewPassword: confirmNewPassword!,
      })
      .pipe(finalize(() => this.isSavingPassword.set(false)))
      .subscribe({
        next: () => {
          this.toast.show('Đổi mật khẩu thành công!', 'success');
          this.passwordForm.reset();
        },
        error: (err: HttpErrorResponse) => {
          this.toast.show(
            this.messageFor(err, 'Đổi mật khẩu thất bại.'),
            'error'
          );
        },
      });
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || this.isUploadingAvatar()) return;

    this.isUploadingAvatar.set(true);
    this.userService
      .uploadAvatar(file)
      .pipe(finalize(() => this.isUploadingAvatar.set(false)))
      .subscribe({
        next: (res) => {
          this.toast.show('Cập nhật avatar thành công!', 'success');
          if (res.result) {
            const fixedUrl = this.authService.formatAssetUrl(res.result.avatarUrl);
            this.authService.updateCurrentUser({
              ...res.result,
              avatarUrl: fixedUrl,
            });
          }
          input.value = '';
        },
        error: (err: HttpErrorResponse) => {
          this.toast.show(
            this.messageFor(err, 'Tải avatar thất bại.'),
            'error'
          );
        },
      });
  }

  private messageFor(err: HttpErrorResponse, fallback: string): string {
    if (err.status === 0) return 'Không thể kết nối đến máy chủ.';
    const backend = (err.error as { message?: string } | null)?.message;
    return backend || err.message || fallback;
  }
}
