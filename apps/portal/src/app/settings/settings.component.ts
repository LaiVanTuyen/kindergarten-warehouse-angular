import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, UserService } from '@kindergarten-warehouse/data-access';
import { catchError, of, tap } from 'rxjs';
import { ToastService } from '@kindergarten-warehouse/data-access';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private toastService = inject(ToastService);

  currentUser$ = this.authService.currentUser$;
  activeTab: 'general' | 'security' = 'general';

  // General Form
  generalForm = this.fb.group({
    fullName: ['', [Validators.required]],
    phoneNumber: ['', [Validators.pattern(/(84|0[3|5|7|8|9])+([0-9]{8})\b/)]],
    avatar: [null],
  });

  // Password Form
  passwordForm = this.fb.group({
    oldPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmNewPassword: ['', [Validators.required]],
  });

  // Init form with user data
  ngOnInit() {
    this.currentUser$.subscribe((user) => {
      if (user) {
        this.generalForm.patchValue({
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
        });
      }
    });
  }

  onTabChange(tab: 'general' | 'security') {
    this.activeTab = tab;
  }

  // --- Actions ---

  updateProfile() {
    if (this.generalForm.invalid) return;

    const { fullName, phoneNumber } = this.generalForm.value;

    this.userService
      .updateProfile({
        fullName: fullName!,
        phoneNumber: phoneNumber || undefined, // Handle empty string as undefined
      })
      .pipe(
        tap((res: any) => {
          this.toastService.show('Cập nhật thông tin thành công!', 'success');

          // Update local user state
          if (res.result) {
            this.authService.updateCurrentUser(res.result);
          }
        }),
        catchError((err: any) => {
          this.toastService.show(err.message || 'Có lỗi xảy ra', 'error');
          return of(null);
        })
      )
      .subscribe();
  }

  changePassword() {
    if (this.passwordForm.invalid) return;
    const { oldPassword, newPassword, confirmNewPassword } =
      this.passwordForm.value;

    if (newPassword !== confirmNewPassword) {
      this.toastService.show('Mật khẩu nhập lại không khớp', 'error');
      return;
    }

    this.userService
      .changePassword({
        currentPassword: oldPassword!,
        newPassword: newPassword!,
        confirmNewPassword: confirmNewPassword!,
      })
      .pipe(
        tap(() => {
          this.toastService.show('Đổi mật khẩu thành công!', 'success');
          this.passwordForm.reset();
        }),
        catchError((err: any) => {
          this.toastService.show(
            err.message || 'Đổi mật khẩu thất bại',
            'error'
          );
          return of(null);
        })
      )
      .subscribe();
  }

  onAvatarSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.userService
        .uploadAvatar(file)
        .pipe(
          tap((res: any) => {
            this.toastService.show('Cập nhật avatar thành công!', 'success');

            if (res.result) {
              // Fix MinIO URL if needed
              const fixedUrl = this.formatAvatarUrl(res.result.avatarUrl);
              const updatedUser = { ...res.result, avatarUrl: fixedUrl };
              this.authService.updateCurrentUser(updatedUser);
            }
          }),
          catchError((err: any) => {
            this.toastService.show(err.message || 'Upload thất bại', 'error');
            return of(null);
          })
        )
        .subscribe();
    }
  }

  // Helper to fix MinIO URL in Local Dev environment
  private formatAvatarUrl(url: string | undefined): string {
    if (!url) return '';
    if (url.includes('minio:9000')) {
      return url.replace('minio:9000', 'localhost:9000');
    }
    return url;
  }
}
