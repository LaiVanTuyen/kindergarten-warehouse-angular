import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { map } from 'rxjs/operators';

import {
  AgeGroup,
  CollectionSummary,
  CollectionUpsert,
  ResourceService,
} from '@kindergarten-warehouse/data-access';

/** Create/edit dialog for a "bộ học liệu". Emits the payload; the parent calls the API. */
@Component({
  selector: 'app-collection-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true"
      aria-labelledby="collection-form-title" (click)="cancel.emit()">
      <form [formGroup]="form" (ngSubmit)="submit()" (click)="$event.stopPropagation()"
        class="w-full max-w-lg bg-surface rounded-2xl shadow-xl p-6 space-y-4">
        <h2 id="collection-form-title" class="text-lg font-bold text-ink">
          {{ initial ? 'Sửa bộ học liệu' : 'Tạo bộ học liệu' }}
        </h2>

        <label class="block text-sm font-semibold text-ink">
          Tên bộ <span class="text-danger" aria-hidden="true">*</span>
          <input formControlName="title" maxlength="200" placeholder="VD: Động vật quanh bé — lớp 4–5 tuổi"
            class="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2.5 font-normal text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-focus" />
          <span *ngIf="form.controls.title.invalid && form.controls.title.touched" class="text-xs text-danger font-normal" role="alert">
            Vui lòng nhập tên bộ.
          </span>
        </label>

        <label class="block text-sm font-semibold text-ink">
          Mô tả <span class="font-normal text-ink-muted">(không bắt buộc)</span>
          <textarea formControlName="description" maxlength="2000" rows="3"
            placeholder="Mục đích buổi học, cách dùng bộ này…"
            class="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2.5 font-normal text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"></textarea>
        </label>

        <label class="block text-sm font-semibold text-ink">
          Độ tuổi
          <select formControlName="ageGroupId"
            class="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2.5 font-normal text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">
            <option [ngValue]="null">Không chọn</option>
            <option *ngFor="let age of ageGroups()" [ngValue]="+age.id">{{ age.name }}</option>
          </select>
        </label>

        <fieldset class="text-sm">
          <legend class="font-semibold text-ink mb-1">Chia sẻ</legend>
          <label class="flex items-start gap-2 text-ink-soft mb-1 cursor-pointer">
            <input type="radio" formControlName="visibility" value="PRIVATE" class="mt-1">
            <span><strong class="text-ink">Riêng tư</strong> — chỉ mình bạn xem.</span>
          </label>
          <label class="flex items-start gap-2 text-ink-soft cursor-pointer">
            <input type="radio" formControlName="visibility" value="SHARED" class="mt-1">
            <span><strong class="text-ink">Chia sẻ với đồng nghiệp</strong> — giáo viên khác xem và sao chép được.
              Họ chỉ thấy những tài liệu mà chính họ có quyền xem.</span>
          </label>
        </fieldset>

        <div class="flex justify-end gap-2 pt-2">
          <button type="button" (click)="cancel.emit()" [disabled]="busy"
            class="px-4 py-2 rounded-xl border border-line text-ink-soft font-semibold">Huỷ</button>
          <button type="submit" [disabled]="busy"
            class="px-4 py-2 rounded-xl bg-primary text-ink-onbrand font-semibold disabled:opacity-60">
            {{ busy ? 'Đang lưu…' : initial ? 'Lưu' : 'Tạo bộ' }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class CollectionFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly resourceService = inject(ResourceService);

  /** Existing collection when editing; null when creating. */
  @Input() initial: CollectionSummary | null = null;
  @Input() busy = false;
  @Output() save = new EventEmitter<CollectionUpsert>();
  @Output() cancel = new EventEmitter<void>();

  readonly ageGroups = signal<AgeGroup[]>([]);

  readonly form = this.fb.group({
    title: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(200)]),
    description: this.fb.nonNullable.control('', Validators.maxLength(2000)),
    ageGroupId: this.fb.control<number | null>(null),
    visibility: this.fb.nonNullable.control<'PRIVATE' | 'SHARED'>('PRIVATE'),
  });

  ngOnInit(): void {
    if (this.initial) {
      this.form.patchValue({
        title: this.initial.title,
        description: this.initial.description ?? '',
        ageGroupId: this.initial.ageGroup?.id ?? null,
        visibility: this.initial.visibility,
      });
    }
    this.resourceService
      .getAgeGroups()
      .pipe(map((res) => res.result ?? []))
      .subscribe({ next: (groups) => this.ageGroups.set(groups), error: () => void 0 });
  }

  submit(): void {
    if (this.form.invalid || !this.form.controls.title.value.trim()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.save.emit({
      title: value.title.trim(),
      description: value.description.trim() || null,
      ageGroupId: value.ageGroupId,
      topicId: this.initial?.topic?.id ?? null,
      visibility: value.visibility,
      version: this.initial?.version,
    });
  }
}
