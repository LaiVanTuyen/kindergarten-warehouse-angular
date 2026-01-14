import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginationComponent } from '../shared/components/pagination/pagination.component';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  CategoryService,
  Category,
  Topic,
} from '@kindergarten-warehouse/data-access';
import { BreadcrumbComponent } from '../shared/components/breadcrumb/breadcrumb.component';
import { EmptyStateComponent } from '../shared/components/empty-state/empty-state.component';
import { ToastService } from '@kindergarten-warehouse/data-access';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PaginationComponent,
    BreadcrumbComponent,
    EmptyStateComponent,
  ],
  templateUrl: './categories.component.html',
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
  toastService = inject(ToastService);

  // Data Signals (Manual refresh pattern since service is mock-mutable)
  categories = signal<Category[]>([]);
  topics = signal<Topic[]>([]);
  loadingTopicsState = signal<Record<string, boolean>>({});
  loadedCategoryIds = new Set<string>();

  protected Math = Math;

  // Tree View State
  expandedCategoryIds = signal<Set<string>>(new Set());

  // Pagination State
  pageSize = signal(10);
  currentPageCategories = signal(1);
  totalCategories = signal(0);

  // Forms
  categoryForm: FormGroup;
  topicForm: FormGroup;
  searchControl = new FormControl('');

  // State
  isCategoryModalOpen = signal(false);
  isTopicModalOpen = signal(false);
  isDeleteModalOpen = signal(false);

  // Edit State
  isEditMode = signal(false);
  currentId: string | null = null;
  itemToDelete: { type: 'category' | 'topic'; id: string } | null = null;

  constructor() {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      slug: [''], // Auto-generated if empty
      description: [''],
      icon: ['', Validators.required],
    });

    this.topicForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      categoryId: ['', Validators.required],
    });

    // Initialize (Start at page 1)
    this.loadData();

    // Handle search changes
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.currentPageCategories.set(1);
        this.loadData();
      });
  }

  loadData() {
    this.loadCategories();
    // Don't load topics initially - lazy load them
  }

  loadCategories() {
    const search = this.searchControl.value || '';
    this.categoryService
      .getCategories(this.currentPageCategories(), this.pageSize(), search)
      .subscribe({
        next: (response) => {
          this.categories.set(response.data);
          this.totalCategories.set(response.total);
        },
        error: (err: any) => {
          this.toastService.show('Failed to load categories', 'error');
          console.error(err);
        },
      });
  }

  loadTopicsForCategory(categoryId: string) {
    this.loadingTopicsState.update((s) => ({ ...s, [categoryId]: true }));
    
    // Simulate network delay for realistic lazy loading experience
    setTimeout(() => {
        this.categoryService
        .getTopics(categoryId, 1, 1000, '') // Load all topics for this category
        .subscribe({
            next: (response) => {
            // Merge new topics, avoiding duplicates
            this.topics.update((current) => {
                const filtered = current.filter((t) => t.categoryId !== categoryId);
                return [...filtered, ...response.data];
            });
            this.loadedCategoryIds.add(categoryId);
            this.loadingTopicsState.update((s) => ({ ...s, [categoryId]: false }));
            },
            error: (err: any) => {
            this.toastService.show('Failed to load topics', 'error');
            this.loadingTopicsState.update((s) => ({ ...s, [categoryId]: false }));
            console.error(err);
            },
        });
    }, 500); 
  }

  toggleExpand(categoryId: string) {
    this.expandedCategoryIds.update((set) => {
      const newSet = new Set(set);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
        // Trigger lazy load if not loaded
        if (!this.loadedCategoryIds.has(categoryId)) {
          this.loadTopicsForCategory(categoryId);
        }
      }
      return newSet;
    });
  }

  getTopicsForCategory(categoryId: string): Topic[] {
    return this.topics().filter((t) => t.categoryId === categoryId);
  }

  onCategoryPageChange(page: number) {
    this.currentPageCategories.set(page);
    this.loadCategories();
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

  // --- Category Methods ---

  openCreateCategory() {
    this.isEditMode.set(false);
    this.currentId = null;
    this.categoryForm.reset({ icon: '' });
    this.isCategoryModalOpen.set(true);
  }

  openEditCategory(category: Category) {
    this.isEditMode.set(true);
    this.currentId = category.id;
    this.categoryForm.patchValue({
      name: category.name,
      slug: category.slug,
      description: category.description,
      icon: category.icon,
    });
    this.isCategoryModalOpen.set(true);
  }

  onCategoryIconSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
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

    if (this.isEditMode() && this.currentId) {
      this.categoryService
        .updateCategory(this.currentId, formValue)
        .subscribe(() => {
          this.loadData();
          this.closeModals();
        });
    } else {
      this.categoryService.createCategory(formValue).subscribe(() => {
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
      categoryId: categoryId || '' 
    });
    this.isTopicModalOpen.set(true);
  }

  openEditTopic(topic: Topic) {
    this.isEditMode.set(true);
    this.currentId = topic.id;
    this.topicForm.patchValue({
      name: topic.name,
      description: topic.description,
      categoryId: topic.categoryId,
    });
    this.isTopicModalOpen.set(true);
  }

  submitTopic() {
    if (this.topicForm.invalid) return;
    const formValue = this.topicForm.value;

    if (this.isEditMode() && this.currentId) {
      this.categoryService
        .updateTopic(this.currentId, formValue)
        .subscribe(() => {
          this.refreshCategoryTopics(formValue.categoryId);
          this.loadData();
          this.closeModals();
        });
    } else {
      this.categoryService.createTopic(formValue).subscribe(() => {
        this.refreshCategoryTopics(formValue.categoryId);
        this.loadData();
        this.closeModals();
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
    this.itemToDelete = { type: 'category', id };
    this.isDeleteModalOpen.set(true);
  }

  confirmDeleteTopic(topic: Topic) {
    this.itemToDelete = { type: 'topic', id: topic.id };
    this.isDeleteModalOpen.set(true);
  }

  executeDelete() {
    if (!this.itemToDelete) return;

    if (this.itemToDelete.type === 'category') {
      this.categoryService
        .deleteCategory(this.itemToDelete.id)
        .subscribe(() => {
          this.loadData();
          this.closeModals();
        });
    } else {
      // For topic deletion, we need to know the categoryId to refresh
      // Since itemToDelete only has ID, we need to find the topic first to get its categoryId
      // But mock service deleteTopic doesn't return the deleted item
      // We'll try to find it in our current list before deleting, or just reload all expanded?
      // Better: find it in local state
      const topic = this.topics().find(t => t.id === this.itemToDelete?.id);
      const catId = topic?.categoryId;

      this.categoryService.deleteTopic(this.itemToDelete.id).subscribe(() => {
        if (catId) this.refreshCategoryTopics(catId);
        this.loadData();
        this.closeModals();
      });
    }
  }

  // --- Helpers ---

  closeModals() {
    this.isCategoryModalOpen.set(false);
    this.isTopicModalOpen.set(false);
    this.isDeleteModalOpen.set(false);
    this.itemToDelete = null;
  }

  getCategoryName(id: string): string {
    return this.categories().find((c) => c.id === id)?.name || 'Unknown';
  }

  getSelectedCategory(): Category | undefined {
    return this.categories().find((c) => c.id === this.currentId);
  }

  getSelectedTopic(): Topic | undefined {
    return this.topics().find((t) => t.id === this.currentId);
  }
}
