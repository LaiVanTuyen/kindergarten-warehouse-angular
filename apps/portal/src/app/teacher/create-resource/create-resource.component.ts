import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, map, of } from 'rxjs';

import {
  AgeGroup,
  AuthService,
  Category,
  CategoryService,
  ResourceService,
  ToastService,
  Topic,
  TopicService,
} from '@kindergarten-warehouse/data-access';
import { FileDropZoneComponent } from '../../shared/file-drop-zone/file-drop-zone.component';

interface CreateResourceForm {
  title: FormControl<string>;
  description: FormControl<string>;
  categoryId: FormControl<string>;
  topicId: FormControl<string>;
  ageGroupIds: FormControl<string[]>;
  duration: FormControl<string>;
}

/**
 * Teacher-facing "upload a new resource" page. Wiring:
 *   1. Category → Topic lazily loads on parent change (no size:1000 hack).
 *   2. File picked via the shared drop-zone (100MB cap, typed allowlist).
 *   3. Submit posts multipart/form-data to /resources; backend moderates it.
 *   4. On success, navigate to /teacher/my-resources so the teacher can watch
 *      the pending → approved flow.
 */
@Component({
  selector: 'app-teacher-create-resource',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    FileDropZoneComponent,
  ],
  templateUrl: './create-resource.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateResourceComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly resourceService = inject(ResourceService);
  private readonly categoryService = inject(CategoryService);
  private readonly topicService = inject(TopicService);

  /** File types approved for teacher uploads. Kept conservative — the backend
   *  enforces its own allowlist, this is just the friendly UX gate. */
  readonly ACCEPTED_TYPES =
    '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.mp3,.mp4,.m4a,.wav,.png,.jpg,.jpeg,.webp';

  readonly categories = signal<Category[]>([]);
  readonly topics = signal<Topic[]>([]);
  readonly ageGroups = signal<AgeGroup[]>([]);
  readonly selectedFile = signal<File | null>(null);
  readonly isSubmitting = signal(false);
  readonly isLoadingTopics = signal(false);

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(180)]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
    categoryId: ['', Validators.required],
    topicId: ['', Validators.required],
    ageGroupIds: this.fb.nonNullable.control<string[]>([], Validators.required),
    duration: [''],
  }) as FormGroup<CreateResourceForm>;

  readonly canSubmit = computed(
    () => !!this.selectedFile() && !this.isSubmitting()
  );

  ngOnInit(): void {
    this.loadInitialData();

    this.form.controls.categoryId.valueChanges.subscribe((categoryId) => {
      // Reset topic whenever parent category switches.
      this.form.controls.topicId.setValue('');
      if (categoryId) this.loadTopics(categoryId);
      else this.topics.set([]);
    });
  }

  onFileSelected(file: File | null): void {
    this.selectedFile.set(file);
  }

  toggleAgeGroup(ageGroupId: string): void {
    const current = this.form.controls.ageGroupIds.value ?? [];
    const next = current.includes(ageGroupId)
      ? current.filter((id) => id !== ageGroupId)
      : [...current, ageGroupId];
    this.form.controls.ageGroupIds.setValue(next);
    this.form.controls.ageGroupIds.markAsDirty();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.show('Vui lòng điền đầy đủ các trường bắt buộc.', 'error');
      return;
    }
    const file = this.selectedFile();
    if (!file) {
      this.toast.show('Vui lòng chọn tệp tài liệu để tải lên.', 'error');
      return;
    }
    const user = this.auth.currentUser();
    if (!user) {
      this.toast.show('Phiên đăng nhập đã hết hạn.', 'error');
      this.router.navigate(['/login']);
      return;
    }

    const { title, description, topicId, ageGroupIds, duration } =
      this.form.getRawValue();

    const payload = new FormData();
    payload.append('file', file);
    payload.append('title', title.trim());
    payload.append('description', description.trim());
    payload.append('topicId', topicId);
    payload.append('username', user.username);
    // Backend accepts comma-separated OR repeated — use repeated for safety.
    ageGroupIds.forEach((id) => payload.append('ageGroupIds', id));
    if (duration?.trim()) payload.append('duration', duration.trim());

    this.isSubmitting.set(true);
    this.resourceService
      .uploadResource(payload)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.toast.show(
            'Đã gửi tài liệu để chờ duyệt. Chúng tôi sẽ sớm phản hồi!',
            'success'
          );
          this.router.navigate(['/teacher/my-resources'], {
            queryParams: { status: 'PENDING' },
          });
        },
        error: (err: HttpErrorResponse | Error) => {
          const msg =
            err instanceof HttpErrorResponse && err.status === 413
              ? 'Tệp quá lớn. Vui lòng chọn tệp dưới 100MB.'
              : err.message || 'Không thể đăng tài liệu. Vui lòng thử lại.';
          this.toast.show(msg, 'error');
        },
      });
  }

  private loadInitialData(): void {
    this.categoryService
      .getCategories(1, 100, undefined, false)
      .pipe(
        map((res) => (res.data ?? []).filter((c) => c.isActive)),
        catchError(() => of<Category[]>([]))
      )
      .subscribe((cats) => this.categories.set(cats));

    this.resourceService
      .getAgeGroups()
      .pipe(
        map((res) => res.result ?? []),
        catchError(() => of<AgeGroup[]>([]))
      )
      .subscribe((groups) => this.ageGroups.set(groups));
  }

  private loadTopics(categoryId: string): void {
    this.isLoadingTopics.set(true);
    this.topicService
      .getTopics(categoryId, 1, 100)
      .pipe(
        map((res) => res.data ?? []),
        catchError(() => of<Topic[]>([])),
        finalize(() => this.isLoadingTopics.set(false))
      )
      .subscribe((topics) => this.topics.set(topics));
  }

  /** Template helpers (avoid arrow allocations during CD) */
  trackById = (_: number, item: { id: string | number }) => item.id;
  isAgeSelected = (id: string): boolean =>
    (this.form.controls.ageGroupIds.value ?? []).includes(id);
}
