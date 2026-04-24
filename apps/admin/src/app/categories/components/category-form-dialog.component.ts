import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Category } from '@kindergarten-warehouse/data-access';
import { FormFieldComponent } from '../../shared/components/form-field/form-field.component';
import { DialogShellComponent } from '../../shared/components/dialog-shell/dialog-shell.component';

export interface CategoryFormDialogData {
  category: Category | null;
}

export interface CategoryFormDialogResult {
  name: string;
  slug: string;
  description: string;
  icon: string;
  isActive: boolean;
  platform: 'WEB' | 'MOBILE' | 'BOTH';
}

const EMOJI_OPTIONS = ['📚', '🎨', '🎵', '🧩', '🔢', '🌱', '🧸', '🏃', '🧪', '📖', '🎭', '🌈'];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

@Component({
  selector: 'app-category-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, FormFieldComponent, DialogShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-shell
      [title]="data.category ? 'Chỉnh sửa phân loại' : 'Thêm phân loại mới'"
      size="md"
    >
      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
        <app-form-field label="Tên phân loại" [required]="true" [control]="form.controls.name">
          <input type="text" formControlName="name" autofocus maxlength="100" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-kindy-sidebar focus:border-transparent" />
        </app-form-field>

        <app-form-field label="Mô tả" [control]="form.controls.description">
          <textarea formControlName="description" rows="2" maxlength="300" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-kindy-sidebar focus:border-transparent resize-none"></textarea>
        </app-form-field>

        <app-form-field label="Biểu tượng">
          <div class="grid grid-cols-6 gap-2">
            @for (emoji of emojis; track emoji) {
              <button
                type="button"
                (click)="selectIcon(emoji)"
                [attr.aria-label]="'Chọn biểu tượng ' + emoji"
                [attr.aria-pressed]="form.controls.icon.value === emoji"
                class="w-10 h-10 rounded-lg border-2 flex items-center justify-center text-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-kindy-sidebar"
                [class.border-kindy-sidebar]="form.controls.icon.value === emoji"
                [class.bg-kindy-surface-soft]="form.controls.icon.value === emoji"
                [class.border-gray-200]="form.controls.icon.value !== emoji"
              >{{ emoji }}</button>
            }
          </div>
        </app-form-field>

        <div class="grid grid-cols-2 gap-3">
          <app-form-field label="Nền tảng">
            <select formControlName="platform" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-kindy-sidebar">
              <option value="BOTH">Cả hai</option>
              <option value="WEB">Web</option>
              <option value="MOBILE">Mobile</option>
            </select>
          </app-form-field>

          <label class="flex items-end gap-2 pb-2.5">
            <input type="checkbox" formControlName="isActive" class="w-4 h-4 rounded text-kindy-sidebar focus:ring-kindy-sidebar" />
            <span class="text-sm font-medium text-kindy-ink">Đang hoạt động</span>
          </label>
        </div>
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
          {{ data.category ? 'Cập nhật' : 'Tạo mới' }}
        </button>
      </div>
    </app-dialog-shell>
  `,
})
export class CategoryFormDialogComponent {
  private fb = inject(FormBuilder);
  readonly data = inject<CategoryFormDialogData>(DIALOG_DATA);
  readonly ref = inject<DialogRef<CategoryFormDialogResult>>(DialogRef);

  readonly emojis = EMOJI_OPTIONS;

  readonly form = this.fb.nonNullable.group({
    name: [this.data.category?.name ?? '', [Validators.required, Validators.maxLength(100)]],
    slug: [this.data.category?.slug ?? ''],
    description: [this.data.category?.description ?? '', [Validators.maxLength(300)]],
    icon: [this.data.category?.icon ?? EMOJI_OPTIONS[0]],
    isActive: [this.data.category?.isActive ?? true],
    platform: [(this.data.category?.platform as 'WEB' | 'MOBILE' | 'BOTH') ?? 'BOTH'],
  });

  selectIcon(icon: string) {
    this.form.controls.icon.setValue(icon);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    if (!v.slug) v.slug = slugify(v.name);
    this.ref.close(v);
  }
}
