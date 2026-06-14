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
  Validators,
} from '@angular/forms';
import { NgStyle } from '@angular/common';
import { Banner } from '@kindergarten-warehouse/data-access';
import { FormFieldComponent } from '../../shared/components/form-field/form-field.component';
import { DialogShellComponent } from '../../shared/components/dialog-shell/dialog-shell.component';

export interface BannerFormDialogData {
  banner: Banner | null;
}

export interface BannerFormDialogResult {
  values: {
    title: string;
    subtitle: string;
    link: string;
    bgFrom: string;
    bgTo: string;
    platform: 'WEB' | 'MOBILE';
    visibility: 'PUBLIC' | 'PRIVATE';
    startDate: string;
    endDate: string;
  };
  imageFile: File | null;
}

export const BANNER_THEMES = [
  { id: 'purple-amber', name: 'Tím nhạt - Cam nhạt', from: 'from-purple-50', to: 'to-amber-50', hexFrom: '#FAF5FF', hexTo: '#FFFBEB' },
  { id: 'blue-cyan', name: 'Xanh nhạt - Cyan nhạt', from: 'from-blue-50', to: 'to-cyan-50', hexFrom: '#EFF6FF', hexTo: '#ECFEFF' },
  { id: 'orange-rose', name: 'Cam nhạt - Hồng nhạt', from: 'from-orange-50', to: 'to-rose-50', hexFrom: '#FFF7ED', hexTo: '#FFF1F2' },
  { id: 'green-emerald', name: 'Xanh lá nhạt - Ngọc lục bảo nhạt', from: 'from-green-50', to: 'to-emerald-50', hexFrom: '#F0FDF4', hexTo: '#ECFDF5' },
  { id: 'pink-fuchsia', name: 'Hồng đậm - Fuchsia đậm', from: 'from-pink-500', to: 'to-fuchsia-500', hexFrom: '#EC4899', hexTo: '#D946EF' },
];

export function getThemeByTailwind(from?: string, to?: string) {
  return BANNER_THEMES.find(t => t.from === from && t.to === to) || BANNER_THEMES[0];
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function extractDateStr(val: any): string {
  if (!val) return '';
  if (Array.isArray(val)) {
    const y = val[0];
    const m = String(val[1]).padStart(2, '0');
    const d = String(val[2]).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof val === 'string') {
    return val.split('T')[0];
  }
  return '';
}

function dateRangeValidator(group: AbstractControl) {
  const start = group.get('startDate')?.value;
  const end = group.get('endDate')?.value;
  return start && end && start > end ? { dateRange: true } : null;
}

@Component({
  selector: 'app-banner-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, FormFieldComponent, DialogShellComponent, NgStyle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-shell
      [title]="isEdit() ? 'Chỉnh sửa banner' : 'Thêm banner mới'"
      size="xl"
    >
      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
        <!-- Image upload -->
        <app-form-field label="Ảnh banner" [required]="!isEdit()">
          <div class="flex items-start gap-4">
            <label
              for="banner-image"
              class="w-32 h-20 rounded-lg border-2 border-dashed border-line hover:border-kindy-sidebar bg-kindy-surface-soft flex items-center justify-center cursor-pointer overflow-hidden focus-within:ring-2 focus-within:ring-kindy-sidebar flex-shrink-0"
            >
              @if (previewUrl()) {
                <img [src]="previewUrl()" alt="" class="w-full h-full object-cover" />
              } @else {
                <span aria-hidden="true" class="text-kindy-ink-soft text-xs text-center px-2">
                  Chọn ảnh<br />(JPG/PNG/WebP, ≤5MB)
                </span>
              }
            </label>
            <input
              id="banner-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              (change)="onFileSelected($event)"
              class="sr-only"
            />
            <div class="text-xs text-kindy-ink-soft">
              <p>Tỉ lệ khuyến nghị: 16:9 hoặc 21:9</p>
              <p>Kích thước tối đa: 5MB</p>
              @if (imageError()) {
                <p role="alert" class="text-kindy-coral-strong mt-1">{{ imageError() }}</p>
              }
            </div>
          </div>
        </app-form-field>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <app-form-field label="Tiêu đề" [required]="true" [control]="form.controls.title">
            <input type="text" formControlName="title" maxlength="120" class="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus:border-transparent" />
          </app-form-field>
          <app-form-field label="Phụ đề" [control]="form.controls.subtitle">
            <input type="text" formControlName="subtitle" maxlength="200" class="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus:border-transparent" />
          </app-form-field>
        </div>

        <app-form-field
          label="Đường dẫn khi click"
          hint="URL nội bộ (/resources) hoặc đầy đủ (https://...)"
          [control]="form.controls.link"
        >
          <input type="text" formControlName="link" placeholder="/resources hoặc https://..." class="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus:border-transparent" />
        </app-form-field>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <app-form-field label="Phối màu nền" [required]="true" [control]="form.controls.theme">
            <select formControlName="theme" class="w-full px-3 py-2 border border-line rounded-lg text-sm bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus:border-transparent">
              @for (t of bannerThemes; track t.id) {
                <option [value]="t.id">{{ t.name }}</option>
              }
            </select>
          </app-form-field>
          <app-form-field label="Nền tảng" [required]="true" [control]="form.controls.platform">
            <select formControlName="platform" class="w-full px-3 py-2 border border-line rounded-lg text-sm bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus:border-transparent">
              <option value="WEB">Web</option>
              <option value="MOBILE">Mobile</option>
            </select>
          </app-form-field>
        </div>

        <div
          class="h-16 rounded-lg border border-line"
          [ngStyle]="getGradientStyle()"
          aria-hidden="true"
        ></div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <app-form-field label="Bắt đầu" [control]="form.controls.startDate">
            <input type="date" formControlName="startDate" class="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus:border-transparent" />
          </app-form-field>
          <app-form-field label="Kết thúc" [control]="form.controls.endDate">
            <input type="date" formControlName="endDate" class="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus:border-transparent" />
          </app-form-field>
        </div>
        @if (form.errors?.['dateRange']) {
          <p role="alert" class="text-xs text-kindy-coral-strong -mt-2">Ngày kết thúc phải sau ngày bắt đầu.</p>
        }

        <label class="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" formControlName="isPublic" class="w-4 h-4 rounded text-kindy-sidebar focus:ring-focus" />
          <span class="text-sm font-medium text-kindy-ink">Hiển thị công khai</span>
        </label>
      </form>

      <div actions class="contents">
        <button
          type="button"
          (click)="ref.close()"
          class="px-4 py-2 text-sm font-semibold rounded-lg border border-line text-ink-soft hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-kindy-sky"
        >Huỷ</button>
        <button
          type="button"
          (click)="submit()"
          [disabled]="form.invalid || (!isEdit() && !imageFile())"
          class="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-kindy-sidebar hover:bg-kindy-sidebar-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-focus disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ isEdit() ? 'Cập nhật' : 'Tạo banner' }}
        </button>
      </div>
    </app-dialog-shell>
  `,
})
export class BannerFormDialogComponent {
  private fb = inject(FormBuilder);
  readonly data = inject<BannerFormDialogData>(DIALOG_DATA);
  readonly ref = inject<DialogRef<BannerFormDialogResult>>(DialogRef);

  readonly imageFile = signal<File | null>(null);
  readonly previewUrl = signal<string>(this.data.banner?.imageUrl || '');
  readonly imageError = signal<string>('');
  readonly isEdit = signal<boolean>(!!this.data.banner);

  readonly form = this.fb.nonNullable.group(
    {
      title: [this.data.banner?.title ?? '', [Validators.required, Validators.maxLength(120)]],
      subtitle: [this.data.banner?.subtitle ?? '', [Validators.maxLength(200)]],
      link: [this.data.banner?.link ?? ''],
      theme: [getThemeByTailwind(this.data.banner?.bgFrom, this.data.banner?.bgTo).id],
      platform: [(this.data.banner?.platform as 'WEB' | 'MOBILE') ?? 'WEB'],
      isPublic: [this.data.banner ? this.data.banner.visibility === 'PUBLIC' : true],
      startDate: [extractDateStr(this.data.banner?.startDate)],
      endDate: [extractDateStr(this.data.banner?.endDate)],
    },
    { validators: dateRangeValidator }
  );

  readonly bannerThemes = BANNER_THEMES;

  getGradientStyle() {
    const themeId = this.form.controls.theme.value;
    const theme = BANNER_THEMES.find(t => t.id === themeId) || BANNER_THEMES[0];
    return { 'background-image': `linear-gradient(135deg, ${theme.hexFrom}, ${theme.hexTo})` };
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      this.imageError.set('Chỉ hỗ trợ JPG, PNG hoặc WebP.');
      input.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      this.imageError.set('Ảnh vượt quá 5MB.');
      input.value = '';
      return;
    }

    this.imageError.set('');
    this.imageFile.set(file);

    const reader = new FileReader();
    reader.onload = () => this.previewUrl.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const theme = BANNER_THEMES.find(t => t.id === raw.theme) || BANNER_THEMES[0];
    
    // Construct values object without theme, but with bgFrom/bgTo
    const values = {
      title: raw.title,
      subtitle: raw.subtitle,
      link: raw.link,
      bgFrom: theme.from,
      bgTo: theme.to,
      platform: raw.platform,
      visibility: (raw.isPublic ? 'PUBLIC' : 'PRIVATE') as 'PUBLIC' | 'PRIVATE',
      startDate: raw.startDate,
      endDate: raw.endDate
    };

    this.ref.close({
      values,
      imageFile: this.imageFile(),
    });
  }
}
