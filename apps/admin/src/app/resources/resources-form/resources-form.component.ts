import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  OnInit,
  OnChanges,
  SimpleChanges,
  DestroyRef,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  ResourceService,
  TopicService,
  Category,
  Topic,
  AgeGroup,
  Resource,
  ToastService,
  AuthService,
  UpdateResourceRequest,
} from '@kindergarten-warehouse/data-access';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-admin-resources-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './resources-form.component.html',
})
export class ResourcesFormComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private resourceService = inject(ResourceService);
  private topicService = inject(TopicService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);

  @Input() isOpen = false;
  @Input() editResource: Resource | null = null;
  @Input() categories: Category[] = [];
  @Input() ageGroups: AgeGroup[] = [];

  @Output() closeForm = new EventEmitter<void>();
  @Output() saveSuccess = new EventEmitter<void>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('newThumbInput') newThumbInput!: ElementRef<HTMLInputElement>;
  @ViewChild('editThumbInput') editThumbInput!: ElementRef<HTMLInputElement>;

  uploadForm!: FormGroup;
  uploadTopics = signal<Topic[]>([]);
  uploadMode = signal<'FILE' | 'YOUTUBE'>('FILE');

  isEditMode = signal(false);
  selectedFile: File | null = null;
  selectedThumbnail: File | null = null;
  currentThumbnailUrl = signal<string | null>(null);
  uploadedFileDuration = signal<string | null>(null);

  ngOnInit() {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && changes['isOpen'].currentValue === true) {
      if (this.editResource) {
        this.setupEditMode(this.editResource);
      } else {
        this.setupCreateMode();
      }
    }
  }

  initForm() {
    this.uploadForm = this.fb.group({
      title: ['', Validators.required],
      categoryId: ['', Validators.required],
      topicId: ['', Validators.required],
      ageGroupIds: [[], Validators.required],
      type: ['VIDEO', Validators.required],
      url: [''],
      description: [''],
      status: ['PENDING'],
    });

    this.setupYoutubeWatcher();

    this.uploadForm
      .get('categoryId')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((catId) => {
        this.uploadForm.get('topicId')?.reset('');
        this.uploadTopics.set([]);
        if (catId) {
          this.topicService.getTopics(catId, 1, 100).subscribe((res) => {
            this.uploadTopics.set(res.data || []);
            // Auto-patch topic if possible to prevent validation UX issues
            if (res.data?.length > 0) {
              this.uploadForm.patchValue({ topicId: res.data[0].id });
            } else {
              this.uploadForm.get('topicId')?.markAsTouched();
              this.uploadForm.get('topicId')?.setErrors({ required: true });
            }
          });
        }
      });
  }

  setupCreateMode() {
    this.isEditMode.set(false);
    this.selectedFile = null;
    this.selectedThumbnail = null;
    this.currentThumbnailUrl.set(null);
    this.uploadedFileDuration.set(null);
    if (this.uploadForm) {
      this.uploadForm.reset({
        type: 'VIDEO',
        ageGroupIds: [],
        categoryId: '',
        topicId: '',
        status: 'PENDING',
      });
    }
  }

  setupEditMode(resource: Resource) {
    this.isEditMode.set(true);
    this.selectedFile = null;
    this.selectedThumbnail = null;
    this.uploadedFileDuration.set(resource.duration || null);

    const isYoutube = resource.resourceType === 'YOUTUBE';
    this.uploadMode.set(isYoutube ? 'YOUTUBE' : 'FILE');

    const topicId =
      resource.topicId || (resource.topic ? resource.topic.id : '');
    const catId = resource.topic?.categoryId
      ? String(resource.topic.categoryId)
      : '';

    if (topicId && catId) {
      this.topicService.getTopics(catId, 1, 100).subscribe((res) => {
        this.uploadTopics.set(res.data || []);
        this.uploadForm.patchValue({
          title: resource.title,
          description: resource.description,
          categoryId: catId,
          topicId: topicId,
          type: resource.fileType || 'OTHER',
          ageGroupIds: resource.ageGroups?.map((ag) => ag.id) || [],
          url: isYoutube ? resource.fileUrl : '',
          status: resource.status || 'PENDING',
        });
      });
    } else {
      this.uploadForm.patchValue({
        title: resource.title,
        description: resource.description,
        type: resource.fileType || 'OTHER',
        ageGroupIds: resource.ageGroups?.map((ag) => ag.id) || [],
        url: isYoutube ? resource.fileUrl : '',
        status: resource.status || 'PENDING',
      });
    }

    if (resource.thumbnailUrl) {
      this.currentThumbnailUrl.set(resource.thumbnailUrl);
    } else if (isYoutube && resource.fileUrl) {
      const vid = this.getYoutubeVideoId(resource.fileUrl);
      if (vid) {
        this.currentThumbnailUrl.set(
          `https://img.youtube.com/vi/${vid}/hqdefault.jpg`
        );
      } else {
        this.currentThumbnailUrl.set(null);
      }
    } else {
      this.currentThumbnailUrl.set(null);
    }
  }

  setupYoutubeWatcher() {
    this.uploadForm
      .get('url')
      ?.valueChanges.pipe(
        distinctUntilChanged(),
        debounceTime(300),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((url) => {
        if (!url) {
          this.currentThumbnailUrl.set(null);
          return;
        }
        const videoId = this.getYoutubeVideoId(url);
        if (videoId) {
          this.uploadForm.patchValue({ type: 'YOUTUBE' }, { emitEvent: false });
          const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          this.currentThumbnailUrl.set(thumbUrl);
        } else {
          this.currentThumbnailUrl.set(null);
        }
      });
  }

  setUploadMode(mode: 'FILE' | 'YOUTUBE') {
    this.uploadMode.set(mode);
  }

  closeModal() {
    this.closeForm.emit();
  }

  // File Handlers
  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.uploadedFileDuration.set(null);

      if (!this.isEditMode() && !this.uploadForm.get('title')?.value) {
        this.uploadForm.patchValue({ title: this.selectedFile.name });
      }

      const type = this.detectFileType(this.selectedFile.name);
      this.uploadForm.patchValue({ type });

      if (this.selectedFile.type.startsWith('video/')) {
        const duration = await this.getVideoDuration(this.selectedFile);
        if (duration) {
          this.uploadedFileDuration.set(duration);
        }
      }

      const modeLabel = this.isEditMode()
        ? 'Sẽ thay thế file cũ bằng'
        : 'Đã chọn file';
      this.toastService.show(
        `${modeLabel} "${this.selectedFile.name}"`,
        'info'
      );
    }
  }

  onNewThumbnailSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedThumbnail = input.files[0];
      this.currentThumbnailUrl.set(
        window.URL.createObjectURL(this.selectedThumbnail)
      );
    }
  }

  onYoutubeLinkInput(url: string) {
    if (!url) {
      this.currentThumbnailUrl.set(null);
      return;
    }
    const videoId = this.getYoutubeVideoId(url);
    if (videoId) {
      this.currentThumbnailUrl.set(
        `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      );
    } else {
      this.currentThumbnailUrl.set(null);
    }
  }

  // Age Group Toggle
  toggleAgeGroup(id: string) {
    const currentIds =
      (this.uploadForm.get('ageGroupIds')?.value as string[]) || [];
    if (currentIds.includes(id)) {
      this.uploadForm.patchValue({
        ageGroupIds: currentIds.filter((existingId) => existingId !== id),
      });
    } else {
      this.uploadForm.patchValue({
        ageGroupIds: [...currentIds, id],
      });
    }
    this.uploadForm.get('ageGroupIds')?.markAsTouched();
    this.uploadForm.get('ageGroupIds')?.markAsDirty();
  }

  // Submit Logic
  submitUpload() {
    if (this.uploadForm.invalid) {
      this.toastService.show(
        'Vui lòng điền đầy đủ các trường bắt buộc.',
        'error'
      );
      this.uploadForm.markAllAsTouched();
      return;
    }

    const val = this.uploadForm.value;
    const currentUser = this.authService.currentUserValue;

    if (this.isEditMode() && this.editResource) {
      const id = this.editResource.id;
      if (this.selectedFile || this.selectedThumbnail) {
        const formData = new FormData();
        formData.append('title', val.title);
        formData.append('topicId', val.topicId);
        if (val.description) formData.append('description', val.description);
        if (val.ageGroupIds && Array.isArray(val.ageGroupIds)) {
          val.ageGroupIds.forEach((ageId: string) =>
            formData.append('ageGroupIds', ageId)
          );
        }
        if (val.status) formData.append('status', val.status);
        if (this.selectedFile) {
          formData.append('file', this.selectedFile);
          if (this.uploadedFileDuration()) {
            formData.append('duration', this.uploadedFileDuration() as string);
          }
        }
        if (this.selectedThumbnail) {
          formData.append('thumbnail', this.selectedThumbnail);
        }
        if (this.uploadMode() === 'YOUTUBE' && val.url) {
          formData.append('youtubeLink', val.url);
        }

        this.resourceService
          .updateResourceWithFormData(id, formData)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (res) => {
              this.toastService.showResponse(res);
              this.saveSuccess.emit();
            },
            error: (err: Error) => this.toastService.show(err.message, 'error'),
          });
      } else {
        const updateData: UpdateResourceRequest = {
          title: val.title,
          description: val.description,
          topicId: val.topicId,
          ageGroupIds: val.ageGroupIds || [],
          duration: this.uploadedFileDuration() || undefined,
          status: val.status,
        };
        if (this.uploadMode() === 'YOUTUBE' && val.url) {
          updateData.youtubeLink = val.url;
        }

        this.resourceService
          .updateResource(id, updateData)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (res) => {
              this.toastService.showResponse(res);
              this.saveSuccess.emit();
            },
            error: (err: Error) => this.toastService.show(err.message, 'error'),
          });
      }
    } else {
      const formData = new FormData();
      formData.append('title', val.title);
      formData.append('topicId', val.topicId);
      if (val.description) formData.append('description', val.description);
      if (val.ageGroupIds && Array.isArray(val.ageGroupIds)) {
        val.ageGroupIds.forEach((id: string) =>
          formData.append('ageGroupIds', id)
        );
      }
      if (this.selectedThumbnail) {
        formData.append('thumbnail', this.selectedThumbnail);
      }
      if (currentUser?.username) {
        formData.append('username', currentUser.username);
      }

      if (this.uploadMode() === 'YOUTUBE') {
        const url = this.uploadForm.get('url')?.value;
        if (!url)
          return this.toastService.show(
            'Vui lòng nhập đường dẫn YouTube.',
            'error'
          );
        const videoId = this.getYoutubeVideoId(url);
        if (!videoId)
          return this.toastService.show(
            'Đường dẫn YouTube không hợp lệ.',
            'error'
          );
        formData.append('youtubeLink', url);
      } else {
        if (!this.selectedFile)
          return this.toastService.show(
            'Vui lòng chọn file để tải lên.',
            'error'
          );
        formData.append('file', this.selectedFile);
        if (this.uploadedFileDuration()) {
          formData.append('duration', this.uploadedFileDuration() as string);
        }
      }

      this.resourceService
        .uploadResource(formData)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res) => {
            this.toastService.showResponse(res);
            this.saveSuccess.emit();
          },
          error: (err: Error) => this.toastService.show(err.message, 'error'),
        });
    }
  }

  // Helpers
  getYoutubeVideoId(url: string): string | null {
    if (!url) return null;
    try {
      const urlToParse = url.startsWith('http') ? url : `https://${url}`;
      const parsed = new URL(urlToParse);
      if (parsed.hostname.includes('youtube.com')) {
        return parsed.searchParams.get('v');
      }
      if (parsed.hostname === 'youtu.be') {
        return parsed.pathname.slice(1).split('?')[0] || null;
      }
      const embedMatch = parsed.pathname.match(/\/embed\/([^/?]+)/);
      if (embedMatch) return embedMatch[1];
    } catch {
      return null;
    }
    return null;
  }

  detectFileType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
    const docExts = ['doc', 'docx', 'txt'];
    const pdfExts = ['pdf'];
    const excelExts = ['xls', 'xlsx', 'csv'];
    const pptExts = ['ppt', 'pptx'];
    const imgExts = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];

    if (videoExts.includes(ext)) return 'VIDEO';
    if (docExts.includes(ext)) return 'DOCUMENT';
    if (pdfExts.includes(ext)) return 'PDF';
    if (excelExts.includes(ext)) return 'EXCEL';
    if (pptExts.includes(ext)) return 'POWERPOINT';
    if (imgExts.includes(ext)) return 'IMAGE';
    return 'OTHER';
  }

  getVideoDuration(file: File): Promise<string> {
    return new Promise((resolve) => {
      try {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          window.URL.revokeObjectURL(video.src);
          resolve(this.formatDuration(video.duration));
        };
        video.onerror = () => resolve('');
        video.src = window.URL.createObjectURL(file);
      } catch {
        resolve('');
      }
    });
  }

  formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const mDisplay = m < 10 ? `0${m}` : m;
    const sDisplay = s < 10 ? `0${s}` : s;
    if (h > 0) return `${h < 10 ? '0' + h : h}:${mDisplay}:${sDisplay}`;
    return `${mDisplay}:${sDisplay}`;
  }
}
