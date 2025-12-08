import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryService } from '@kindergarten-warehouse/data-access';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './categories.component.html',
  styles: [],
})
export class CategoriesComponent {
  categoryService = inject(CategoryService);
  categories$ = this.categoryService.getCategories();
  topics$ = this.categoryService.getTopics();

  activeTab: 'categories' | 'topics' = 'categories';
}
