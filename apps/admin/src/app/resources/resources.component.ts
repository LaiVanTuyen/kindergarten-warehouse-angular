import { Component, inject, signal, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, ActivatedRoute, Params } from '@angular/router';
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

import { forkJoin } from 'rxjs';
import {
  ResourceService,
  CategoryService,
  TopicService,
  Resource,
  Category,
  Topic,
  AuthService,
  AgeGroup,
  UpdateResourceRequest,
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
export class ResourcesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  resourceService = inject(ResourceService);
  categoryService = inject(CategoryService);
  topicService = inject(TopicService);
  toastService = inject(ToastService);
  authService = inject(AuthService);
  sanitizer = inject(DomSanitizer);
  protected readonly Math = Math;

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
  pageSize = signal(12);
  selectedIds = signal<Set<string>>(new Set());

  // Search & Filter Controls
  // Search & Filter Controls
  searchControl = new FormControl('');
  typeFilter = new FormControl<string[]>([], { nonNullable: true });
  categoryFilter = new FormControl<string[]>([], { nonNullable: true });
  topicFilter = new FormControl<string[]>([], { nonNullable: true });
  ageGroupFilter = new FormControl<string[]>([], { nonNullable: true });

  // UI State for Filters
  showFilters = signal<boolean>(false);
  activeFilterDropdown = signal<string | null>(null);

  toggleFilterDropdown(name: string) {
    this.activeFilterDropdown.update((current) =>
      current === name ? null : name
    );
  }

  closeFilterDropdown() {
    this.activeFilterDropdown.set(null);
  }

  isSelected(control: FormControl<string[]>, value: string): boolean {
    return control.value.includes(value);
  }

  toggleFilter(control: FormControl<string[]>, value: string) {
    const current = control.value;
    if (current.includes(value)) {
      control.setValue(current.filter((v) => v !== value));
    } else {
      control.setValue([...current, value]);
    }
  }

  removeFilter(control: FormControl<string[]>, value: string) {
    const current = control.value;
    control.setValue(current.filter((v) => v !== value));
  }

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

  clearSelection() {
    this.selectedIds.set(new Set());
  }

  // UI State
  activeTab = signal<'pending' | 'list' | 'trash'>('pending');
  isEditMode = signal(false);
  currentResourceId: string | null = null;

  // Preview State
  previewResource = signal<Resource | null>(null);
  isLoading = signal(false);
  isTableLoading = signal(false);
  isTopicsLoading = signal(false); // Added missing signal
  currentThumbnailUrl = signal<string | null>(null); // Added missing signal
  previewUrl: SafeResourceUrl | null = null;
  previewType:
    | 'VIDEO'
    | 'AUDIO'
    | 'IMAGE'
    | 'DOCUMENT'
    | 'UNSUPPORTED'
    | 'YOUTUBE' = 'UNSUPPORTED';

  // Modal State
  isUploadModalOpen = signal(false);
  isMoveModalOpen = signal(false);
  uploadedFileDuration = signal<string | null>(null);
  selectedFile: File | null = null;

  // Helpers
  getCurrentResource(): Resource | undefined {
    return this.resources().find((r) => r.id === this.currentResourceId);
  }

  // Actions
  restoreResource(resource: Resource) {
    this.openConfirmModal(
      'Khôi phục Tài nguyên',
      `Bạn có chắc chắn muốn khôi phục "${resource.title}"?`,
      'RESTORE',
      resource.id
    );
  }

  executeRestore(id: string) {
    this.resourceService.restoreResource(id).subscribe({
      next: (res) => {
        this.toastService.showResponse(res);
        this.loadData();
      },
      error: (err: Error) => this.toastService.show(err.message, 'error'),
    });
  }

  restoreSelected() {
    this.openConfirmModal(
      'Khôi phục mục đã chọn',
      `Bạn có chắc chắn muốn khôi phục ${
        this.selectedIds().size
      } tài nguyên đã chọn?`,
      'BULK_RESTORE'
    );
  }

  executeBulkRestore() {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    this.isTableLoading.set(true);

    forkJoin(ids.map((id) => this.resourceService.restoreResource(id)))
      .pipe(finalize(() => this.isTableLoading.set(false)))
      .subscribe({
        next: () => {
          this.toastService.show('Khôi phục tài nguyên thành công', 'success');
          this.selectedIds.set(new Set());
          this.loadData();
        },
        error: (err: Error) => {
          this.toastService.show(
            'Một số tài nguyên không thể khôi phục: ' + err.message,
            'error'
          );
          this.loadData();
        },
      });
  }

  // Helpers
  formatFileSize(bytes: number | undefined): string {
    if (!bytes || bytes === 0) return '';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    // Localize 'Bytes' if needed, though standard is fine. "Byte", "KB", "MB"...
    // const sizes = ['Byte', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // GENERIC CONFIRMATION MODAL STATE
  isYoutube = signal<boolean>(false);

  // VIEW MODE
  viewMode = signal<'list' | 'grid'>('list');

  isConfirmModalOpen = signal(false);
  confirmConfig = signal<{
    title: string;
    message: string;
    action:
      | 'APPROVE'
      | 'REJECT'
      | 'DELETE'
      | 'BULK_APPROVE'
      | 'BULK_DELETE'
      | 'RESTORE'
      | 'BULK_RESTORE';
    data?: string | null;
  } | null>(null);

  constructor() {
    // Services injected via inject()
  }

  openConfirmModal(
    title: string,
    message: string,
    action:
      | 'APPROVE'
      | 'REJECT'
      | 'DELETE'
      | 'BULK_APPROVE'
      | 'BULK_DELETE'
      | 'RESTORE'
      | 'BULK_RESTORE',
    data: string | null = null
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
        if (config.data) this.executeApprove(config.data);
        break;
      case 'REJECT':
        if (config.data) this.executeReject(config.data);
        break;
      case 'DELETE':
        if (config.data) this.executeDeleteSingle(config.data);
        break;
      case 'BULK_APPROVE':
        this.executeBulkApprove();
        break;
      case 'BULK_DELETE':
        this.executeBulkDelete();
        break;
      case 'RESTORE':
        if (config.data) this.executeRestore(config.data);
        break;
      case 'BULK_RESTORE':
        this.executeBulkRestore();
        break;
    }
    this.closeConfirmModal();
  }

  ngOnInit() {
    this.initForms();
    this.loadCategories();
    this.loadAgeGroups();
    this.loadAllTopics(); // Load lookup data

    // 0. Initialize View Mode
    const savedView = localStorage.getItem('resourceViewMode');
    if (savedView === 'grid' || savedView === 'list') {
      this.viewMode.set(savedView);
    }

    // 1. Initialize Filters from URL
    this.initFiltersFromUrl();

    // 2. Load Data (will use values set above)
    this.loadData();

    // 3. Setup Watchers (to handle future changes)
    this.setupFilterWatchers();
  }

  initFiltersFromUrl() {
    const params = this.route.snapshot.queryParams;

    // Helper to coerce to array of strings (handle comma-separated strings or repeated params)
    const getArray = (key: string): string[] => {
      const val = params[key];
      if (!val) return [];
      if (Array.isArray(val)) return val;
      // Handle comma-separated string
      return (val as string).split(',').filter((v) => !!v);
    };

    // Patch values without emitting events (we load data manually after)
    this.searchControl.setValue(params['keyword'] || '', { emitEvent: false });
    this.typeFilter.setValue(getArray('types'), { emitEvent: false });
    this.categoryFilter.setValue(getArray('categorySlugs'), {
      emitEvent: false,
    });
    this.topicFilter.setValue(getArray('topicSlugs'), { emitEvent: false });
    this.ageGroupFilter.setValue(getArray('ageSlugs'), { emitEvent: false });

    // Set Active Tab if present
    if (params['status'] === 'DELETED') {
      this.activeTab.set('trash');
    } else if (params['status'] === 'PENDING') {
      this.activeTab.set('pending');
    } else {
      this.activeTab.set('pending'); // Default
    }
  }

  updateUrl() {
    const params: Params = {};

    if (this.searchControl.value) params['keyword'] = this.searchControl.value;
    if (this.typeFilter.value.length)
      params['types'] = this.typeFilter.value.join(',');
    if (this.categoryFilter.value.length)
      params['categorySlugs'] = this.categoryFilter.value.join(',');
    if (this.topicFilter.value.length)
      params['topicSlugs'] = this.topicFilter.value.join(',');
    if (this.ageGroupFilter.value.length)
      params['ageSlugs'] = this.ageGroupFilter.value.join(',');

    if (this.activeTab() === 'trash') {
      params['status'] = 'DELETED';
    } else if (this.activeTab() === 'pending') {
      params['status'] = 'PENDING';
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: null, // Clear other params (Don't merge)
      replaceUrl: true, // Don't spam history
    });
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
      ?.valueChanges.pipe(
        distinctUntilChanged(),
        debounceTime(300),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((url) => {
        if (!url) return;
        const videoId = this.extractYoutubeId(url);
        if (videoId) {
          this.uploadForm.patchValue({ type: 'YOUTUBE' }, { emitEvent: false });
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
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.currentPage.set(1);
        this.updateUrl();
        this.loadData();
      });

    this.typeFilter.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.currentPage.set(1);
        this.updateUrl();
        this.loadData();
      });

    this.ageGroupFilter.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.currentPage.set(1);
        this.updateUrl();
        this.loadData();
      });

    this.categoryFilter.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((slugs) => {
        this.topicFilter.setValue([]);
        if (slugs && slugs.length > 0) {
          // Map slugs to IDs for filtering topics
          const selectedCatIds = this.categories()
            .filter((c) => slugs.includes(c.slug))
            .map((c) => c.id);

          this.filteredTopics.set(
            this.allTopics().filter((t) =>
              selectedCatIds.includes(t.categoryId)
            )
          );
        } else {
          this.filteredTopics.set(this.allTopics());
        }
        this.currentPage.set(1);
        this.updateUrl();
        this.loadData();
      });

    this.topicFilter.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.currentPage.set(1);
        this.updateUrl();
        this.loadData();
      });

    // Upload Form Filter - Fetch Topics by Category from API
    this.uploadForm
      .get('categoryId')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((catId) => {
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
    this.moveTargetCategoryId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((catId) => {
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

  setActiveTab(tab: 'pending' | 'list' | 'trash') {
    this.activeTab.set(tab);

    // Reset Page & Filters on Tab Change
    this.currentPage.set(1);
    this.searchControl.setValue('', { emitEvent: false });
    this.categoryFilter.setValue([], { emitEvent: false });
    this.topicFilter.setValue([], { emitEvent: false });
    this.ageGroupFilter.setValue([], { emitEvent: false });
    this.typeFilter.setValue([], { emitEvent: false });

    // Force URL Update (Clear old params)
    this.updateUrl();
    this.loadData();
  }

  toggleView(mode: 'list' | 'grid') {
    this.viewMode.set(mode);
    localStorage.setItem('resourceViewMode', mode);
  }

  loadData() {
    let status:
      | 'PENDING'
      | 'APPROVED'
      | 'REJECTED'
      | 'HIDDEN'
      | 'DELETED'
      | undefined = undefined;
    if (this.activeTab() === 'pending') {
      status = 'PENDING';
    } else if (this.activeTab() === 'trash') {
      status = 'DELETED';
    }

    this.isTableLoading.set(true);

    this.resourceService
      .getResources({
        page: this.currentPage(),
        size: this.pageSize(),
        keyword: this.searchControl.value || undefined,
        status: status,
        types: this.typeFilter.value.length ? this.typeFilter.value : undefined,
        topicSlugs: this.topicFilter.value.length
          ? this.topicFilter.value
          : undefined,
        categorySlugs: this.categoryFilter.value.length
          ? this.categoryFilter.value
          : undefined,
        ageSlugs: this.ageGroupFilter.value.length
          ? this.ageGroupFilter.value
          : undefined,
      })
      .pipe(delay(500))
      .subscribe((res) => {
        // Handle result vs data structure if needed, currently service returns RestResponse with data
        const responseData = res.result || res.data; // Handle both due to spec change
        if (responseData && 'content' in responseData) {
          // Polyfill missing types for icons/edit
          const content = (responseData.content || []).map((r: Resource) => ({
            ...r,
            // Map API fields directly
            resourceType:
              r.resourceType ||
              (r.fileUrl?.includes('youtube') ? 'YOUTUBE' : 'FILE'),
            fileType: (r.fileType ||
              this.detectFileType(r.fileUrl || '')) as Resource['fileType'],
            // Extract extension if missing
            fileExtension:
              r.fileExtension || this.extractExtension(r.fileUrl || ''),
            // Helper for UI (Legacy support)
            type:
              r.resourceType === 'YOUTUBE'
                ? 'YOUTUBE'
                : r.fileType || this.detectFileType(r.fileUrl || ''),
            uploader: r.createdBy || r.uploader || 'Hệ thống',
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
    this.categoryFilter.setValue([], { emitEvent: false });
    this.topicFilter.setValue([], { emitEvent: false });
    this.typeFilter.setValue([], { emitEvent: false });
    this.ageGroupFilter.setValue([], { emitEvent: false });

    this.filteredTopics.set(this.topics());
    this.currentPage.set(1);
    this.loadData();
  }

  // UI Helpers for Filter Chips
  getCategoryNameBySlug(slug: string): string {
    const cat = this.categories().find((c) => c.slug === slug);
    return cat ? cat.name : slug;
  }

  getTopicNameBySlug(slug: string): string {
    const topic = this.allTopics().find((t) => t.slug === slug);
    return topic ? topic.name : slug;
  }

  getAgeGroupNameBySlug(slug: string): string {
    const ag = this.ageGroups().find((a) => a.slug === slug);
    return ag ? ag.name : slug;
  }

  getTypeLabel(type: string): string {
    const map: Record<string, string> = {
      VIDEO: 'Video',
      DOCUMENT: 'Tài liệu',
      PDF: 'PDF',
      EXCEL: 'Excel',
      POWERPOINT: 'PowerPoint',
      IMAGE: 'Hình ảnh',
      OTHER: 'Khác',
    };
    return map[type] || type;
  }

  openUploadModal() {
    this.isUploadModalOpen.set(true);
    this.isEditMode.set(false);
    this.currentResourceId = null;
    this.selectedFile = null;
    this.uploadedFileDuration.set(null); // Reset duration
    this.uploadForm.reset({ type: 'VIDEO', ageGroupIds: [] });
  }

  closeUploadModal() {
    this.isUploadModalOpen.set(false);
    this.isEditMode.set(false);
    this.currentResourceId = null;
  }

  approveResource(id: string) {
    this.openConfirmModal(
      'Phê duyệt Tài nguyên?',
      'Bạn có chắc chắn muốn PHÊ DUYỆT tài nguyên này? Nó sẽ hiển thị cho tất cả người dùng.',
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
      'Từ chối Tài nguyên?',
      'Bạn có chắc chắn muốn TỪ CHỐI tài nguyên này? Nó sẽ bị đánh dấu là đã từ chối.',
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
      'Xóa Tài nguyên?',
      'Bạn có chắc chắn muốn xóa tài nguyên này? Hành động này không thể hoàn tác.',
      'DELETE',
      id
    );
  }

  executeDeleteSingle(id: string) {
    this.resourceService.deleteResource(id).subscribe((res) => {
      this.toastService.showResponse(res);
      this.loadData();
    });
  }

  // BULK ACTIONS
  approveSelected() {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    this.openConfirmModal(
      'Phê duyệt các mục đã chọn?',
      `Bạn có chắc chắn muốn phê duyệt ${ids.length} tài nguyên đã chọn?`,
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
      'Xóa các mục đã chọn?',
      `Bạn có chắc chắn muốn xóa ${ids.length} tài nguyên đã chọn? Hành động này không thể hoàn tác.`,
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
      this.uploadTopics.set([
        {
          ...resource.topic,
          id: String(resource.topic.id),
          categoryId: String(resource.topic.categoryId),
        } as Topic,
      ]);
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
          error: (err: unknown) => {
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
      this.uploadForm.patchValue({ type: 'YOUTUBE' });
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
        type: resource.fileType
          ? resource.fileType.toUpperCase()
          : this.detectFileType(resource.fileUrl || ''),
        description: resource.description,
        url: resource.fileUrl,
        ageGroupIds: resource.ageGroups
          ? resource.ageGroups.map((ag) => ag.id)
          : [],
      },
      { emitEvent: false }
    );
    this.uploadForm.markAsPristine();
    this.uploadForm.markAsUntouched();
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

  // Helper to extract video duration
  getVideoDuration(file: File): Promise<string> {
    return new Promise((resolve) => {
      try {
        const video = document.createElement('video');
        video.preload = 'metadata';

        video.onloadedmetadata = () => {
          window.URL.revokeObjectURL(video.src);
          const duration = video.duration;
          resolve(this.formatDuration(duration));
        };

        video.onerror = () => {
          resolve('');
        };

        video.src = window.URL.createObjectURL(file);
      } catch (e) {
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

    if (h > 0) {
      const hDisplay = h < 10 ? `0${h}` : h;
      return `${hDisplay}:${mDisplay}:${sDisplay}`;
    }
    return `${mDisplay}:${sDisplay}`;
  }

  async onFileSelected(event: Event) {
    if (this.isEditMode()) return;

    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.uploadedFileDuration.set(null); // Reset

      // Auto-populate Title if empty
      if (!this.uploadForm.get('title')?.value) {
        this.uploadForm.patchValue({ title: this.selectedFile.name });
      }

      // Auto-detect Type
      const type = this.detectFileType(this.selectedFile.name);
      this.uploadForm.patchValue({ type });

      // Auto-detect Duration if Video
      if (this.selectedFile.type.startsWith('video/')) {
        const duration = await this.getVideoDuration(this.selectedFile);
        if (duration) {
          this.uploadedFileDuration.set(duration);
          console.log('Auto-detected duration:', duration);
        }
      }

      this.toastService.show(
        `Đã chọn file "${this.selectedFile.name}"!`,
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
    this.uploadForm.get('ageGroupIds')?.markAsDirty();
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
      this.toastService.show(
        'Vui lòng điền đầy đủ các trường bắt buộc.',
        'error'
      );
      // Mark all controls as touched to show errors
      this.uploadForm.markAllAsTouched();
      return;
    }

    const val = this.uploadForm.value;
    const currentUser = this.authService.currentUserValue;

    if (this.isEditMode() && this.currentResourceId) {
      // UPDATE (JSON Body)
      const updateData: UpdateResourceRequest = {
        title: val.title,
        description: val.description,
        topicId: val.topicId,
        ageGroupIds: val.ageGroupIds || [],
        duration: this.uploadedFileDuration() || undefined,
      };

      // If YouTube mode and URL changed?
      // Spec says "youtubeLink" in JSON logic.
      if (this.uploadMode() === 'YOUTUBE' && val.url) {
        updateData.youtubeLink = val.url;
      }

      // Exception: Allow manual override of fileType (if not YOUTUBE)
      if (val.type && val.type !== 'YOUTUBE') {
        updateData.fileType = val.type;
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
          this.toastService.show('Vui lòng nhập đường dẫn YouTube.', 'error');
          return;
        }
        // Validate URL
        const videoId = this.extractYoutubeId(url);
        if (!videoId) {
          this.toastService.show('Đường dẫn YouTube không hợp lệ.', 'error');
          return;
        }

        formData.append('youtubeLink', url);
        // No 'file' appended.
      } else {
        // 2. File Upload Mode
        if (!this.selectedFile) {
          this.toastService.show('Vui lòng chọn file để tải lên.', 'error');
          return;
        }
        formData.append('file', this.selectedFile);
        if (this.uploadedFileDuration()) {
          formData.append('duration', this.uploadedFileDuration()!);
        }
      }

      this.resourceService.uploadResource(formData).subscribe((res) => {
        this.uploadForm.reset({ type: 'VIDEO', ageGroupIds: [] });
        this.selectedFile = null;
        this.uploadedFileDuration.set(null);
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

    let safeType = 'UNSUPPORTED';

    // Determine Preview Type based on Resource Data
    if (resource.resourceType === 'YOUTUBE') {
      this.previewType = 'VIDEO'; // UI uses VIDEO layout for both
      safeType = 'YOUTUBE'; // Sanitizer needs YOUTUBE to convert to embed URL
      this.isYoutube.set(true);
    } else {
      this.isYoutube.set(false);
      // FILE
      const ft = resource.fileType || 'OTHER';
      if (ft === 'VIDEO') {
        this.previewType = 'VIDEO';
        safeType = 'VIDEO';
      } else if (ft === 'IMAGE') {
        this.previewType = 'IMAGE';
        safeType = 'IMAGE';
      } else if (
        ['PDF', 'DOCUMENT', 'WORD', 'EXCEL', 'POWERPOINT'].includes(ft)
      ) {
        this.previewType = 'DOCUMENT'; // UI uses iframe
        safeType = 'DOC'; // Sanitizer uses Google Viewer
      } else {
        this.previewType = 'UNSUPPORTED';
        safeType = 'UNSUPPORTED';
      }
    }

    this.previewUrl = this.getSafeUrl(resource.fileUrl || '', safeType);

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

  getPreviewType(
    url: string
  ): 'VIDEO' | 'IMAGE' | 'PDF' | 'UNSUPPORTED' | 'YOUTUBE' {
    if (!url) return 'UNSUPPORTED';

    // Check if YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'VIDEO'; // YouTube is treated as VIDEO for preview but handled by specific player

    const ext = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || ''))
      return 'IMAGE';
    if (['mp4', 'webm', 'ogg', 'mov'].includes(ext || '')) return 'VIDEO';
    if (ext === 'pdf') return 'PDF';

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
    if (!topicId) return 'Không xác định';

    const topic = this.allTopics().find((t) => t.id == topicId);
    if (!topic) return 'Không xác định';
    const cat = this.categories().find((c) => c.id == topic.categoryId);
    return cat ? cat.name : 'Không xác định';
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
    if (!topicId) return 'Chung';
    const topic = this.allTopics().find((t) => t.id == topicId);
    return topic ? topic.name : 'Chung';
  }

  extractExtension(filenameOrUrl: string): string {
    return filenameOrUrl.split('.').pop()?.toLowerCase() || '';
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'APPROVED':
        return 'Đã duyệt';
      case 'PENDING':
        return 'Chờ duyệt';
      case 'REJECTED':
        return 'Đã từ chối';
      case 'DELETED':
        return 'Đã xóa';
      case 'HIDDEN':
        return 'Đã ẩn';
      default:
        return 'Nháp';
    }
  }

  getThumbnail(resource: Resource): string {
    if (resource.thumbnailUrl) return resource.thumbnailUrl;

    if (resource.resourceType === 'YOUTUBE' && resource.fileUrl) {
      const videoId = this.extractYoutubeId(resource.fileUrl);
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
      }
    }
    return ''; // Trigger onerror in template
  }

  getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'YOUTUBE':
        return 'bg-red-50 text-red-700 border-red-100';
      case 'VIDEO':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'PDF':
        return 'bg-rose-50 text-rose-700 border-rose-200'; // Same as video? Maybe differentiate
      case 'WORD':
      case 'DOCUMENT':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'EXCEL':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'POWERPOINT':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'IMAGE':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  }

  isImageOrVideo(resource: Resource): boolean {
    return (
      resource.resourceType === 'YOUTUBE' ||
      resource.fileType === 'VIDEO' ||
      resource.fileType === 'IMAGE'
    );
  }

  detectFileType(filenameOrUrl: string): string {
    if (!filenameOrUrl) return 'OTHER';

    // Check YouTube first just in case
    if (
      filenameOrUrl.includes('youtube.com') ||
      filenameOrUrl.includes('youtu.be')
    )
      return 'VIDEO';

    const ext = this.extractExtension(filenameOrUrl);
    if (['pdf'].includes(ext)) return 'PDF';
    if (['doc', 'docx', 'txt'].includes(ext)) return 'DOCUMENT';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'EXCEL';
    if (['ppt', 'pptx'].includes(ext)) return 'POWERPOINT';
    if (['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'].includes(ext))
      return 'VIDEO';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'IMAGE';

    return 'OTHER';
  }

  getDisplayType(res: Resource): string {
    if (res.resourceType === 'YOUTUBE') return 'YOUTUBE';
    return res.fileType || 'DOCUMENT';
  }
}
