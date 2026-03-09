import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { PaginationComponent } from '../shared/components/pagination/pagination.component';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  FormsModule,
  Validators,
  FormGroup,
} from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  CategoryService,
  TopicService,
  Category,
  Topic,
  CategoryViewMode,
  CategoryAction,
  CategoryItemType,
} from '@kindergarten-warehouse/data-access';
import { BreadcrumbComponent } from '../shared/components/breadcrumb/breadcrumb.component';
import { ToastService } from '@kindergarten-warehouse/data-access';

import { MultiSelectFilterComponent } from '../shared/components/multi-select-filter/multi-select-filter.component';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    PaginationComponent,
    BreadcrumbComponent,
    MultiSelectFilterComponent,
  ],
  templateUrl: './categories.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
    `,
  ],
})
export class CategoriesComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  categoryService = inject(CategoryService);
  topicService = inject(TopicService);
  toastService = inject(ToastService);

  // Data Signals
  categories = signal<Category[]>([]);
  topics = signal<Topic[]>([]);
  trashTopics = signal<Topic[]>([]);

  // Filter out trash topics that belong to currently visible deleted categories to avoid duplication
  filteredTrashTopics = computed(() => {
    const visibleCategoryIds = new Set(this.categories().map((c) => c.id));
    return this.trashTopics().filter(
      (t) => !visibleCategoryIds.has(t.categoryId)
    );
  });

  filteredTopics = signal<Topic[]>([]); // For search filtering in local listean>>({});
  loadingTopicsState = signal<Record<string, boolean>>({});
  loadedCategoryIds = new Set<string>();

  // Bulk Selection
  selectedIds = signal<Set<string>>(new Set());

  // Computed: Are all visible categories selected?
  allSelected = computed(() => {
    const visible = this.categories();
    return (
      visible.length > 0 && visible.every((c) => this.selectedIds().has(c.id))
    );
  });

  // Sorted dropdown for Topic Modal (A-Z)
  sortedCategoriesDropdown = computed(() => {
    return [...this.categories()].sort((a, b) => a.name.localeCompare(b.name));
  });

  protected Math = Math;

  // Tree View State
  expandedCategoryIds = signal<Set<string>>(new Set());

  // Pagination State
  pageSize = signal(10);
  currentPageCategories = signal(1);
  totalCategories = signal(0);

  // Sorting State
  sortColumn = signal<'name' | 'createdAt'>('createdAt');
  sortDirection = signal<'asc' | 'desc'>('desc');

  // Filter State
  statusFilter = signal<Set<string>>(new Set());
  activeFilterDropdown = signal<string | null>(null);
  showFilters = signal<boolean>(false);

  statusOptions = [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' },
  ];

  // Delete Modal State
  deleteModalTitle = signal('');
  deleteModalMessage = signal('');
  isPermanentDelete = signal(false);

  // Forms
  // Forms
  categoryForm = this.fb.group({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    slug: new FormControl<string>('', { nonNullable: true }),
    description: new FormControl<string>('', { nonNullable: true }),
    icon: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    isActive: new FormControl<boolean>(true, { nonNullable: true }),
  });

  topicForm = this.fb.group({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    description: new FormControl<string>('', { nonNullable: true }),
    categoryId: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    isActive: new FormControl<boolean>(true, { nonNullable: true }),
  });
  searchControl = new FormControl('');

  // State
  viewMode = signal<CategoryViewMode>('list');
  isCategoryModalOpen = signal(false);
  isTopicModalOpen = signal(false);
  isConfirmationModalOpen = signal(false);

  // Edit State
  isEditMode = signal(false);
  currentId: string | null = null;
  selectedFile: File | null = null;
  pendingItem: {
    type: CategoryItemType;
    id: string;
    action: CategoryAction;
  } | null = null;

  constructor() {
    /* Forms initialized inline */

    // 1. Initialize logic from URL (Deep Linking)
    const params = this.route.snapshot.queryParams;
    if (params['mode']) this.viewMode.set(params['mode'] as CategoryViewMode);
    if (params['sort']) this.sortColumn.set(params['sort']);
    if (params['dir']) this.sortDirection.set(params['dir']);
    if (params['page']) this.currentPageCategories.set(Number(params['page']));
    if (params['search'])
      this.searchControl.setValue(params['search'], { emitEvent: false }); // Avoid double trigger

    if (params['status']) {
      const statuses = params['status'].split(',');
      this.statusFilter.set(new Set(statuses));
    }

    // Initialize (Start at page 1 or restored page)
    this.loadData();

    // Handle search changes
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.currentPageCategories.set(1);
        this.updateUrl(); // Sync URL
        this.loadData();
      });

    // Auto-generate slug from name
    this.categoryForm.get('name')?.valueChanges.subscribe((name) => {
      if (!this.isEditMode() && name) {
        this.categoryForm.patchValue(
          { slug: this.generateSlug(name) },
          { emitEvent: false }
        );
      }
    });

    this.topicForm.get('name')?.valueChanges.subscribe((name) => {
      // Logic for slug if needed
    });
  }

  generateSlug(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .replace(/đ/g, 'd')
      .normalize('NFD') // Split accented characters
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^\w-]+/g, '') // Remove all non-word chars
      .replace(/--+/g, '-') // Replace multiple - with single -
      .replace(/^-+/, '') // Trim - from start of text
      .replace(/-+$/, ''); // Trim - from end of text
  }

  updateUrl() {
    // 2. Update URL when state changes
    const queryParams: any = {
      mode: this.viewMode(),
      page: this.currentPageCategories(),
      size: this.pageSize(),
      sort: this.sortColumn(),
      dir: this.sortDirection(),
      search: this.searchControl.value || null, // Remove if empty
    };

    if (this.statusFilter().size > 0) {
      queryParams['status'] = Array.from(this.statusFilter()).join(',');
    } else {
      queryParams['status'] = null;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge', // Merge with existing params (though we overwrite keys)
      replaceUrl: true, // Optional: Avoid cluttering history stack for every keystroke
    });
  }

  // Filter Helpers
  removeStatusFilter(status: string) {
    const current = this.statusFilter();
    const newSet = new Set(current);
    newSet.delete(status);
    this.statusFilter.set(newSet);
    this.currentPageCategories.set(1);
    this.updateUrl();
    this.loadData();
  }

  clearStatusFilter() {
    this.statusFilter.set(new Set());
    this.currentPageCategories.set(1);
    this.updateUrl();
    this.loadData();
  }

  resetFilters() {
    this.searchControl.reset('', { emitEvent: false });
    this.statusFilter.set(new Set());
    this.currentPageCategories.set(1);
    this.updateUrl();
    this.loadData();
  }

  onStatusChange(selected: Set<string>) {
    this.statusFilter.set(selected);
    this.currentPageCategories.set(1);
    this.updateUrl();
    this.loadData();
  }

  toggleStatusDropdown() {
    this.activeFilterDropdown.update((current) =>
      current === 'status' ? null : 'status'
    );
  }

  setViewMode(mode: CategoryViewMode) {
    this.viewMode.set(mode);
    this.currentPageCategories.set(1);

    // If switching to trash, clear status filter as it's not relevant (items are deleted)
    // Or keep it if we want to filter deleted items by their original status?
    // Usually 'Trash' implies 'Deleted', so 'Active' property might not be the primary filter.
    // Let's clear status filter for simplicity or keep it if user wants to find 'Active but Deleted' items (rare).
    // I will keep it but it might return empty if backend logic enforces deleted=true AND status=ACTIVE.
    // Actually, backend might ignore status if deleted=true, or enforce both.
    // Let's reset filters when switching modes to avoid confusion.
    this.statusFilter.set(new Set());

    this.updateUrl(); // Sync URL

    // Clear topics cache when switching modes because the 'isDeleted' filter changes
    this.topics.set([]);
    this.loadedCategoryIds.clear();

    // Reset expanded state to force fresh load when user re-expands
    this.expandedCategoryIds.set(new Set());
    this.loadingTopicsState.set({});

    this.loadData();
  }

  loadData() {
    this.loadCategories();
    // Don't load topics initially - lazy load them
    if (this.viewMode() === 'trash') {
      this.loadTrashTopics();
    }
  }

  loadTrashTopics() {
    // Fetch all deleted topics with pagination
    const search = this.searchControl.value || '';
    this.topicService
      .getTopics(
        undefined,
        this.currentPageCategories(),
        this.pageSize(),
        search,
        true
      )
      .subscribe({
        next: (res) => {
          this.trashTopics.set(res.data);
          this.totalCategories.set(res.total); // Reuse totalCategories for pagination
        },
        error: (err) => {
          console.error(err);
          this.toastService.show('Failed to load deleted topics', 'error');
        },
      });
  }

  loadCategories() {
    const search = this.searchControl.value || '';
    const isDeleted = this.viewMode() === 'trash';
    this.categoryService
      .getCategories(
        this.currentPageCategories(),
        this.pageSize(),
        search,
        isDeleted,
        this.sortColumn(),
        this.sortDirection()
      )
      .subscribe({
        next: (response) => {
          this.categories.set(response.data);
          this.totalCategories.set(response.total);
        },
        error: (err: HttpErrorResponse) => {
          this.toastService.show('Failed to load categories', 'error');
          console.error(err);
        },
      });
  }

  loadTopicsForCategory(categoryId: string) {
    this.loadingTopicsState.update((s) => ({ ...s, [categoryId]: true }));
    const isDeleted = this.viewMode() === 'trash';

    // Simulate network delay for realistic lazy loading experience
    this.topicService
      .getTopics(categoryId, 1, 1000, '', isDeleted) // Load all topics for this category
      .subscribe({
        next: (response) => {
          // Merge new topics, avoiding duplicates
          this.topics.update((current) => {
            const filtered = current.filter((t) => t.categoryId !== categoryId);
            return [...filtered, ...response.data];
          });
          this.loadedCategoryIds.add(categoryId);
          this.loadingTopicsState.update((s) => ({
            ...s,
            [categoryId]: false,
          }));
        },
        error: (err: HttpErrorResponse) => {
          this.toastService.show('Failed to load topics', 'error');
          this.loadingTopicsState.update((s) => ({
            ...s,
            [categoryId]: false,
          }));
          console.error(err);
        },
      });
  }

  toggleExpand(categoryId: string) {
    this.expandedCategoryIds.update((set) => {
      const newSet = new Set(set);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
        // Trigger lazy load if not loaded or if in trash mode (since we might need to reload deleted topics)
        if (
          !this.loadedCategoryIds.has(categoryId) ||
          this.viewMode() === 'trash'
        ) {
          this.loadTopicsForCategory(categoryId);
        }
      }
      return newSet;
    });
  }

  getTopicsForCategory(categoryId: string): Topic[] {
    return this.topics().filter((t) => t.categoryId === categoryId);
  }

  onPageSizeChange(newSize: number) {
    this.pageSize.set(Number(newSize));
    this.currentPageCategories.set(1);
    this.updateUrl();
    this.loadCategories();
  }

  onCategoryPageChange(page: number) {
    this.currentPageCategories.set(page);
    this.updateUrl(); // Sync URL
    this.loadCategories();
  }

  toggleSort(column: 'name' | 'createdAt') {
    if (this.sortColumn() === column) {
      this.sortDirection.update((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('desc');
    }
    this.updateUrl(); // Sync URL
    this.loadCategories();
  }

  trackByCategory(index: number, item: Category): string {
    return item.id;
  }

  trackByTopic(index: number, item: Topic): string {
    return item.id;
  }

  getPageArray(
    total: number,
    size: number,
    current: number
  ): (number | string)[] {
    const totalPages = Math.ceil(total / size);
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Logic for ellipses: 1, 2, ..., 4, 5, 6, ..., 10
    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    } else if (current >= totalPages - 3) {
      return [
        1,
        '...',
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    } else {
      return [1, '...', current - 1, current, current + 1, '...', totalPages];
    }
  }

  // --- Actions ---

  toggleCategoryStatus(category: Category, event: Event) {
    event.stopPropagation();
    const newStatus = !category.isActive;
    const updatedCategory = { ...category, isActive: newStatus };
    this.categoryService
      .updateCategory(category.id, updatedCategory)
      .subscribe({
        next: (res) => {
          this.toastService.showResponse(res);
          // Update local state avoiding full reload
          this.categories.update((items) =>
            items.map((c) =>
              c.id === category.id ? { ...c, isActive: newStatus } : c
            )
          );
        },
        error: (err: HttpErrorResponse) => {
          // ToastService will handle 500 automatically if not caught?
          // But here we catch it.
          // Let's use showResponse if available or fallback
          this.toastService.show('Failed to update status', 'error');
          console.error(err);
        },
      });
  }

  toggleTopicStatus(topic: Topic, event: Event) {
    event.stopPropagation();
    const newStatus = !topic.isActive;
    const updatedTopic = { ...topic, isActive: newStatus };
    this.topicService.updateTopic(topic.id, updatedTopic).subscribe({
      next: (res) => {
        this.toastService.showResponse(res);
        this.topics.update((items) =>
          items.map((t) =>
            t.id === topic.id ? { ...t, isActive: newStatus } : t
          )
        );
      },
      error: (err: HttpErrorResponse) => {
        this.toastService.show('Failed to update status', 'error');
        console.error(err);
      },
    });
  }

  confirmRestore(type: CategoryItemType, id: string) {
    this.pendingItem = { type, id, action: 'restore' };
    this.deleteModalTitle.set(
      type === 'category' ? 'Restore Category?' : 'Restore Topic?'
    );
    this.deleteModalMessage.set(
      type === 'category'
        ? 'Restoring this category will make it and its contents visible again.'
        : 'Restoring this topic will make it visible again.'
    );
    this.isConfirmationModalOpen.set(true);
  }

  executeRestore() {
    if (!this.pendingItem || this.pendingItem.action !== 'restore') return;
    const { type, id } = this.pendingItem;

    if (type === 'category') {
      this.categoryService.restoreCategory(id).subscribe({
        next: (res) => {
          this.toastService.showResponse(res);
          this.loadCategories(); // Reload trash list
          this.closeModals();
        },
        error: (err) => {
          this.toastService.show('Failed to restore category', 'error');
          console.error(err);
        },
      });
    } else {
      this.topicService.restoreTopic(id).subscribe({
        next: (res) => {
          this.toastService.showResponse(res);
          // Refresh topics in the list... need to know categoryId
          const topic =
            this.topics().find((t) => t.id === id) ||
            this.trashTopics().find((t) => t.id === id);

          if (topic) {
            this.refreshCategoryTopics(topic.categoryId);
          }

          // If we are in trash mode, reload the trash list to remove the restored item
          if (this.viewMode() === 'trash') {
            this.loadTrashTopics();
          }
          this.closeModals();
        },
        error: (err: HttpErrorResponse) => {
          this.toastService.show('Failed to restore topic', 'error');
          console.error(err);
        },
      });
    }
  }

  // --- Category Methods ---

  openCreateCategory() {
    this.isEditMode.set(false);
    this.currentId = null;
    this.categoryForm.reset({
      icon: '',
      isActive: true,
      name: '',
      slug: '',
      description: '',
    });
    this.isCategoryModalOpen.set(true);
  }

  openEditCategory(category: Category) {
    this.isEditMode.set(true);
    this.currentId = category.id;
    this.categoryForm.reset({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      icon: category.icon,
      isActive: category.isActive !== undefined ? category.isActive : true,
    });
    this.isCategoryModalOpen.set(true);
  }

  onCategoryIconSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.categoryForm.patchValue({ icon: reader.result as string });
        this.categoryForm.get('icon')?.markAsDirty();
      };
      reader.readAsDataURL(file);
    }
  }

  submitCategory() {
    if (this.categoryForm.invalid) return;
    const formValue = this.categoryForm.value;

    const formData = new FormData();
    formData.append('name', formValue.name!);
    // Use proper empty string check or keep original logic
    if (formValue.description)
      formData.append('description', formValue.description);
    if (formValue.slug) formData.append('slug', formValue.slug);
    formData.append('isActive', String(formValue.isActive));

    // Append file if selected, otherwise if editing keep existing icon string/url logic?
    // Backend with FormData usually expects "file" or "icon". Assuming "file" or "icon".
    // Banners used "image". Categories likely use "icon".
    if (this.selectedFile) {
      formData.append('icon', this.selectedFile);
    } else if (formValue.icon) {
      // Sending string icon if no file changed (e.g. editing)
      formData.append('icon', formValue.icon);
    }

    if (this.isEditMode() && this.currentId) {
      this.categoryService
        .updateCategory(this.currentId, formData)
        .subscribe((res) => {
          this.toastService.showResponse(res);
          this.loadData();
          this.closeModals();
        });
    } else {
      this.categoryService.createCategory(formData).subscribe((res) => {
        this.toastService.showResponse(res);
        this.loadData();
        this.closeModals();
      });
    }
  }

  // --- Topic Methods ---

  openCreateTopic(categoryId?: string) {
    this.isEditMode.set(false);
    this.currentId = null;
    this.topicForm.reset({
      name: '',
      description: '',
      categoryId: categoryId || '',
      isActive: true,
    });
    this.isTopicModalOpen.set(true);
  }

  openEditTopic(topic: Topic) {
    this.isEditMode.set(true);
    this.currentId = topic.id;
    this.topicForm.reset({
      name: topic.name,
      description: topic.description || '',
      categoryId: topic.categoryId,
      isActive: topic.isActive!, // Expect strict boolean from backend
    });
    this.isTopicModalOpen.set(true);
  }

  submitTopic() {
    if (this.topicForm.invalid) return;
    const formValue = this.topicForm.getRawValue(); // Returns non-nullable values

    if (this.isEditMode() && this.currentId) {
      this.topicService
        .updateTopic(this.currentId, formValue as any)
        .subscribe({
          next: (res) => {
            this.toastService.showResponse(res);
            this.refreshCategoryTopics(formValue.categoryId);
            this.loadData();
            this.closeModals();
          },
          error: (err) => {
            console.error('Update Topic Error:', err);
            this.toastService.show(
              err.error?.message || 'Failed to update topic',
              'error'
            );
          },
        });
    } else {
      this.topicService.createTopic(formValue as any).subscribe({
        next: (res) => {
          this.toastService.showResponse(res);
          this.refreshCategoryTopics(formValue.categoryId);
          this.loadData();
          this.closeModals();
        },
        error: (err) => {
          console.error('Create Topic Error:', err);
          this.toastService.show(
            err.error?.message || 'Failed to create topic',
            'error'
          );
        },
      });
    }
  }

  refreshCategoryTopics(categoryId: string) {
    if (categoryId && this.loadedCategoryIds.has(categoryId)) {
      this.loadedCategoryIds.delete(categoryId);
      if (this.expandedCategoryIds().has(categoryId)) {
        this.loadTopicsForCategory(categoryId);
      }
    }
  }

  // --- Delete Methods ---

  confirmDeleteCategory(id: string) {
    if (this.viewMode() === 'trash') {
      this.isPermanentDelete.set(true);
      this.pendingItem = { type: 'category', id, action: 'delete' };
      this.deleteModalTitle.set('Permanently Delete Category?');
      this.deleteModalMessage.set(
        'This will <b>permanently delete</b> this category and all its contents.<br/><span class="text-rose-600 font-bold">This action CANNOT be undone.</span>'
      );
      this.isConfirmationModalOpen.set(true);
      return;
    }
    this.isPermanentDelete.set(false);
    this.pendingItem = { type: 'category', id, action: 'delete' };
    this.deleteModalTitle.set('Delete Category?');
    this.deleteModalMessage.set(
      'Deleting this Category will also hide all its Topics and Resources.<br/><span class="text-blue-600 font-bold">You can restore them later.</span>'
    );
    this.isConfirmationModalOpen.set(true);
  }

  confirmDeleteTopic(topic: Topic) {
    if (this.viewMode() === 'trash') {
      this.isPermanentDelete.set(true);
      this.pendingItem = { type: 'topic', id: topic.id, action: 'delete' };
      this.deleteModalTitle.set('Permanently Delete Topic?');
      this.deleteModalMessage.set(
        'This will <b>permanently delete</b> this topic.<br/><span class="text-rose-600 font-bold">This action CANNOT be undone.</span>'
      );
      this.isConfirmationModalOpen.set(true);
      return;
    }
    this.isPermanentDelete.set(false);
    this.pendingItem = { type: 'topic', id: topic.id, action: 'delete' };
    this.deleteModalTitle.set('Delete Topic?');
    this.deleteModalMessage.set(
      'Are you sure you want to delete this topic?<br/><span class="text-blue-600 font-bold">You can restore it later.</span>'
    );
    this.isConfirmationModalOpen.set(true);
  }

  // --- Bulk Actions ---
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

  toggleAll(event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      // Select all visible
      const allIds = this.categories().map((c) => c.id);
      this.selectedIds.set(new Set(allIds));
    } else {
      this.selectedIds.set(new Set());
    }
  }

  clearSelection() {
    this.selectedIds.set(new Set());
  }

  confirmBulkDelete() {
    const count = this.selectedIds().size;
    if (count === 0) return;

    this.pendingItem = { type: 'category', action: 'bulk-delete', id: 'bulk' }; // 'bulk' is placeholder
    this.deleteModalTitle.set('Delete Multiple Categories');
    this.deleteModalMessage.set(
      `Are you sure you want to delete <strong>${count}</strong> selected categories? This cannot be undone if hard delete is enabled.`
    );
    this.isConfirmationModalOpen.set(true);
  }

  confirmBulkRestore() {
    const count = this.selectedIds().size;
    if (count === 0) return;

    this.pendingItem = { type: 'category', action: 'bulk-restore', id: 'bulk' };
    this.deleteModalTitle.set('Restore Multiple Categories');
    this.deleteModalMessage.set(
      `Are you sure you want to restore <strong>${count}</strong> selected categories?`
    );
    this.isConfirmationModalOpen.set(true);
  }

  // --- Confirmation & Modal Actions ---

  onConfirmModalAction() {
    if (!this.pendingItem) return;
    const { action, id } = this.pendingItem;

    // Handle Bulk Delete
    if (action === 'bulk-delete') {
      const ids = Array.from(this.selectedIds());
      const isTrashMode = this.viewMode() === 'trash';
      // If in trash mode -> Hard delete. If in list mode -> Soft delete (default)
      const hardDelete = isTrashMode;

      this.categoryService.deleteCategories(ids, hardDelete).subscribe({
        next: (res) => {
          this.toastService.show(res.message, 'success');
          this.clearSelection();
          this.loadData();
          this.closeModals();
        },
        error: (err) => {
          this.toastService.show(
            err.message || 'Failed to delete selected items',
            'error'
          );
        },
      });
      return;
    }

    // Handle Bulk Restore
    if (action === 'bulk-restore') {
      const ids = Array.from(this.selectedIds());
      this.categoryService.restoreCategories(ids).subscribe({
        next: (res) => {
          this.toastService.show(res.message, 'success');
          this.clearSelection();
          this.loadData();
          this.closeModals();
        },
        error: (err) => {
          this.toastService.show(
            err.message || 'Failed to restore selected items',
            'error'
          );
        },
      });
      return;
    }

    if (action === 'delete') {
      // Single Delete Logic (Existing)
      this.executeDelete();
    } else {
      this.executeRestore();
    }
  }

  executeDelete() {
    if (!this.pendingItem || this.pendingItem.action !== 'delete') return;
    const isPermanent = this.isPermanentDelete();

    if (this.pendingItem.type === 'category') {
      this.categoryService
        .deleteCategory(this.pendingItem.id, isPermanent)
        .subscribe((res) => {
          this.toastService.showResponse(res);
          this.loadData();
          this.closeModals();
        });
    } else {
      // For topic deletion, we need to know the categoryId to refresh
      const topic = this.topics().find((t) => t.id === this.pendingItem?.id);
      const catId = topic?.categoryId;

      this.topicService
        .deleteTopic(this.pendingItem.id, isPermanent)
        .subscribe((res) => {
          this.toastService.showResponse(res);
          if (catId) this.refreshCategoryTopics(catId);
          // If in trash mode (global list), refresh that too
          if (this.viewMode() === 'trash') this.loadTrashTopics();

          this.loadData();
          this.closeModals();
        });
    }
  }

  // --- Helpers ---

  closeModals() {
    this.isCategoryModalOpen.set(false);
    this.isTopicModalOpen.set(false);
    this.isConfirmationModalOpen.set(false);
    this.pendingItem = null;
  }

  getCategoryName(id: string): string {
    return this.categories().find((c) => c.id === id)?.name || 'Unknown';
  }

  getSelectedCategory(): Category | undefined {
    return this.categories().find((c) => c.id === this.currentId);
  }

  getIconUrl(icon: string | undefined): string {
    if (!icon) return '';
    if (
      icon.startsWith('data:') ||
      icon.startsWith('http') ||
      icon.startsWith('/')
    ) {
      return icon;
    }
    // Assumption: Backend serves files at /api/v1/files/{filename}
    // Only apply this transformation if it looks like a filename (not emoji)
    // Simple heuristic: length > 4 (e.g. x.png)
    if (icon.length > 4) {
      return `/api/v1/files/${icon}`;
    }
    return icon;
  }

  getSelectedTopic(): Topic | undefined {
    return this.topics().find((t) => t.id === this.currentId);
  }
}
