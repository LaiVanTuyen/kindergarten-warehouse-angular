import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormControl,
} from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  ResourceService,
  CategoryService,
  Resource,
  Category,
  Topic,
  AuthService,
} from '@kindergarten-warehouse/data-access';
import { ToastService } from '../shared/toast/toast.service';

@Component({
  selector: 'app-admin-resources',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './resources.component.html',
  styles: [],
})
export class ResourcesComponent {
  private fb = inject(FormBuilder);
  resourceService = inject(ResourceService);
  categoryService = inject(CategoryService);
  toastService = inject(ToastService);
  authService = inject(AuthService);
  sanitizer = inject(DomSanitizer);

  // Data Signals
  resources = signal<Resource[]>([]);
  totalResources = signal(0);

  // UI State
  activeTab = signal<'pending' | 'list'>('pending');
  isEditMode = signal(false);
  currentResourceId: string | null = null;
  Math = Math;

  // Preview State
  previewResource = signal<Resource | null>(null);
  isLoading = signal(false);
  previewUrl: SafeResourceUrl | null = null;
  previewType: 'VIDEO' | 'AUDIO' | 'IMAGE' | 'DOC' | 'UNSUPPORTED' =
    'UNSUPPORTED';

  // Filtering & Pagination
  pageSize = signal(10);
  currentPage = signal(1);
  searchControl = new FormControl('');
  typeFilter = new FormControl('');

  // Forms
  uploadForm: FormGroup;
  categories = signal<Category[]>([]);
  topics = signal<Topic[]>([]);
  filteredTopics = signal<Topic[]>([]);

  constructor() {
    this.uploadForm = this.fb.group({
      title: ['', Validators.required],
      categoryId: ['', Validators.required],
      topicId: ['', Validators.required],
      type: ['VIDEO', Validators.required],
      url: [''],
      description: [''],
    });

    this.loadData();
    this.loadCategoriesAndTopics();

    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.currentPage.set(1);
        this.loadData();
      });

    this.typeFilter.valueChanges.subscribe(() => {
      this.currentPage.set(1);
      this.loadData();
    });

    this.uploadForm.get('categoryId')?.valueChanges.subscribe((catId) => {
      this.filteredTopics.set(
        this.topics().filter((t) => t.categoryId === catId)
      );
      this.uploadForm.get('topicId')?.reset();
    });
  }

  setActiveTab(tab: 'pending' | 'list') {
    this.activeTab.set(tab);
    this.currentPage.set(1);
    this.loadData();
  }

  loadData() {
    let status: 'pending' | 'approved' | 'rejected' | undefined = undefined;
    if (this.activeTab() === 'pending') {
      status = 'pending';
    }

    this.resourceService
      .getResources(this.currentPage(), this.pageSize(), {
        search: this.searchControl.value || undefined,
        status: status,
        type: (this.typeFilter.value as any) || undefined,
      })
      .subscribe((res) => {
        this.resources.set(res.data);
        this.totalResources.set(res.total);
      });
  }

  loadCategoriesAndTopics() {
    this.categoryService
      .getCategories(1, 100)
      .subscribe((res) => this.categories.set(res.data));
    this.categoryService
      .getTopics(undefined, 1, 100)
      .subscribe((res) => this.topics.set(res.data));
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadData();
  }

  // Upload Modal State
  isUploadModalOpen = signal(false);

  openUploadModal() {
    this.isUploadModalOpen.set(true);
    this.isEditMode.set(false);
    this.currentResourceId = null;
    this.uploadForm.reset({ type: 'VIDEO' });
  }

  closeUploadModal() {
    this.isUploadModalOpen.set(false);
    this.isEditMode.set(false);
    this.currentResourceId = null;
  }

  approveResource(id: string) {
    this.resourceService.approveResource(id).subscribe(() => {
      this.toastService.show('Resource approved successfully', 'success');
      this.loadData();
    });
  }

  rejectResource(id: string) {
    this.resourceService.rejectResource(id).subscribe(() => {
      this.toastService.show('Resource rejected', 'info');
      this.loadData();
    });
  }

  deleteModalOpen = signal(false);
  resourceToDelete = signal<string | null>(null);

  confirmDelete(id: string) {
    this.resourceToDelete.set(id);
    this.deleteModalOpen.set(true);
  }

  cancelDelete() {
    this.deleteModalOpen.set(false);
    this.resourceToDelete.set(null);
  }

  deleteResource() {
    const id = this.resourceToDelete();
    if (id) {
      this.resourceService.deleteResource(id).subscribe(() => {
        if (this.currentResourceId === id) {
          this.cancelEdit();
        }
        this.toastService.show('Resource deleted successfully', 'success');
        this.loadData();
        this.cancelDelete();
      });
    }
  }

  editResource(resource: Resource) {
    this.isEditMode.set(true);
    this.currentResourceId = resource.id;
    this.uploadForm.patchValue({
      title: resource.title,
      categoryId: resource.topicId
        ? this.getCategoryIdFromTopic(resource.topicId)
        : '',
      topicId: resource.topicId,
      type: resource.type,
      description: resource.description,
      url: resource.url,
    });

    const catId = this.getCategoryIdFromTopic(resource.topicId);
    if (catId) {
      this.filteredTopics.set(
        this.topics().filter((t) => t.categoryId === catId)
      );
    }
    this.isUploadModalOpen.set(true);
  }

  cancelEdit() {
    this.isEditMode.set(false);
    this.currentResourceId = null;
    this.uploadForm.reset({ type: 'VIDEO' });
  }

  onFileSelected(event: Event) {
    if (this.isEditMode()) return;

    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (!this.uploadForm.get('title')?.value) {
        this.uploadForm.patchValue({ title: file.name });
      }
      this.toastService.show(`File "${file.name}" selected!`, 'info');
    }
  }

  submitUpload() {
    if (this.uploadForm.invalid) return;

    const val = this.uploadForm.value;
    const resourceData: Partial<Resource> = {
      title: val.title,
      type: val.type,
      topicId: val.topicId,
      description: val.description,
      url: val.url || 'https://example.com',
      thumbnail: val.type === 'VIDEO' ? '🎬' : '📄',
    };

    if (this.isEditMode() && this.currentResourceId) {
      this.resourceService
        .updateResource(this.currentResourceId, resourceData)
        .subscribe(() => {
          this.toastService.show('Resource updated successfully', 'success');
          this.loadData();
          this.closeUploadModal();
        });
    } else {
      const currentUser = this.authService.currentUserValue;
      const isAdmin = currentUser?.role === 'ADMIN';
      const status = isAdmin ? 'approved' : 'pending';

      this.resourceService
        .createResource({
          ...resourceData,
          status: status,
        })
        .subscribe(() => {
          this.uploadForm.reset({ type: 'VIDEO' });
          const msg = isAdmin
            ? 'Resource uploaded and automatically approved!'
            : 'Resource uploaded and pending approval.';

          this.toastService.show(msg, 'success');
          this.loadData();
          this.closeUploadModal();
        });
    }
  }

  // PREVIEW LOGIC
  openPreview(resource: Resource) {
    console.log('Clicked Preview:', resource); // Debugging
    this.previewResource.set(resource);
    this.isLoading.set(true);
    this.previewType = this.getPreviewType(resource.url || '');
    this.previewUrl = this.getSafeUrl(resource.url || '', this.previewType);

    // If unsupported, stop loading spinner immediately
    if (this.previewType === 'UNSUPPORTED') {
      this.isLoading.set(false);
    }
  }

  closePreview() {
    this.previewResource.set(null);
    this.previewUrl = null;
    this.isLoading.set(false);
  }

  onLoad() {
    this.isLoading.set(false);
  }

  getPreviewType(url: string) {
    const ext = url.split('.').pop()?.toLowerCase();
    if (['mp4', 'webm', 'ogg'].includes(ext || '')) return 'VIDEO';
    if (['mp3', 'wav', 'ogg'].includes(ext || '')) return 'AUDIO';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || ''))
      return 'IMAGE';
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx'].includes(ext || '')) return 'DOC';
    return 'UNSUPPORTED';
  }

  getSafeUrl(url: string, type: string): SafeResourceUrl {
    if (type === 'DOC') {
      // Use Google Docs Viewer
      // https://docs.google.com/viewer?url={url}&embedded=true
      const googleUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
        url
      )}&embedded=true`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(googleUrl);
    }
    // For Video/Audio/Image, trust the known public URL or sanitise properly
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  // Helpers
  getCategoryName(topicId?: string): string {
    if (!topicId) return 'Unknown';
    const topic = this.topics().find((t) => t.id === topicId);
    if (!topic) return 'Unknown';
    const cat = this.categories().find((c) => c.id === topic.categoryId);
    return cat ? cat.name : 'Unknown';
  }

  getCategoryIdFromTopic(topicId?: string): string {
    if (!topicId) return '';
    const topic = this.topics().find((t) => t.id === topicId);
    return topic ? topic.categoryId : '';
  }
}
