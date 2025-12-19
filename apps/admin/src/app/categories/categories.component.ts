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

  // Data Signals (Manual refresh pattern since service is mock-mutable)
  categories = signal<Category[]>([]);
  topics = signal<Topic[]>([]);

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
      icon: ['', Validators.required],
    });

    this.topicForm = this.fb.group({
      title: ['', Validators.required],
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
    this.loadTopics();
  }

  loadCategories() {
    const search = this.searchControl.value || '';
    this.categoryService
      .getCategories(this.currentPageCategories(), this.pageSize(), search)
      .subscribe((response) => {
        this.categories.set(response.data);
        this.totalCategories.set(response.total);
      });
  }

  loadTopics() {
    // Load ALL topics (or a large page) to populate the tree view
    // In a real app, we would fetch topics per category on expand, or use a specific endpoint
    // For this mock, we'll fetch a large page of topics
    this.categoryService
      .getTopics(undefined, 1, 1000, '')
      .subscribe((response) => {
        this.topics.set(response.data);
      });
  }

  toggleExpand(categoryId: string) {
    this.expandedCategoryIds.update((set) => {
      const newSet = new Set(set);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
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

  openCreateTopic() {
    this.isEditMode.set(false);
    this.currentId = null;
    this.topicForm.reset();

    // If viewing topics tab, maybe default? For now clean reset.
    if (this.categories().length > 0) {
      // Auto-select first category for convenience
      this.topicForm.patchValue({ categoryId: this.categories()[0].id });
    }

    this.isTopicModalOpen.set(true);
  }

  openEditTopic(topic: Topic) {
    this.isEditMode.set(true);
    this.currentId = topic.id;
    this.topicForm.patchValue({
      title: topic.title,
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
          this.loadData();
          this.closeModals();
        });
    } else {
      this.categoryService.createTopic(formValue).subscribe(() => {
        this.loadData();
        this.closeModals();
      });
    }
  }

  // --- Delete Methods ---

  confirmDeleteCategory(id: string) {
    this.itemToDelete = { type: 'category', id };
    this.isDeleteModalOpen.set(true);
  }

  confirmDeleteTopic(id: string) {
    this.itemToDelete = { type: 'topic', id };
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
      this.categoryService.deleteTopic(this.itemToDelete.id).subscribe(() => {
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
}
