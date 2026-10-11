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
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, map, of } from 'rxjs';

import {
  AgeGroup,
  AuthService,
  Category,
  CategoryService,
  CollectionService,
  ResourceService,
  ToastService,
  Topic,
  TopicService,
  youtubeVideoId,
} from '@kindergarten-warehouse/data-access';
import { FileDropZoneComponent } from '../../shared/file-drop-zone/file-drop-zone.component';

interface CreateResourceForm {
  title: FormControl<string>;
  description: FormControl<string>;
  categoryId: FormControl<string>;
  topicId: FormControl<string>;
  ageGroupIds: FormControl<string[]>;
  duration: FormControl<string>;
  youtubeLink: FormControl<string>;
  /** Comma-separated free-text tags; backend normalizes (max 10, 50 chars each). */
  tags: FormControl<string>;
}

/**
 * Teacher-facing "upload a new resource" page. Wiring:
 *   1. Category → Topic lazily loads on parent change (no size:1000 hack).
 *   2. File picked via the shared drop-zone (50MB cap, typed allowlist).
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
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly resourceService = inject(ResourceService);
  private readonly collectionService = inject(CollectionService);
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
  readonly sourceType = signal<'FILE' | 'YOUTUBE'>('FILE');
  readonly isSubmitting = signal(false);
  readonly isLoadingTopics = signal(false);

  readonly isEditMode = signal(false);
  readonly resourceId = signal<string | null>(null);
  readonly existingFileUrl = signal<string | null>(null);
  readonly existingFileName = signal<string | null>(null);
  private isInitializing = false;

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(180)]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
    categoryId: ['', Validators.required],
    topicId: ['', Validators.required],
    ageGroupIds: this.fb.nonNullable.control<string[]>([], Validators.required),
    duration: [''],
    youtubeLink: [''],
    tags: ['', Validators.maxLength(600)],
  }) as FormGroup<CreateResourceForm>;

  readonly canSubmit = computed(
    () => (this.sourceType() === 'YOUTUBE' || this.isEditMode() || !!this.selectedFile()) && !this.isSubmitting()
  );

  ngOnInit(): void {
    this.loadInitialData();

    this.form.controls.categoryId.valueChanges.subscribe((categoryId) => {
      if (this.isInitializing) return;
      // Reset topic whenever parent category switches.
      this.form.controls.topicId.setValue('');
      if (categoryId) this.loadTopics(categoryId);
      else this.topics.set([]);
    });

    // Check for edit mode
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.isEditMode.set(true);
      this.loadResourceForEdit(slug);
    }
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
    const youtubeLink = this.form.controls.youtubeLink.value.trim();
    if (this.sourceType() === 'YOUTUBE' && !youtubeVideoId(youtubeLink)) {
      this.toast.show('Vui lòng nhập link YouTube hợp lệ (watch, youtu.be, Shorts hoặc embed).', 'error');
      return;
    }
    if (this.sourceType() === 'FILE' && !file && !this.isEditMode()) {
      this.toast.show('Vui lòng chọn tệp tài liệu để tải lên.', 'error');
      return;
    }
    const user = this.auth.currentUser();
    if (!user) {
      this.toast.show('Phiên đăng nhập đã hết hạn.', 'error');
      this.router.navigate(['/login']);
      return;
    }

    const { title, description, topicId, ageGroupIds, duration, tags } =
      this.form.getRawValue();

    const isEdit = this.isEditMode();
    const resourceId = this.resourceId();
    this.isSubmitting.set(true);

    const payload = new FormData();
    if (this.sourceType() === 'YOUTUBE') payload.append('youtubeLink', youtubeLink);
    else if (file) {
      payload.append('file', file);
    }
    payload.append('title', title.trim());
    payload.append('description', description.trim());
    payload.append('topicId', topicId);
    if (user.username) {
      payload.append('username', user.username);
    }
    ageGroupIds.forEach((id) => payload.append('ageGroupIds', id));
    if (duration?.trim()) payload.append('duration', duration.trim());
    // Edit always sends the field so clearing the input clears the tags;
    // an absent field means "keep current tags" on the backend.
    if (tags.trim() || isEdit) payload.append('tags', tags.trim());

    if (isEdit && resourceId) {
      this.resourceService
        .updateResourceWithFormData(resourceId, payload)
        .pipe(finalize(() => this.isSubmitting.set(false)))
        .subscribe({
          next: () => {
            this.toast.show(
              'Cập nhật tài liệu thành công. Tài liệu đang chờ duyệt lại!',
              'success'
            );
            this.router.navigate(['/teacher/my-resources'], {
              queryParams: { status: 'PENDING' },
            });
          },
          error: (err: HttpErrorResponse | Error) => {
            const msg =
              err instanceof HttpErrorResponse && err.status === 413
                ? 'Tệp quá lớn. Vui lòng chọn tệp dưới 50MB.'
                : err.message || 'Không thể cập nhật tài liệu. Vui lòng thử lại.';
            this.toast.show(msg, 'error');
          },
        });
    } else {
      this.resourceService
        .uploadResource(payload)
        .pipe(finalize(() => this.isSubmitting.set(false)))
        .subscribe({
          next: (res) => {
            const collectionId = Number(this.route.snapshot.queryParamMap.get('collectionId'));
            const created = res?.result ?? res?.data;
            if (collectionId > 0 && created?.id) {
              // Opened from a collection: put the new upload straight into it. The owner
              // sees it there while it waits for approval; colleagues only after approval.
              this.collectionService.addItem(collectionId, created.id).subscribe({
                next: () => {
                  this.toast.show('Đã tải lên và thêm vào bộ. Tài liệu đang chờ duyệt.', 'success');
                  this.router.navigate(['/collections', collectionId]);
                },
                error: () => {
                  this.toast.show('Đã tải lên, nhưng chưa thêm được vào bộ. Hãy thêm lại từ trang tài liệu.', 'info');
                  this.router.navigate(['/collections', collectionId]);
                },
              });
              return;
            }
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
                ? 'Tệp quá lớn. Vui lòng chọn tệp dưới 50MB.'
                : err.message || 'Không thể đăng tài liệu. Vui lòng thử lại.';
            this.toast.show(msg, 'error');
          },
        });
    }
  }

  private loadResourceForEdit(slug: string): void {
    this.isInitializing = true;
    this.resourceService.getResource(slug).subscribe({
      next: (res) => {
        const resource = res.result ?? res.data;
        if (!resource) {
          this.toast.show('Không tìm thấy tài liệu.', 'error');
          this.router.navigate(['/teacher/my-resources']);
          return;
        }

        this.resourceId.set(resource.id);
        if (resource.resourceType === 'YOUTUBE') {
          this.sourceType.set('YOUTUBE');
          this.form.controls.youtubeLink.setValue(resource.fileUrl);
        }
        this.existingFileUrl.set(this.auth.formatAssetUrl(resource.fileUrl));
        
        // Extract filename from URL path
        if (resource.fileUrl) {
          const parts = resource.fileUrl.split('/');
          this.existingFileName.set(decodeURIComponent(parts[parts.length - 1]));
        }

        const catId = resource.topic?.categoryId ? String(resource.topic.categoryId) : '';
        const topicId = resource.topicId ? String(resource.topicId) : (resource.topic ? String(resource.topic.id) : '');

        if (catId) {
          this.topicService.getTopics(catId, 1, 100).subscribe((topicsRes) => {
            this.topics.set(topicsRes.data ?? []);
            this.form.patchValue({
              title: resource.title,
              description: resource.description,
              categoryId: catId,
              topicId: topicId,
              ageGroupIds: resource.ageGroups?.map((ag) => String(ag.id)) || [],
              duration: resource.duration || '',
              tags: (resource.tags ?? []).join(', '),
            });
            this.isInitializing = false;
          });
        } else {
          this.form.patchValue({
            title: resource.title,
            description: resource.description,
            ageGroupIds: resource.ageGroups?.map((ag) => String(ag.id)) || [],
            duration: resource.duration || '',
            tags: (resource.tags ?? []).join(', '),
          });
          this.isInitializing = false;
        }
      },
      error: () => {
        this.toast.show('Không tải được thông tin tài liệu.', 'error');
        this.router.navigate(['/teacher/my-resources']);
        this.isInitializing = false;
      },
    });
  }

  private loadInitialData(): void {
    this.categoryService
      .getCategories(1, 100, undefined, false)
      .pipe(
        map((res) => (res.data ?? []).filter((c) => c.visibility !== 'PRIVATE')),
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
