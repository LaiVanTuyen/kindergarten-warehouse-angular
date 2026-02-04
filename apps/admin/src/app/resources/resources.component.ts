import { Component, inject, signal } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { PaginationComponent } from '../shared/components/pagination/pagination.component';
import { SkeletonTableComponent } from '../shared/components/skeleton-table/skeleton-table.component';
import { BreadcrumbComponent } from '../shared/components/breadcrumb/breadcrumb.component';
import { EmptyStateComponent } from '../shared/components/empty-state/empty-state.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  FormsModule,
  Validators,
  FormControl,
} from '@angular/forms';
import {
  debounceTime,
  distinctUntilChanged,
  delay,
  finalize,
} from 'rxjs/operators';
import {
  ResourceService,
  CategoryService,
  TopicService,
  Resource,
  Category,
  Topic,
  AuthService,
  AgeGroup,
} from '@kindergarten-warehouse/data-access';
import { ToastService } from '@kindergarten-warehouse/data-access';

@Component({
  selector: 'app-admin-resources',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    ReactiveFormsModule,
    FormsModule,
    PaginationComponent,
    SkeletonTableComponent,
    BreadcrumbComponent,
    EmptyStateComponent,
  ],
  templateUrl: './resources.component.html',
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
    `,
  ],
})
export class ResourcesComponent {
  private fb = inject(FormBuilder);
  resourceService = inject(ResourceService);
  categoryService = inject(CategoryService);
  topicService = inject(TopicService);
  toastService = inject(ToastService);
  authService = inject(AuthService);
  sanitizer = inject(DomSanitizer);

  // Data Signals
  resources = signal<Resource[]>([]);
  categories = signal<Category[]>([]);
  topics = signal<Topic[]>([]); // For Filter Dropdown
  allTopics = signal<Topic[]>([]); // For Lookups (View/Edit)
  uploadTopics = signal<Topic[]>([]); // For Upload Modal Dropdown
  moveTopics = signal<Topic[]>([]); // For Move Modal
  filteredTopics = signal<Topic[]>([]); // For Filter Logic
  ageGroups = signal<AgeGroup[]>([]);
  uploadMode = signal<'FILE' | 'YOUTUBE'>('FILE');

  // Page State
  totalResources = signal(0);
  totalPages = signal(0);
  currentPage = signal(1);
  pageSize = signal(10);
  selectedIds = signal<Set<string>>(new Set());

  // Search & Filter Controls
  searchControl = new FormControl('');
  typeFilter = new FormControl('');
  categoryFilter = new FormControl('');
  topicFilter = new FormControl('');
  ageGroupFilter = new FormControl('');

  // Forms
  uploadForm!: FormGroup;
  filterForm!: FormGroup;

  // Move Modal Controls
  moveTargetCategoryId = new FormControl('');
  moveTargetTopicId = new FormControl('');

  // Bulk Actions
  toggleSelection(id: string) {
    this.selectedIds.update((set) => {
      const newSet = new Set(set);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }

  toggleAll(checked: boolean) {
    if (checked) {
      this.selectedIds.set(new Set(this.resources().map((r) => r.id)));
    } else {
      this.selectedIds.set(new Set());
    }
  }

  // UI State
  activeTab = signal<'pending' | 'list'>('pending');
  isEditMode = signal(false);
  currentResourceId: string | null = null;

  // Preview State
  previewResource = signal<Resource | null>(null);
  isLoading = signal(false);
  isTableLoading = signal(false);
  isTopicsLoading = signal(false); // Added missing signal
  currentThumbnailUrl = signal<string | null>(null); // Added missing signal
  previewUrl: SafeResourceUrl | null = null;
  previewType: 'VIDEO' | 'AUDIO' | 'IMAGE' | 'DOC' | 'UNSUPPORTED' | 'YOUTUBE' =
    'UNSUPPORTED';

  // Modal State
  isUploadModalOpen = signal(false);
  isMoveModalOpen = signal(false);
  selectedFile: File | null = null;

  // GENERIC CONFIRMATION MODAL STATE
  isConfirmModalOpen = signal(false);
  confirmConfig = signal<{
    title: string;
    message: string;
    action: 'APPROVE' | 'REJECT' | 'DELETE' | 'BULK_APPROVE' | 'BULK_DELETE';
    data?: any;
  } | null>(null);

  constructor() {
    // Services injected via inject()
  }

  openConfirmModal(
    title: string,
    message: string,
    action: 'APPROVE' | 'REJECT' | 'DELETE' | 'BULK_APPROVE' | 'BULK_DELETE',
    data: any = null
  ) {
    this.confirmConfig.set({ title, message, action, data });
    this.isConfirmModalOpen.set(true);
  }

  closeConfirmModal() {
    this.isConfirmModalOpen.set(false);
    this.confirmConfig.set(null);
  }

  onConfirmAction() {
    const config = this.confirmConfig();
    if (!config) return;

    switch (config.action) {
      case 'APPROVE':
        this.executeApprove(config.data);
        break;
      case 'REJECT':
        this.executeReject(config.data);
        break;
      case 'DELETE':
        this.executeDeleteSingle(config.data);
        break;
      case 'BULK_APPROVE':
        this.executeBulkApprove();
        break;
      case 'BULK_DELETE':
        this.executeBulkDelete();
        break;
    }
    this.closeConfirmModal();
  }

  ngOnInit() {
    this.initForms();
    this.loadCategories();
    this.loadAgeGroups();
    this.loadAllTopics(); // Load lookup data
    this.loadData();

    // Watchers
    this.setupFilterWatchers();
  }

  initForms() {
    this.uploadForm = this.fb.group({
      title: ['', Validators.required],
      categoryId: ['', Validators.required],
      topicId: ['', Validators.required],
      ageGroupIds: [[], Validators.required], // Array of IDs
      type: ['VIDEO', Validators.required],
      url: [''],
      description: [''],
    });

    this.setupYoutubeWatcher();
  }

  setupYoutubeWatcher() {
    this.uploadForm
      .get('url')
      ?.valueChanges.pipe(distinctUntilChanged(), debounceTime(300))
      .subscribe((url) => {
        if (!url) return;
        const videoId = this.extractYoutubeId(url);
        if (videoId) {
          this.uploadForm.patchValue({ type: 'VIDEO' }, { emitEvent: false });
          const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          // Update preview signal
          this.currentThumbnailUrl.set(thumbUrl);
          // Also set the form value if we have a thumbnail field, or just leave it for the sidebar preview
        }
      });
  }

  extractYoutubeId(url: string): string | null {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  }

  setupFilterWatchers() {
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

    this.ageGroupFilter.valueChanges.subscribe(() => {
      this.currentPage.set(1);
      this.loadData();
    });

    this.categoryFilter.valueChanges.subscribe((catId) => {
      this.topicFilter.setValue('');
      if (catId) {
        this.filteredTopics.set(
          this.topics().filter((t) => t.categoryId === catId)
        );
      } else {
        this.filteredTopics.set(this.topics());
      }
    });

    this.topicFilter.valueChanges.subscribe(() => {
      this.currentPage.set(1);
      this.loadData();
    });

    // Upload Form Filter - Fetch Topics by Category from API
    this.uploadForm.get('categoryId')?.valueChanges.subscribe((catId) => {
      this.uploadForm.get('topicId')?.reset();
      this.uploadTopics.set([]); // Clear previous topics

      if (catId) {
        // Fetch topics for this category specifically
        this.topicService.getTopics(catId, 1, 100).subscribe((res) => {
          this.uploadTopics.set(res.data);
        });
      }
      this.onCategoryChange(catId);
    });

    // Move Modal Category Change - Fetch Topics by Category from API
    this.moveTargetCategoryId.valueChanges.subscribe((catId) => {
      this.moveTargetTopicId.reset();
      this.moveTopics.set([]); // Clear previous topics

      if (catId) {
        this.topicService.getTopics(catId, 1, 100).subscribe((res) => {
          this.moveTopics.set(res.data);
        });
      }
    });
  }

  onCategoryChange(categoryId: string) {
    // Reset topic in form
    this.uploadForm.patchValue({ topicId: '' });

    if (categoryId) {
      this.isTopicsLoading.set(true);
      this.topicService
        .getTopics(categoryId, 1, 100)
        .pipe(finalize(() => this.isTopicsLoading.set(false)))
        .subscribe((res) => {
          this.uploadTopics.set(res.data);
        });
    } else {
      this.uploadTopics.set([]);
    }
  }

  setActiveTab(tab: 'pending' | 'list') {
    this.activeTab.set(tab);
    this.currentPage.set(1);
    this.loadData();
  }

  loadData() {
    let status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN' | undefined =
      undefined;
    if (this.activeTab() === 'pending') {
      status = 'PENDING';
    }

    this.isTableLoading.set(true);

    this.resourceService
      .getResources({
        page: this.currentPage(),
        size: this.pageSize(),
        keyword: this.searchControl.value || undefined,
        status: status,
        type: (this.typeFilter.value as any) || undefined,
        topicId: (this.topicFilter.value as any) || undefined,
        ageGroupId: (this.ageGroupFilter.value as any) || undefined,
      })
      .pipe(delay(500))
      .subscribe((res) => {
        // Handle result vs data structure if needed, currently service returns RestResponse with data
        const responseData = res.result || res.data; // Handle both due to spec change
        if (responseData && 'content' in responseData) {
          // Polyfill missing types for icons/edit
          const content = (responseData.content || []).map((r: Resource) => ({
            ...r,
            type:
              r.type ||
              this.detectResourceType(r.fileUrl || r.fileExtension || ''),
          }));
          this.resources.set(content);
          this.totalResources.set(responseData.totalElements);
        } else {
          this.resources.set([]);
          this.totalResources.set(0);
        }
        this.selectedIds.set(new Set());
        this.isTableLoading.set(false);
      });
  }

  loadCategories() {
    this.categoryService
      .getCategories(1, 100)
      .subscribe((res) => this.categories.set(res.data));
  }

  loadAgeGroups() {
    this.resourceService.getAgeGroups().subscribe((res) => {
      this.ageGroups.set(res.result || []);
    });
  }

  loadAllTopics() {
    this.topicService.getTopics(undefined, 1, 1000).subscribe((res) => {
      this.allTopics.set(res.data);
      // Also set filteredTopics initially to all topics
      this.filteredTopics.set(res.data);
    });
  }

  // Pagination methods
  onPageSizeChange(newSize: number) {
    this.pageSize.set(Number(newSize));
    this.currentPage.set(1);
    this.loadData();
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadData();
  }

  resetFilters() {
    this.searchControl.setValue('', { emitEvent: false });
    this.categoryFilter.setValue('', { emitEvent: false });
    this.topicFilter.setValue('', { emitEvent: false });
    this.typeFilter.setValue('', { emitEvent: false });
    this.ageGroupFilter.setValue('', { emitEvent: false });

    this.filteredTopics.set(this.topics());
    this.currentPage.set(1);
    this.loadData();
  }

  openUploadModal() {
    this.isUploadModalOpen.set(true);
    this.isEditMode.set(false);
    this.currentResourceId = null;
    this.selectedFile = null;
    this.uploadForm.reset({ type: 'VIDEO', ageGroupIds: [] });
  }

  closeUploadModal() {
    this.isUploadModalOpen.set(false);
    this.isEditMode.set(false);
    this.currentResourceId = null;
  }

  approveResource(id: string) {
    this.openConfirmModal(
      'Approve Resource?',
      'Are you sure you want to APPROVE this resource? It will become visible to all users.',
      'APPROVE',
      id
    );
  }

  executeApprove(id: string) {
    this.resourceService.approveResource(id).subscribe((res) => {
      this.toastService.showResponse(res);
      this.loadData();
    });
  }

  rejectResource(id: string) {
    this.openConfirmModal(
      'Reject Resource?',
      'Are you sure you want to REJECT this resource? It will be marked as rejected.',
      'REJECT',
      id
    );
  }

  executeReject(id: string) {
    this.resourceService.rejectResource(id).subscribe((res) => {
      this.toastService.showResponse(res);
      this.loadData();
    });
  }

  confirmDelete(id: string) {
    this.openConfirmModal(
      'Delete Resource?',
      'Are you sure you want to delete this resource? This action cannot be undone.',
      'DELETE',
      id
    );
  }

  executeDeleteSingle(id: string) {
    this.resourceService.deleteResource(id).subscribe((res) => {
      // Assuming cancelEdit() is a method that resets edit state, if it exists.
      // If not, this line might need adjustment or removal.
      // For now, I'll comment it out or assume it's handled elsewhere if not provided.

      this.toastService.showResponse(res);
      this.loadData();
    });
  }

  // BULK ACTIONS
  approveSelected() {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    this.openConfirmModal(
      'Approve Selected?',
      `Are you sure you want to approve ${ids.length} selected resources?`,
      'BULK_APPROVE'
    );
  }

  executeBulkApprove() {
    const ids = Array.from(this.selectedIds());
    let count = 0;
    ids.forEach((id) => {
      this.resourceService.approveResource(id).subscribe((res) => {
        count++;
        if (count === ids.length) {
          this.toastService.showResponse(res);
          this.selectedIds.set(new Set());
          this.loadData();
        }
      });
    });
  }

  deleteSelected() {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    this.openConfirmModal(
      'Delete Selected?',
      `Are you sure you want to delete ${ids.length} selected resources? This cannot be undone.`,
      'BULK_DELETE'
    );
  }

  executeBulkDelete() {
    const ids = Array.from(this.selectedIds());
    let count = 0;
    ids.forEach((id) => {
      this.resourceService.deleteResource(id).subscribe((res) => {
        count++;
        if (count === ids.length) {
          this.toastService.showResponse(res);
          this.selectedIds.set(new Set());
          this.loadData();
        }
      });
    });
  }

  // BULK MOVE LOGIC
  openMoveModal() {
    this.moveTargetCategoryId.reset();
    this.moveTargetTopicId.reset();
    this.isMoveModalOpen.set(true);
  }

  closeMoveModal() {
    this.isMoveModalOpen.set(false);
    this.moveTargetCategoryId.reset();
    this.moveTargetTopicId.reset();
  }

  executeBulkMove() {
    const ids = Array.from(this.selectedIds());
    const topicId = this.moveTargetTopicId.value;

    if (ids.length === 0 || !topicId) return;

    this.resourceService.moveResources(ids, topicId).subscribe((res) => {
      this.toastService.showResponse(res);
      this.selectedIds.set(new Set());
      this.closeMoveModal();
      this.loadData();
    });
  }

  editResource(resource: Resource) {
    this.isEditMode.set(true);
    this.currentResourceId = resource.id;
    this.currentThumbnailUrl.set(resource.thumbnailUrl || null);

    // Determine Upload Mode based on URL
    const isYoutube =
      resource.fileUrl &&
      (resource.fileUrl.includes('youtube.com') ||
        resource.fileUrl.includes('youtu.be'));
    this.uploadMode.set(isYoutube ? 'YOUTUBE' : 'FILE');

    // Find Category ID safely (handle string/number mismatch)
    // Fallback to resource.topic.id if resource.topicId is undefined
    const topicId =
      resource.topicId || (resource.topic ? resource.topic.id : '');

    // Prefer data from resource.topic if available (avoid lookup failure)
    let catId = resource.topic?.categoryId
      ? String(resource.topic.categoryId)
      : this.getCategoryIdFromTopic(String(topicId));

    // Pre-populate uploadTopics with the current topic if available
    // This ensures the name is displayed immediately even before the full list loads
    if (resource.topic) {
      // Cast to any to avoid strict Topic type mismatch (slug missing in inline type)
      this.uploadTopics.set([resource.topic as any]);
    }

    if (topicId && !catId) {
      // Topic potentially missing from allTopics (e.g. pagination or deleted). Fetch it!
      this.isTopicsLoading.set(true);
      this.topicService
        .getTopic(String(topicId))
        .pipe(finalize(() => this.isTopicsLoading.set(false)))
        .subscribe({
          next: (res) => {
            if (res.result) {
              const topic = res.result;
              // Add to allTopics cache so table updates too
              this.allTopics.update((current) => [...current, topic]);

              catId = String(topic.categoryId);
              this.patchUploadForm(resource, catId, String(topicId));
              this.loadTopicsForCategory(catId, String(topicId));
            } else {
              this.patchUploadForm(resource, '', String(topicId)); // Fallback
            }
          },
          error: (err) => {
            console.error('Failed to fetch topic details:', err);
            this.patchUploadForm(resource, '', String(topicId));
          },
        });
    } else {
      this.patchUploadForm(resource, catId, String(topicId));
      if (catId) {
        this.loadTopicsForCategory(catId, String(topicId));
      } else {
        // If we didn't pre-populate (no resource.topic), ensure it's empty or keep pre-populated
        if (!resource.topic) {
          this.uploadTopics.set([]);
        }
      }
    }

    this.isUploadModalOpen.set(true);
  }

  setUploadMode(mode: 'FILE' | 'YOUTUBE') {
    this.uploadMode.set(mode);
    if (mode === 'YOUTUBE') {
      this.uploadForm.patchValue({ type: 'VIDEO' });
    } else {
      // Reset to default or keep current if valid?
      // If we switch back to file, maybe we just leave it or set to VIDEO default
      if (this.uploadForm.get('type')?.value === 'YOUTUBE') {
        this.uploadForm.patchValue({ type: 'VIDEO' });
      }
    }
  }

  // Helper to DRY up form patching
  patchUploadForm(
    resource: Resource,
    catId: string | number,
    topicId: string | number
  ) {
    this.uploadForm.patchValue(
      {
        title: resource.title,
        categoryId: String(catId),
        topicId: String(topicId),
        type: resource.type
          ? resource.type.toUpperCase()
          : this.detectResourceType(resource.fileUrl || ''),
        description: resource.description,
        url: resource.fileUrl,
        ageGroupIds: resource.ageGroups
          ? resource.ageGroups.map((ag) => ag.id)
          : [],
      },
      { emitEvent: false }
    );
  }

  // Helper for loading dropdown topics
  loadTopicsForCategory(catId: string, preselectTopicId: string) {
    this.isTopicsLoading.set(true);
    this.topicService
      .getTopics(catId, 1, 100)
      .pipe(finalize(() => this.isTopicsLoading.set(false)))
      .subscribe((res) => {
        this.uploadTopics.set(res.data);
        // Re-patch topicId after options are loaded to ensure selection works
        this.uploadForm.patchValue(
          { topicId: String(preselectTopicId) },
          { emitEvent: false }
        );
      });
  }

  onFileSelected(event: Event) {
    if (this.isEditMode()) return;

    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];

      // Auto-populate Title if empty
      if (!this.uploadForm.get('title')?.value) {
        this.uploadForm.patchValue({ title: this.selectedFile.name });
      }

      // Auto-detect Type
      const type = this.detectResourceType(this.selectedFile.name);
      this.uploadForm.patchValue({ type });

      this.toastService.show(
        `File "${this.selectedFile.name}" selected!`,
        'info'
      );
    }
  }

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
  }

  // THUMBNAIL UPDATE LOGIC
  onThumbnailSelected(event: Event, resourceId: string) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      this.resourceService
        .updateThumbnail(resourceId, file)
        .subscribe((res) => {
          this.toastService.showResponse(res);
          this.loadData();
          if (res.result && res.result.thumbnailUrl) {
            this.currentThumbnailUrl.set(res.result.thumbnailUrl);
          }
        });

      // Reset input
      input.value = '';
    }
  }

  submitUpload() {
    if (this.uploadForm.invalid) {
      this.toastService.show('Please fill in all required fields.', 'error');
      // Mark all controls as touched to show errors
      this.uploadForm.markAllAsTouched();
      return;
    }

    const val = this.uploadForm.value;
    const currentUser = this.authService.currentUserValue;

    if (this.isEditMode() && this.currentResourceId) {
      // UPDATE (JSON Body)
      const updateData: any = {
        title: val.title,
        description: val.description,
        topicId: val.topicId,
        ageGroupIds: val.ageGroupIds || [],
      };

      // If YouTube mode and URL changed?
      // Spec says "youtubeLink" in JSON logic.
      if (this.uploadMode() === 'YOUTUBE' && val.url) {
        updateData.youtubeLink = val.url;
      }

      this.resourceService
        .updateResource(this.currentResourceId, updateData)
        .subscribe((res) => {
          this.toastService.showResponse(res);
          this.loadData();
          this.closeUploadModal();
        });
    } else {
      // CREATE (FormData for BOTH File and YouTube)
      const formData = new FormData();
      formData.append('title', val.title);
      formData.append('topicId', val.topicId);
      if (val.description) formData.append('description', val.description);

      // Handle Age Groups (Array)
      if (val.ageGroupIds && Array.isArray(val.ageGroupIds)) {
        val.ageGroupIds.forEach((id: string) => {
          formData.append('ageGroupIds', id);
        });
      }

      if (currentUser?.username) {
        formData.append('username', currentUser.username);
      }

      // 1. YouTube Mode
      if (this.uploadMode() === 'YOUTUBE') {
        const url = this.uploadForm.get('url')?.value;
        if (!url) {
          this.toastService.show('Please enter a YouTube URL.', 'error');
          return;
        }
        // Validate URL
        const videoId = this.extractYoutubeId(url);
        if (!videoId) {
          this.toastService.show('Invalid YouTube URL.', 'error');
          return;
        }

        formData.append('youtubeLink', url);
        // No 'file' appended.
      } else {
        // 2. File Upload Mode
        if (!this.selectedFile) {
          this.toastService.show('Please select a file to upload.', 'error');
          return;
        }
        formData.append('file', this.selectedFile);
      }

      this.resourceService.uploadResource(formData).subscribe((res) => {
        this.uploadForm.reset({ type: 'VIDEO', ageGroupIds: [] });
        this.selectedFile = null;
        this.toastService.showResponse(res);
        this.loadData();
        this.closeUploadModal();
      });
    }
  }

  // PREVIEW LOGIC
  openPreview(resource: Resource) {
    this.previewResource.set(resource);
    this.isLoading.set(true);
    this.previewType = this.getPreviewType(resource.fileUrl || '');
    this.previewUrl = this.getSafeUrl(resource.fileUrl || '', this.previewType);

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
    if (url.includes('youtube.com') || url.includes('youtu.be'))
      return 'YOUTUBE';

    const ext = url.split('.').pop()?.toLowerCase();
    if (['mp4', 'webm', 'ogg'].includes(ext || '')) return 'VIDEO';
    if (['mp3', 'wav', 'ogg'].includes(ext || '')) return 'AUDIO';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || ''))
      return 'IMAGE';
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx'].includes(ext || '')) return 'DOC';
    return 'UNSUPPORTED';
  }

  getSafeUrl(url: string, type: string): SafeResourceUrl {
    if (type === 'YOUTUBE') {
      const videoId = this.extractYoutubeId(url);
      if (videoId) {
        return this.sanitizer.bypassSecurityTrustResourceUrl(
          `https://www.youtube.com/embed/${videoId}?autoplay=1`
        );
      }
    }
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
  // Helpers
  getCategoryName(resource: Resource): string {
    // 1. Try nested topic data from API
    if (resource.topic?.categoryName) {
      return resource.topic.categoryName;
    }
    // 2. Fallback to local lookup
    const topicId = resource.topicId;
    if (!topicId) return 'Unknown';

    const topic = this.allTopics().find((t) => t.id == topicId);
    if (!topic) return 'Unknown';
    const cat = this.categories().find((c) => c.id == topic.categoryId);
    return cat ? cat.name : 'Unknown';
  }

  getCategoryIdFromTopic(topicId?: string | number): string {
    if (!topicId) return '';
    const topic = this.allTopics().find((t) => t.id == topicId);
    return topic ? topic.categoryId : '';
  }

  getTopicTitle(resource: Resource): string {
    // 1. Try nested topic data from API
    if (resource.topic?.name) {
      return resource.topic.name;
    }
    // 2. Fallback to local lookup
    const topicId = resource.topicId;
    if (!topicId) return 'General';
    const topic = this.allTopics().find((t) => t.id == topicId);
    return topic ? topic.name : 'General';
  }
  detectResourceType(filenameOrUrl: string): string {
    if (!filenameOrUrl) return 'VIDEO'; // Default
    if (
      filenameOrUrl.includes('youtube.com') ||
      filenameOrUrl.includes('youtu.be')
    )
      return 'VIDEO';

    const ext = filenameOrUrl.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext || '')) return 'PDF';
    if (['doc', 'docx'].includes(ext || '')) return 'WORD';
    if (['xls', 'xlsx'].includes(ext || '')) return 'EXCEL';
    if (['ppt', 'pptx'].includes(ext || '')) return 'POWERPOINT';
    if (['mp4', 'webm', 'ogg', 'mov'].includes(ext || '')) return 'VIDEO';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || ''))
      return 'IMAGE';
    if (['mp3', 'wav', 'm4a'].includes(ext || '')) return 'AUDIO';
    return 'DOCUMENT'; // Default fallback
  }

  getDisplayType(res: Resource): string {
    if (res.fileExtension?.toLowerCase() === 'youtube') return 'YOUTUBE';
    return res.type;
  }
}
