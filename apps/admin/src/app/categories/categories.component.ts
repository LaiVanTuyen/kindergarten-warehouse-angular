import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryService } from '@kindergarten-warehouse/data-access';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <!-- Tabs -->
      <div class="flex space-x-4 border-b border-gray-200">
        <button
          (click)="activeTab = 'categories'"
          class="px-6 py-3 font-medium text-sm focus:outline-none border-b-2 transition-colors"
          [ngClass]="
            activeTab === 'categories'
              ? 'border-primary-pink text-primary-pink'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          "
        >
          Categories
        </button>
        <button
          (click)="activeTab = 'topics'"
          class="px-6 py-3 font-medium text-sm focus:outline-none border-b-2 transition-colors"
          [ngClass]="
            activeTab === 'topics'
              ? 'border-primary-pink text-primary-pink'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          "
        >
          Topics
        </button>
      </div>

      <!-- Categories Content -->
      <div
        *ngIf="activeTab === 'categories'"
        class="bg-white rounded-lg shadow-sm border border-gray-200"
      >
        <div
          class="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50"
        >
          <h3 class="text-lg font-semibold text-gray-800">Categories List</h3>
          <button
            class="bg-admin-navy text-white px-4 py-2 rounded-md hover:bg-opacity-90 transition-colors text-sm"
          >
            + New Category
          </button>
        </div>
        <table class="w-full text-left">
          <thead class="bg-gray-50 text-gray-600 text-sm uppercase">
            <tr>
              <th class="px-6 py-3">ID</th>
              <th class="px-6 py-3">Name</th>
              <th class="px-6 py-3">Slug</th>
              <th class="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="text-gray-700 text-sm">
            <tr
              *ngFor="let cat of categories$ | async"
              class="border-b border-gray-100 last:border-0 hover:bg-gray-50"
            >
              <td class="px-6 py-4">{{ cat.id }}</td>
              <td class="px-6 py-4 font-medium">{{ cat.name }}</td>
              <td class="px-6 py-4 text-gray-500">{{ cat.slug }}</td>
              <td class="px-6 py-4 text-right space-x-2">
                <button class="text-blue-600 hover:underline">Edit</button>
                <button class="text-red-600 hover:underline">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Topics Content -->
      <div
        *ngIf="activeTab === 'topics'"
        class="bg-white rounded-lg shadow-sm border border-gray-200"
      >
        <div
          class="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50"
        >
          <h3 class="text-lg font-semibold text-gray-800">Topics List</h3>
          <button
            class="bg-admin-navy text-white px-4 py-2 rounded-md hover:bg-opacity-90 transition-colors text-sm"
          >
            + New Topic
          </button>
        </div>
        <table class="w-full text-left">
          <thead class="bg-gray-50 text-gray-600 text-sm uppercase">
            <tr>
              <th class="px-6 py-3">ID</th>
              <th class="px-6 py-3">Title</th>
              <th class="px-6 py-3">Category</th>
              <th class="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="text-gray-700 text-sm">
            <tr
              *ngFor="let topic of topics$ | async"
              class="border-b border-gray-100 last:border-0 hover:bg-gray-50"
            >
              <td class="px-6 py-4">{{ topic.id }}</td>
              <td class="px-6 py-4 font-medium">{{ topic.title }}</td>
              <td class="px-6 py-4">
                <span
                  class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                  >{{ topic.categoryId }}</span
                >
              </td>
              <td class="px-6 py-4 text-right space-x-2">
                <button class="text-blue-600 hover:underline">Edit</button>
                <button class="text-red-600 hover:underline">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [],
})
export class CategoriesComponent {
  categoryService = inject(CategoryService);
  categories$ = this.categoryService.getCategories();
  topics$ = this.categoryService.getTopics();

  activeTab: 'categories' | 'topics' = 'categories';
}
