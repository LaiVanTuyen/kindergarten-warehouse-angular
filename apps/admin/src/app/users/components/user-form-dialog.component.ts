import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { User, UserRole } from '@kindergarten-warehouse/data-access';
import { FormFieldComponent } from '../../shared/components/form-field/form-field.component';
import { DialogShellComponent } from '../../shared/components/dialog-shell/dialog-shell.component';

export interface UserFormDialogData {
  user: User | null;
}

export interface UserFormDialogResult {
  fullName: string;
  username: string;
  email: string;
  password?: string;
  roles: string[];
  status: 'ACTIVE' | 'BLOCKED';
}

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'ADMIN', label: 'Quản trị viên' },
  { value: 'TEACHER', label: 'Giáo viên' },
  { value: 'USER', label: 'Người dùng' },
];

function rolesMinLength(control: AbstractControl): ValidationErrors | null {
  const v = control.value as string[] | null;
  return v && v.length > 0 ? null : { required: true };
}

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, FormFieldComponent, DialogShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-shell
      [title]="isEdit ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'"
      size="lg"
    >
      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
        <app-form-field label="Họ và tên" [required]="true" [control]="form.controls.fullName">
          <input type="text" formControlName="fullName" autofocus maxlength="100" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-kindy-sidebar focus:border-transparent" />
        </app-form-field>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <app-form-field label="Tên đăng nhập" [required]="true" [control]="form.controls.username">
            <input type="text" formControlName="username" autocomplete="username" maxlength="50" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-kindy-sidebar focus:border-transparent" />
          </app-form-field>
          <app-form-field label="Email" [required]="true" [control]="form.controls.email">
            <input type="email" formControlName="email" autocomplete="email" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-kindy-sidebar focus:border-transparent" />
          </app-form-field>
        </div>

        @if (!isEdit) {
          <app-form-field
            label="Mật khẩu khởi tạo"
            [required]="true"
            [control]="form.controls.password"
            hint="Tối thiểu 8 ký tự — sẽ yêu cầu đổi sau lần đăng nhập đầu."
          >
            <div class="flex gap-2">
              <input
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="password"
                autocomplete="new-password"
                class="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-kindy-sidebar focus:border-transparent"
              />
              <button
                type="button"
                (click)="togglePassword()"
                [attr.aria-label]="showPassword() ? 'Ẩn' : 'Hiện'"
                class="px-3 border border-gray-200 rounded-lg text-sm text-kindy-ink-soft hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-kindy-sidebar"
              >{{ showPassword() ? 'Ẩn' : 'Hiện' }}</button>
              <button
                type="button"
                (click)="generatePassword()"
                class="px-3 border border-gray-200 rounded-lg text-sm text-kindy-sidebar hover:bg-kindy-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-kindy-sidebar"
              >Tạo ngẫu nhiên</button>
            </div>
          </app-form-field>
        }

        <app-form-field
          label="Vai trò"
          [required]="true"
          [control]="form.controls.roles"
          [errors]="{ required: 'Chọn ít nhất 1 vai trò.' }"
        >
          <div class="space-y-2">
            @for (opt of roleOptions; track opt.value) {
              <label class="flex items-center gap-3 p-2 rounded-lg hover:bg-kindy-surface-soft cursor-pointer">
                <input
                  type="checkbox"
                  [checked]="form.controls.roles.value.includes(opt.value)"
                  (change)="toggleRole(opt.value)"
                  class="w-4 h-4 rounded text-kindy-sidebar focus:ring-kindy-sidebar"
                />
                <span class="text-sm text-kindy-ink">{{ opt.label }}</span>
              </label>
            }
          </div>
        </app-form-field>

        <app-form-field label="Trạng thái" [control]="form.controls.status">
          <select formControlName="status" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-kindy-sidebar">
            <option value="ACTIVE">Hoạt động</option>
            <option value="BLOCKED">Đã khoá</option>
          </select>
        </app-form-field>
      </form>

      <div actions class="contents">
        <button
          type="button"
          (click)="ref.close()"
          class="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-kindy-sky"
        >Huỷ</button>
        <button
          type="button"
          (click)="submit()"
          [disabled]="form.invalid"
          class="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-kindy-sidebar hover:bg-kindy-sidebar-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-kindy-sidebar disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ isEdit ? 'Cập nhật' : 'Tạo tài khoản' }}
        </button>
      </div>
    </app-dialog-shell>
  `,
})
export class UserFormDialogComponent {
  private fb = inject(FormBuilder);
  readonly data = inject<UserFormDialogData>(DIALOG_DATA);
  readonly ref = inject<DialogRef<UserFormDialogResult>>(DialogRef);

  readonly isEdit = !!this.data.user;
  readonly roleOptions = ROLE_OPTIONS;
  readonly showPassword = signal(false);

  readonly form = this.fb.nonNullable.group({
    fullName: [
      this.data.user?.fullName ?? '',
      [Validators.required, Validators.maxLength(100)],
    ],
    username: [
      this.data.user?.username ?? '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(50)],
    ],
    email: [
      this.data.user?.email ?? '',
      [Validators.required, Validators.email],
    ],
    password: [
      '',
      this.isEdit
        ? []
        : [Validators.required, Validators.minLength(8), Validators.maxLength(128)],
    ],
    roles: [
      (this.data.user?.roles as string[] | undefined) ??
        (this.data.user?.role ? [this.data.user.role] : ['USER']),
      [rolesMinLength],
    ],
    status: [
      ((this.data.user?.status as 'ACTIVE' | 'BLOCKED' | undefined) ?? 'ACTIVE') as
        | 'ACTIVE'
        | 'BLOCKED',
    ],
  });

  togglePassword() {
    this.showPassword.update((v) => !v);
  }

  generatePassword() {
    const charset =
      'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$%';
    const length = 14;
    const arr = new Uint32Array(length);
    crypto.getRandomValues(arr);
    const pw = Array.from(arr, (n) => charset[n % charset.length]).join('');
    this.form.controls.password.setValue(pw);
    this.showPassword.set(true);
  }

  toggleRole(role: string) {
    const current = new Set(this.form.controls.roles.value);
    if (current.has(role)) current.delete(role);
    else current.add(role);
    this.form.controls.roles.setValue(Array.from(current));
    this.form.controls.roles.markAsDirty();
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const result: UserFormDialogResult = {
      fullName: v.fullName,
      username: v.username,
      email: v.email,
      roles: v.roles,
      status: v.status,
    };
    if (!this.isEdit) result.password = v.password;
    this.ref.close(result);
  }
}
