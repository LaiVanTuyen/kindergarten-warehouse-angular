import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  UserService,
  extractErrorMessage,
} from '@kindergarten-warehouse/data-access';
import { DialogShellComponent } from '../../shared/components/dialog-shell/dialog-shell.component';

export interface PasswordResetDialogData {
  userId: string | number;
  userName: string;
}

@Component({
  selector: 'app-password-reset-dialog',
  standalone: true,
  imports: [FormsModule, DialogShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-shell
      [title]="stepTitle()"
      [subtitle]="'Tài khoản: ' + data.userName"
      size="sm"
    >
      @if (step() === 'init') {
        <p class="text-sm text-kindy-ink mb-3">
          Hệ thống sẽ gửi mã OTP tới email quản trị. Bạn dùng mã đó để xác nhận và nhận mật khẩu tạm thời.
        </p>
        @if (error()) {
          <p role="alert" class="text-xs text-kindy-coral-strong">{{ error() }}</p>
        }
      } @else if (step() === 'otp') {
        <label for="reset-pw-otp" class="block text-sm font-medium text-kindy-ink mb-2">
          Mã OTP 6 chữ số
        </label>
        <input
          id="reset-pw-otp"
          type="text"
          inputmode="numeric"
          maxlength="6"
          [ngModel]="otp()"
          (ngModelChange)="onOtpChange($event)"
          placeholder="••••••"
          class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-center tracking-[0.5em] text-lg font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-kindy-sidebar"
        />
        @if (error()) {
          <p role="alert" class="text-xs text-kindy-coral-strong mt-2">{{ error() }}</p>
        }
      } @else {
        <p class="text-sm text-kindy-ink mb-2">Mật khẩu tạm thời:</p>
        <div class="bg-kindy-mint-soft border border-emerald-300 rounded-lg p-3 text-center font-mono text-base font-bold text-emerald-800 select-all mb-3">
          {{ newPassword() }}
        </div>
        @if (copied()) {
          <p class="text-xs text-emerald-700 mb-2">Đã sao chép vào clipboard.</p>
        } @else {
          <button
            type="button"
            (click)="copyPassword()"
            class="text-xs font-semibold text-kindy-sidebar hover:underline mb-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-kindy-sky rounded-md px-1"
          >📋 Sao chép mật khẩu</button>
        }
        <p class="text-xs text-kindy-ink-soft">
          Gửi an toàn cho người dùng. Yêu cầu họ đổi ngay sau khi đăng nhập.
        </p>
      }

      <div actions class="contents">
        @if (step() === 'init') {
          <button
            type="button"
            (click)="ref.close()"
            class="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-kindy-sky"
          >Huỷ</button>
          <button
            type="button"
            (click)="initiate()"
            [disabled]="loading()"
            class="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-kindy-sidebar hover:bg-kindy-sidebar-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-kindy-sidebar disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            @if (loading()) {
              <span aria-hidden="true" class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
            }
            Gửi mã OTP
          </button>
        } @else if (step() === 'otp') {
          <button
            type="button"
            (click)="ref.close()"
            class="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-kindy-sky"
          >Huỷ</button>
          <button
            type="button"
            (click)="confirm()"
            [disabled]="otp().length !== 6 || loading()"
            class="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-kindy-sidebar hover:bg-kindy-sidebar-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-kindy-sidebar disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            @if (loading()) {
              <span aria-hidden="true" class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
            }
            Xác nhận
          </button>
        } @else {
          <button
            type="button"
            (click)="ref.close(true)"
            class="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-kindy-sidebar hover:bg-kindy-sidebar-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-kindy-sidebar"
          >Đóng</button>
        }
      </div>
    </app-dialog-shell>
  `,
})
export class PasswordResetDialogComponent {
  private userService = inject(UserService);
  private destroyRef = inject(DestroyRef);
  readonly data = inject<PasswordResetDialogData>(DIALOG_DATA);
  readonly ref = inject<DialogRef<boolean>>(DialogRef);

  readonly step = signal<'init' | 'otp' | 'done'>('init');
  readonly loading = signal(false);
  readonly otp = signal('');
  readonly error = signal('');
  readonly newPassword = signal('');
  readonly copied = signal(false);

  stepTitle(): string {
    switch (this.step()) {
      case 'init':
        return 'Đặt lại mật khẩu';
      case 'otp':
        return 'Nhập mã OTP';
      default:
        return 'Đã đặt lại';
    }
  }

  onOtpChange(v: string) {
    this.otp.set(v.replace(/\D/g, '').slice(0, 6));
    this.error.set('');
  }

  initiate() {
    this.loading.set(true);
    this.error.set('');
    this.userService
      .initiatePasswordReset(this.data.userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.step.set('otp');
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          this.error.set(extractErrorMessage(err, 'Không gửi được mã OTP.'));
        },
      });
  }

  confirm() {
    this.loading.set(true);
    this.error.set('');
    this.userService
      .completePasswordReset(this.data.userId, this.otp())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.newPassword.set(res.result ?? '••••••••');
          this.step.set('done');
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          this.error.set(extractErrorMessage(err, 'Mã OTP không hợp lệ.'));
        },
      });
  }

  async copyPassword() {
    try {
      await navigator.clipboard.writeText(this.newPassword());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      // Clipboard API unavailable — fall back to select-all prompt.
      this.copied.set(false);
    }
  }
}
