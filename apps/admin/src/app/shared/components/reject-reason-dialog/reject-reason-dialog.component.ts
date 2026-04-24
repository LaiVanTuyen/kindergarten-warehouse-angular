import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';
import { DialogShellComponent } from '../dialog-shell/dialog-shell.component';

export interface RejectReasonDialogData {
  title?: string;
  resourceTitle: string;
}

const PRESET_REASONS = [
  'Nội dung không phù hợp độ tuổi mầm non',
  'Chất lượng hình ảnh / âm thanh kém',
  'Nội dung trùng lặp với tài nguyên đã có',
  'Thiếu thông tin mô tả / thẻ phân loại',
  'Vi phạm bản quyền',
];

@Component({
  selector: 'app-reject-reason-dialog',
  standalone: true,
  imports: [FormsModule, DialogShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-shell
      [title]="data.title || 'Lý do từ chối'"
      [subtitle]="'Tài nguyên: &quot;' + data.resourceTitle + '&quot;'"
      size="md"
    >
      <fieldset>
        <legend class="text-sm font-medium text-kindy-ink mb-2">
          Chọn lý do có sẵn
        </legend>
        <div class="space-y-2">
          @for (preset of presets; track preset) {
            <label class="flex items-start gap-2 p-2 rounded-lg hover:bg-kindy-surface-soft cursor-pointer">
              <input
                type="radio"
                name="reject-preset"
                [value]="preset"
                [ngModel]="selectedPreset()"
                (ngModelChange)="onPreset($event)"
                class="mt-1 text-kindy-sidebar focus:ring-kindy-sidebar"
              />
              <span class="text-sm text-kindy-ink">{{ preset }}</span>
            </label>
          }
          <label class="flex items-start gap-2 p-2 rounded-lg hover:bg-kindy-surface-soft cursor-pointer">
            <input
              type="radio"
              name="reject-preset"
              value=""
              [ngModel]="selectedPreset()"
              (ngModelChange)="onPreset($event)"
              class="mt-1 text-kindy-sidebar focus:ring-kindy-sidebar"
            />
            <span class="text-sm text-kindy-ink">Lý do khác…</span>
          </label>
        </div>
      </fieldset>

      <div class="mt-4">
        <label for="reject-reason-text" class="block text-sm font-medium text-kindy-ink mb-2">
          Chi tiết (tuỳ chọn)
        </label>
        <textarea
          id="reject-reason-text"
          rows="3"
          [ngModel]="customReason()"
          (ngModelChange)="customReason.set($event)"
          maxlength="500"
          placeholder="Thông tin thêm để người tải lên sửa đổi…"
          class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-kindy-ink placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-kindy-sidebar focus:border-transparent"
        ></textarea>
      </div>

      <div actions class="contents">
        <button
          type="button"
          (click)="ref.close()"
          class="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-kindy-sky"
        >
          Huỷ
        </button>
        <button
          type="button"
          (click)="submit()"
          [disabled]="!finalReason()"
          class="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-kindy-coral-strong hover:bg-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-kindy-coral-strong disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Từ chối
        </button>
      </div>
    </app-dialog-shell>
  `,
})
export class RejectReasonDialogComponent {
  readonly data = inject<RejectReasonDialogData>(DIALOG_DATA);
  readonly ref = inject<DialogRef<string | undefined>>(DialogRef);

  readonly presets = PRESET_REASONS;
  readonly selectedPreset = signal<string>(PRESET_REASONS[0]);
  readonly customReason = signal<string>('');

  finalReason(): string {
    const preset = this.selectedPreset();
    const custom = this.customReason().trim();
    if (preset && custom) return `${preset} — ${custom}`;
    return preset || custom;
  }

  onPreset(value: string) {
    this.selectedPreset.set(value);
  }

  submit() {
    const reason = this.finalReason();
    if (reason) this.ref.close(reason);
  }
}
