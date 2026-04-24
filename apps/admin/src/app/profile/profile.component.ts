import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AuthService,
  UserService,
  ToastService,
  ChangePasswordRequest,
  UpdateProfileRequest,
  extractErrorMessage,
} from '@kindergarten-warehouse/data-access';
import { PageHeaderComponent } from '../shared/components/page-header/page-header.component';
import { AvatarComponent } from '../shared/components/avatar/avatar.component';
import { StatusPillComponent } from '../shared/components/status-pill/status-pill.component';
import { FormFieldComponent } from '../shared/components/form-field/form-field.component';

type TabKey = 'general' | 'security';
const MAX_AVATAR_SIZE = 3 * 1024 * 1024;
const ACCEPTED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pw = group.get('newPassword')?.value;
  const cf = group.get('confirmPassword')?.value;
  return pw && cf && pw !== cf ? { passwordsMismatch: true } : null;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    PageHeaderComponent,
    AvatarComponent,
    StatusPillComponent,
    FormFieldComponent,
  ],
  templateUrl: './profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  readonly user = toSignal(this.authService.currentUser$, { initialValue: null });
  readonly activeTab = signal<TabKey>('general');
  readonly isSavingProfile = signal(false);
  readonly isChangingPassword = signal(false);
  readonly isUploadingAvatar = signal(false);
  readonly showOldPw = signal(false);
  readonly showNewPw = signal(false);
  readonly showConfirmPw = signal(false);

  readonly profileForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.maxLength(100)]],
    phoneNumber: ['', [Validators.pattern(/^[0-9+\-\s()]{6,20}$/)]],
    bio: ['', [Validators.maxLength(500)]],
  });

  readonly passwordForm = this.fb.nonNullable.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: [
        '',
        [Validators.required, Validators.minLength(8), Validators.maxLength(128)],
      ],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch }
  );

  readonly displayedRoles = computed(() => {
    const u = this.user();
    if (!u) return [] as string[];
    if (u.roles && u.roles.length > 0) return u.roles;
    return u.role ? [u.role] : [];
  });

  readonly avatarUrl = computed(() =>
    this.authService.formatAvatarUrl(this.user()?.avatarUrl)
  );

  private formHydrated = false;

  constructor() {
    // Sync profile form when user loads. Guarded so that mid-typing user
    // edits aren't overwritten by a late `updateCurrentUser` emission.
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((u) => {
        if (!u) return;
        // Only re-patch on initial load or after a successful save (which
        // explicitly marks the form pristine).
        if (!this.formHydrated || this.profileForm.pristine) {
          this.profileForm.patchValue({
            fullName: u.fullName ?? '',
            phoneNumber: u.phoneNumber ?? '',
            bio: u.bio ?? '',
          });
          this.profileForm.markAsPristine();
          this.formHydrated = true;
        }
      });
  }

  setTab(tab: TabKey) {
    this.activeTab.set(tab);
  }

  onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      this.toast.show('Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.', 'error');
      input.value = '';
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      this.toast.show('Ảnh đại diện tối đa 3MB.', 'error');
      input.value = '';
      return;
    }
    this.isUploadingAvatar.set(true);
    this.userService
      .uploadAvatar(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.isUploadingAvatar.set(false);
          if (res.result) this.authService.updateCurrentUser(res.result);
          this.toast.show('Đã cập nhật ảnh đại diện.', 'success');
        },
        error: (err: HttpErrorResponse) => {
          this.isUploadingAvatar.set(false);
          this.toast.show(
            extractErrorMessage(err, 'Không tải được ảnh lên.'),
            'error'
          );
        },
      });
    input.value = '';
  }

  saveProfile() {
    if (this.profileForm.invalid || this.isSavingProfile()) {
      this.profileForm.markAllAsTouched();
      return;
    }
    const data: UpdateProfileRequest = this.profileForm.getRawValue();
    this.isSavingProfile.set(true);
    this.userService
      .updateProfile(data)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.isSavingProfile.set(false);
          // Mark pristine BEFORE updateCurrentUser triggers the subject —
          // otherwise the subscribe in constructor sees a dirty form and skips.
          this.profileForm.markAsPristine();
          if (res.result) this.authService.updateCurrentUser(res.result);
          this.toast.show('Đã lưu thay đổi.', 'success');
        },
        error: (err: HttpErrorResponse) => {
          this.isSavingProfile.set(false);
          this.toast.show(
            extractErrorMessage(err, 'Không lưu được hồ sơ.'),
            'error'
          );
        },
      });
  }

  changePassword() {
    if (this.passwordForm.invalid || this.isChangingPassword()) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const { currentPassword, newPassword, confirmPassword } =
      this.passwordForm.getRawValue();
    const data: ChangePasswordRequest = {
      currentPassword,
      newPassword,
      confirmNewPassword: confirmPassword,
    };
    this.isChangingPassword.set(true);
    this.userService
      .changePassword(data)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isChangingPassword.set(false);
          this.passwordForm.reset();
          this.toast.show('Đổi mật khẩu thành công.', 'success');
        },
        error: (err: HttpErrorResponse) => {
          this.isChangingPassword.set(false);
          this.toast.show(
            extractErrorMessage(err, 'Không đổi được mật khẩu.'),
            'error'
          );
        },
      });
  }

  passwordStrength(pw: string): { label: string; pct: number; cls: string } {
    if (!pw) return { label: '', pct: 0, cls: '' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const steps = [
      { label: 'Rất yếu', pct: 20, cls: 'bg-kindy-coral-strong' },
      { label: 'Yếu', pct: 40, cls: 'bg-kindy-coral' },
      { label: 'Trung bình', pct: 60, cls: 'bg-kindy-sun' },
      { label: 'Khá', pct: 80, cls: 'bg-kindy-sky' },
      { label: 'Mạnh', pct: 100, cls: 'bg-kindy-mint' },
    ];
    return steps[Math.max(0, Math.min(score - 1, 4))] ?? steps[0];
  }
}
