import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Topic } from '@kindergarten-warehouse/data-access';
import { FormFieldComponent } from '../../shared/components/form-field/form-field.component';
import { DialogShellComponent } from '../../shared/components/dialog-shell/dialog-shell.component';

export interface TopicFormDialogData {
  topic: Topic | null;
  categoryId: string;
  categoryName: string;
}

export interface TopicFormDialogResult {
  name: string;
  slug: string;
  description: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  categoryId: string;
}

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
  selector: 'app-topic-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, FormFieldComponent, DialogShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-shell
      [title]="data.topic ? 'Chỉnh sửa chủ đề' : 'Thêm chủ đề mới'"
      [subtitle]="'Trong phân loại: ' + data.categoryName"
      size="md"
    >
      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
        <app-form-field label="Tên chủ đề" [required]="true" [control]="form.controls.name">
          <input type="text" formControlName="name" maxlength="100" class="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus:border-transparent" />
        </app-form-field>

        <app-form-field label="Mô tả" [control]="form.controls.description">
          <textarea formControlName="description" rows="3" maxlength="300" class="w-full px-3 py-2 border border-line rounded-lg text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus:border-transparent resize-none"></textarea>
        </app-form-field>

        <label class="flex items-center gap-2">
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
          [disabled]="form.invalid"
          class="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-kindy-sidebar hover:bg-kindy-sidebar-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-focus disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ data.topic ? 'Cập nhật' : 'Tạo mới' }}
        </button>
      </div>
    </app-dialog-shell>
  `,
})
export class TopicFormDialogComponent {
  private fb = inject(FormBuilder);
  readonly data = inject<TopicFormDialogData>(DIALOG_DATA);
  readonly ref = inject<DialogRef<TopicFormDialogResult>>(DialogRef);

  readonly form = this.fb.nonNullable.group({
    name: [this.data.topic?.name ?? '', [Validators.required, Validators.maxLength(100)]],
    slug: [this.data.topic?.slug ?? ''],
    description: [this.data.topic?.description ?? '', [Validators.maxLength(300)]],
    isPublic: [this.data.topic ? this.data.topic.visibility !== 'PRIVATE' : true],
  });

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.ref.close({
      name: v.name,
      slug: v.slug || slugify(v.name),
      description: v.description,
      visibility: v.isPublic ? 'PUBLIC' : 'PRIVATE',
      categoryId: this.data.categoryId,
    });
  }
}
