import {
  Component,
  inject,
  signal,
  computed,
  WritableSignal,
  DestroyRef,
  OnInit,
} from '@angular/core';
import {
  takeUntilDestroyed,
  toSignal,
  toObservable,
} from '@angular/core/rxjs-interop';
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
  finalize,
  switchMap,
  tap,
} from 'rxjs/operators';

import { Subject } from 'rxjs';
import {
  ResourceService,
  CategoryService,
  TopicService,
  Resource,
  Category,
  Topic,
  AuthService,
  AgeGroup,
  getResourceBadgeClass
} from '@kindergarten-warehouse/data-access';
import { ToastService } from '@kindergarten-warehouse/data-access';

import { ResourcesFormComponent } from './resources-form/resources-form.component';
import { MultiSelectFilterComponent } from '../shared/components/multi-select-filter/multi-select-filter.component';

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
    ResourcesFormComponent,
    MultiSelectFilterComponent,
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

  private triggerLoad$ = new Subject<void>();

  // Data Signals
  resources = signal<Resource[]>([]);
  categories = signal<Category[]>([]);
  topics = signal<Topic[]>([]); // For Filter Dropdown
  allTopics = signal<Topic[]>([]); // For Lookups (View/Edit)
  filteredTopics = signal<Topic[]>([]); // For Filter Logic
  moveTopics = signal<Topic[]>([]); // For Move Modal
  ageGroups = signal<AgeGroup[]>([]);
  // Page State
  totalResources = signal(0);
  totalPages = signal(0);
  currentPage = signal(1);
  pageSize = signal(12);
  selectedIds = signal<Set<string>>(new Set());

  // Search & Filter Controls
  searchControl = new FormControl('');
  typeFilter = signal<Set<string>>(new Set());
  categoryFilter = signal<Set<string>>(new Set());
  topicFilter = signal<Set<string>>(new Set());
  ageGroupFilter = signal<Set<string>>(new Set());

  // Filter Options for MultiSelectFilterComponent
  categoryOptions = computed(() =>
    this.categories().map((c) => ({ label: c.name, value: c.slug }))
  );
  topicOptions = computed(() =>
    this.filteredTopics().map((t) => ({ label: t.name, value: t.slug }))
  );
  ageGroupOptions = computed(() =>
    this.ageGroups().map((ag) => ({ label: ag.name, value: ag.slug }))
  );
  typeOptions = [
    { label: 'Video', value: 'VIDEO' },
    { label: 'Hình ảnh', value: 'IMAGE' },
    { label: 'Tài liệu / Văn bản', value: 'DOCUMENT' },
    { label: 'PDF', value: 'PDF' },
    { label: 'Excel', value: 'EXCEL' },
    { label: 'PowerPoint', value: 'POWERPOINT' },
  ];

  // Signals from FormControls - These are no longer needed as filters are signals directly
  // categoryFilterSignal = toSignal(this.categoryFilter.valueChanges, {
  //   initialValue: this.categoryFilter.value,
  // });
  // topicFilterSignal = toSignal(this.topicFilter.valueChanges, {
  //   initialValue: this.topicFilter.value,
  // });
  // ageGroupFilterSignal = toSignal(this.ageGroupFilter.valueChanges, {
  //   initialValue: this.ageGroupFilter.value,
  // });
  // typeFilterSignal = toSignal(this.typeFilter.valueChanges, {
  //   initialValue: this.typeFilter.value,
  // });

  // Computed Sets for MultiSelectFilterComponent - These are now the filter signals themselves
  categoryFilterSet = computed(() => this.categoryFilter());
  topicFilterSet = computed(() => this.topicFilter());
  ageGroupFilterSet = computed(() => this.ageGroupFilter());
  typeFilterSet = computed(() => this.typeFilter());

  getFilterSet(key: 'category' | 'topic' | 'age' | 'type'): Set<string> {
    switch (key) {
      case 'category':
        return this.categoryFilter();
      case 'topic':
        return this.topicFilter();
      case 'age':
        return this.ageGroupFilter();
      case 'type':
        return this.typeFilter();
      default:
        return new Set();
    }
  }

  onFilterChange(
    targetSignal: ReturnType<typeof signal<Set<string>>>,
    newSet: Set<string>
  ) {
    targetSignal.set(newSet);
  }

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

  isSelected(control: WritableSignal<Set<string>>, value: string): boolean {
    return control().has(value);
  }

  toggleFilter(control: WritableSignal<Set<string>>, value: string) {
    control.update((current) => {
      const newSet = new Set(current);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      return newSet;
    });
  }

  removeFilter(control: WritableSignal<Set<string>>, value: string) {
    control.update((current) => {
      const newSet = new Set(current);
      newSet.delete(value);
      return newSet;
    });
  }

  // Forms
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
  activeTab = signal<'pending' | 'list' | 'trash' | 'rejected'>('pending');
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
  isRejectModalOpen = signal(false);
  resourceToRejectIds = signal<string[]>([]);
  rejectReasonControl = new FormControl('', [
    Validators.required,
    Validators.maxLength(1000),
  ]);

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
    this.resourceService
      .restoreResource(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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

    this.resourceService
      .bulkRestoreResources(ids)
      .pipe(finalize(() => this.isTableLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.toastService.showResponse(res);
          this.selectedIds.set(new Set());
          this.loadData();
        },
        error: (err: Error) => {
          this.toastService.show(
            'Lỗi khi khôi phục tài nguyên: ' + err.message,
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

    // 2. Setup Watchers (to handle future changes)
    this.setupFilterWatchers();

    // 3. Load Data (will use values set above)
    this.loadData();
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
    this.typeFilter.set(new Set(getArray('types')));
    this.categoryFilter.set(new Set(getArray('categorySlugs')));
    this.topicFilter.set(new Set(getArray('topicSlugs')));
    this.ageGroupFilter.set(new Set(getArray('ageSlugs')));

    // Set Active Tab if present
    if (params['status'] === 'DELETED') {
      this.activeTab.set('trash');
    } else if (params['status'] === 'REJECTED') {
      this.activeTab.set('rejected');
    } else if (params['status'] === 'PENDING') {
      this.activeTab.set('pending');
    } else {
      this.activeTab.set('pending'); // Default
    }
  }

  updateUrl() {
    const params: Params = {};

    if (this.searchControl.value) params['keyword'] = this.searchControl.value;
    if (this.typeFilter().size > 0)
      params['types'] = Array.from(this.typeFilter()).join(',');
    if (this.categoryFilter().size > 0)
      params['categorySlugs'] = Array.from(this.categoryFilter()).join(',');
    if (this.topicFilter().size > 0)
      params['topicSlugs'] = Array.from(this.topicFilter()).join(',');
    if (this.ageGroupFilter().size > 0)
      params['ageSlugs'] = Array.from(this.ageGroupFilter()).join(',');

    if (this.activeTab() === 'trash') {
      params['status'] = 'DELETED';
    } else if (this.activeTab() === 'rejected') {
      params['status'] = 'REJECTED';
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

  setupFilterWatchers() {
    import('rxjs').then(({ combineLatest }) => {
      // Create observables from signals
      const search$ = toObservable(
        toSignal(this.searchControl.valueChanges, {
          initialValue: this.searchControl.value,
        })
      ).pipe(debounceTime(300), distinctUntilChanged()); // Apply debounce/distinct here
      const category$ = toObservable(this.categoryFilter);
      const topic$ = toObservable(this.topicFilter);
      const ageGroup$ = toObservable(this.ageGroupFilter);
      const type$ = toObservable(this.typeFilter);

      // Handle category -> topic dependency
      category$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((slugsSet) => {
          this.topicFilter.set(new Set()); // Reset topic when category changes
          const slugs = Array.from(slugsSet);
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
        });

      // Handle global filter changes
      combineLatest([search$, type$, category$, topic$, ageGroup$])
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          debounceTime(50) // small debounce to batch signal updates
        )
        .subscribe(() => {
          this.currentPage.set(1);
          this.updateUrl();
          this.triggerLoad$.next();
        });
    });

    this.triggerLoad$
      .pipe(
        tap(() => this.isTableLoading.set(true)),
        switchMap(() => {
          let status: string | string[] | undefined = undefined;
          if (this.activeTab() === 'pending') {
            status = 'PENDING';
          } else if (this.activeTab() === 'trash') {
            status = 'DELETED';
          } else if (this.activeTab() === 'rejected') {
            status = 'REJECTED';
          } else if (this.activeTab() === 'list') {
            status = 'APPROVED'; // Tạm thời tải APPROVED cho Kho tài liệu theo ý Khách hàng
          }

          return this.resourceService.getResources({
            page: this.currentPage(),
            size: this.pageSize(),
            keyword: this.searchControl.value || undefined,
            status: status,
            types:
              this.typeFilter().size > 0
                ? Array.from(this.typeFilter())
                : undefined,
            topicSlugs:
              this.topicFilter().size > 0
                ? Array.from(this.topicFilter())
                : undefined,
            categorySlugs:
              this.categoryFilter().size > 0
                ? Array.from(this.categoryFilter())
                : undefined,
            ageSlugs:
              this.ageGroupFilter().size > 0
                ? Array.from(this.ageGroupFilter())
                : undefined,
          });
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          const responseData = res.result || res.data;
          if (responseData && 'content' in responseData) {
            const content = (responseData.content || []).map((r: Resource) => ({
              ...r,
              resourceType:
                r.resourceType ||
                (r.fileUrl?.includes('youtube') ? 'YOUTUBE' : 'FILE'),
              fileType: (r.fileType ||
                this.detectFileType(r.fileUrl || '')) as Resource['fileType'],
              fileExtension:
                r.fileExtension || this.extractExtension(r.fileUrl || ''),
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
        },
        error: (err: unknown) => {
          console.error('Failed to load resources', err);
          this.toastService.show('Không thể tải dữ liệu tài nguyên', 'error');
          this.isTableLoading.set(false);
          this.resources.set([]);
          this.totalResources.set(0);
        },
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

  setActiveTab(tab: 'pending' | 'list' | 'trash' | 'rejected') {
    this.activeTab.set(tab);

    // Reset Page & Filters on Tab Change
    this.currentPage.set(1);
    this.searchControl.setValue('', { emitEvent: false });
    this.categoryFilter.set(new Set());
    this.topicFilter.set(new Set());
    this.ageGroupFilter.set(new Set());
    this.typeFilter.set(new Set());

    // Force URL Update (Clear old params)
    this.updateUrl();
    this.loadData();
  }

  executeChangeVisibility(id: string, newVisibility: 'PUBLIC' | 'PRIVATE') {
    this.isTableLoading.set(true);
    this.resourceService
      .changeVisibility(id, newVisibility)
      .pipe(
        finalize(() => this.isTableLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          this.toastService.showResponse(res);
          this.loadData();
        },
        error: () => {
          // Handled by interceptor or service
        },
      });
  }

  trackById(index: number, item: Resource): string {
    return item.id;
  }

  toggleView(mode: 'list' | 'grid') {
    this.viewMode.set(mode);
    localStorage.setItem('resourceViewMode', mode);
  }

  loadData() {
    this.triggerLoad$.next();
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
    this.searchControl.setValue('');
    this.categoryFilter.set(new Set());
    this.topicFilter.set(new Set());
    this.typeFilter.set(new Set());
    this.ageGroupFilter.set(new Set());

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
    this.currentResourceId = null;
    this.isEditMode.set(false);
    this.isUploadModalOpen.set(true);
  }

  closeUploadModal() {
    this.isUploadModalOpen.set(false);
    this.isEditMode.set(false);
    this.currentResourceId = null;
  }

  handleSaveSuccess() {
    this.closeUploadModal();
    this.loadData();
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
    this.resourceService
      .approveResource(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.toastService.showResponse(res);
        this.loadData();
      });
  }

  rejectResource(id: string) {
    this.resourceToRejectIds.set([id]);
    this.rejectReasonControl.reset();
    this.isRejectModalOpen.set(true);
  }

  closeRejectModal() {
    this.isRejectModalOpen.set(false);
    this.resourceToRejectIds.set([]);
  }

  executeReject() {
    if (this.rejectReasonControl.invalid) {
      this.rejectReasonControl.markAsTouched();
      return;
    }
    const ids = this.resourceToRejectIds();
    if (ids.length === 0) return;

    const reason = this.rejectReasonControl.value || '';
    this.isTableLoading.set(true);

    this.resourceService
      .bulkRejectResources(ids, reason)
      .pipe(
        finalize(() => {
          this.isTableLoading.set(false);
          this.closeRejectModal();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          this.toastService.showResponse(res);
          const failedIds = res.data?.failedIds || [];
          if (failedIds.length > 0) {
            this.selectedIds.set(new Set(failedIds));
            this.toastService.show(
              `Có ${failedIds.length} tài liệu bị lỗi khi từ chối.`,
              'error'
            );
          } else {
            this.selectedIds.set(new Set());
          }
          this.loadData();
        },
        error: (err: Error) => {
          this.toastService.show(
            'Lỗi khi từ chối tài nguyên: ' + err.message,
            'error'
          );
          this.loadData();
        },
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
    const isHard = this.activeTab() === 'trash';
    this.resourceService
      .deleteResource(id, isHard)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
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

  rejectSelected() {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    this.resourceToRejectIds.set(ids);
    this.rejectReasonControl.reset();
    this.isRejectModalOpen.set(true);
  }

  executeBulkApprove() {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    this.isTableLoading.set(true);

    this.resourceService
      .bulkApproveResources(ids)
      .pipe(
        finalize(() => this.isTableLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          this.toastService.showResponse(res);
          const failedIds = res.data?.failedIds || [];
          if (failedIds.length > 0) {
            this.selectedIds.set(new Set(failedIds));
            this.toastService.show(
              `Có ${failedIds.length} tài liệu bị lỗi khi phê duyệt.`,
              'error'
            );
          } else {
            this.selectedIds.set(new Set());
          }
          this.loadData();
        },
        error: (err: Error) => {
          this.toastService.show(
            'Lỗi khi phê duyệt tài nguyên: ' + err.message,
            'error'
          );
          this.loadData();
        },
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
    if (ids.length === 0) return;

    this.isTableLoading.set(true);
    const isHard = this.activeTab() === 'trash';

    this.resourceService
      .bulkDeleteResources(ids, isHard)
      .pipe(finalize(() => this.isTableLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.toastService.showResponse(res);
          this.selectedIds.set(new Set());
          this.loadData();
        },
        error: (err: Error) => {
          this.toastService.show(
            'Lỗi khi xóa tài nguyên: ' + err.message,
            'error'
          );
          this.loadData();
        },
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

    this.resourceService
      .moveResources(ids, topicId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.toastService.showResponse(res);
        this.selectedIds.set(new Set());
        this.closeMoveModal();
        this.loadData();
      });
  }

  editResource(resource: Resource) {
    this.currentResourceId = resource.id;
    this.isEditMode.set(true);
    this.isUploadModalOpen.set(true);
  }

  /** Extract YouTube video ID from any YouTube URL format */
  getYoutubeVideoId(url: string): string | null {
    if (!url) return null;
    try {
      // Handle protocol-less URLs (e.g. "youtube.com/watch?v=...")
      const urlToParse = url.startsWith('http') ? url : `https://${url}`;
      const parsed = new URL(urlToParse);

      // Standard: youtube.com/watch?v=ID
      if (parsed.hostname.includes('youtube.com')) {
        return parsed.searchParams.get('v');
      }
      // Short: youtu.be/ID
      if (parsed.hostname === 'youtu.be') {
        return parsed.pathname.slice(1).split('?')[0] || null;
      }
      // Embed: youtube.com/embed/ID
      const embedMatch = parsed.pathname.match(/\/embed\/([^/?]+)/);
      if (embedMatch) return embedMatch[1];
    } catch {
      // Not a valid URL yet — user still typing
    }
    return null;
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
      const videoId = this.getYoutubeVideoId(url);
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
    // 1. Priority: Auto-generated YouTube Thumbnail (prevents stale DB thumbs after link update)
    if (resource.resourceType === 'YOUTUBE' && resource.fileUrl) {
      const videoId = this.getYoutubeVideoId(resource.fileUrl);
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
      }
    }

    // 2. Fallback: Saved DB Thumbnail
    if (resource.thumbnailUrl) return resource.thumbnailUrl;

    return ''; // Trigger onerror in template
  }

  getTypeBadgeClass(type: string | undefined): string {
    return getResourceBadgeClass(type);
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
