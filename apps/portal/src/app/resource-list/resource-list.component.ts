import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Resource,
  ResourceService,
  CategoryService,
} from '@kindergarten-warehouse/data-access';
import { combineLatest, BehaviorSubject, map, switchMap } from 'rxjs';
import { ResourceDetailModalComponent } from '../resource-detail-modal/resource-detail-modal.component';
import { BannerSliderComponent } from '../banner-slider/banner-slider.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-resource-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ResourceDetailModalComponent,
    BannerSliderComponent,
  ],
  template: `
    <div class="container mx-auto px-4 py-8 font-sans">
      <!-- Banner Slider -->
      <app-banner-slider></app-banner-slider>

      <!-- Section Title -->
      <div class="text-center mb-8">
        <h2 class="text-2xl font-bold text-gray-800">Explore Resources</h2>
      </div>

      <!-- Category Pills (Horizontal Scroll) -->
      <div class="flex flex-wrap justify-center gap-4 mb-10">
        <!-- 'All' Pill -->
        <button
          (click)="onCategoryChange('')"
          class="px-6 py-2 rounded-full font-medium transition-all shadow-sm border"
          [ngClass]="
            (selectedCategory$ | async) === ''
              ? 'bg-gradient-to-r from-primary-pink to-primary-blue text-white border-transparent shadow-md'
              : 'bg-white text-gray-600 border-gray-200 hover:border-primary-pink hover:text-primary-pink'
          "
        >
          All Categories
        </button>

        <!-- Categories -->
        <button
          *ngFor="let cat of categories$ | async"
          (click)="onCategoryChange(cat.id)"
          class="px-6 py-2 rounded-full font-medium transition-all shadow-sm border flex items-center gap-2"
          [ngClass]="
            (selectedCategory$ | async) === cat.id
              ? 'bg-gradient-to-r from-primary-pink to-primary-blue text-white border-transparent shadow-md'
              : 'bg-white text-gray-600 border-gray-200 hover:border-primary-pink hover:text-primary-pink'
          "
        >
          <span>{{ cat.icon }}</span>
          <span>{{ cat.name }}</span>
        </button>
      </div>

      <!-- Resource Grid -->
      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
      >
        <div
          *ngFor="let resource of resources$ | async"
          class="group bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
        >
          <!-- Thumbnail (Click to Preview) -->
          <div
            class="aspect-w-16 aspect-h-10 bg-gray-100 relative cursor-pointer overflow-hidden"
            (click)="openPreview(resource)"
            (keydown.enter)="openPreview(resource)"
            tabindex="0"
          >
            <img
              *ngIf="resource.thumbnailUrl"
              [src]="resource.thumbnailUrl"
              class="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
              alt="thumbnail"
            />
            <div
              *ngIf="!resource.thumbnailUrl"
              class="w-full h-48 flex items-center justify-center text-4xl bg-gray-50"
            >
              <span *ngIf="resource.type === 'PDF'">📄</span>
              <span *ngIf="resource.type === 'VIDEO'">🎬</span>
              <span *ngIf="resource.type === 'EXCEL'">📊</span>
              <span *ngIf="resource.type === 'WORD'">📝</span>
            </div>

            <!-- Status Dot (Design Match) -->
            <div class="absolute top-3 right-3">
              <div class="w-3 h-3 rounded-full bg-white shadow-md"></div>
            </div>
          </div>

          <!-- Content -->
          <div class="p-5 flex-1 flex flex-col">
            <h3
              class="font-bold text-gray-800 text-lg mb-1 line-clamp-1 cursor-pointer hover:text-primary-blue transition-colors"
              (click)="openPreview(resource)"
              (keydown.enter)="openPreview(resource)"
              tabindex="0"
            >
              {{ resource.title }}
            </h3>
            <p class="text-sm text-gray-500 mb-4 line-clamp-2 flex-1">
              {{
                resource.description ||
                  'No description available for this resource.'
              }}
            </p>

            <!-- Footer: Views & Download -->
            <div
              class="flex justify-between items-center mt-auto pt-4 border-t border-gray-50"
            >
              <div class="flex items-center text-gray-400 text-xs font-medium">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                {{ resource.viewsCount }} views
              </div>

              <button
                (click)="downloadResource($event, resource)"
                class="px-4 py-1.5 rounded-full bg-gradient-to-r from-primary-pink to-primary-blue text-white text-xs font-bold shadow-sm hover:shadow-md hover:opacity-90 transition-all"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        *ngIf="(resources$ | async)?.length === 0"
        class="text-center py-20 text-gray-400"
      >
        <div class="text-6xl mb-4">🔍</div>
        <p class="text-lg">No resources found matching your selection.</p>
      </div>
    </div>

    <!-- Modal -->
    <app-resource-detail-modal
      [isOpen]="isModalOpen"
      [resource]="selectedResource"
      (closeModal)="closeModal()"
    >
    </app-resource-detail-modal>
  `,
  styles: [],
})
export class ResourceListComponent {
  private resourceService = inject(ResourceService);
  private categoryService = inject(CategoryService);
  private route = inject(ActivatedRoute);

  categories$ = this.categoryService.getCategories();

  selectedCategory$ = new BehaviorSubject<string>('');
  searchQuery$ = this.route.queryParams.pipe(
    map((params) => params['search'] || '')
  );

  // Resources based on filters
  resources$ = combineLatest([this.selectedCategory$, this.searchQuery$]).pipe(
    switchMap(([categoryId, search]) =>
      this.resourceService.getResources({ categoryId, search })
    )
  );

  isModalOpen = false;
  selectedResource: Resource | null = null;

  onCategoryChange(catId: string) {
    this.selectedCategory$.next(catId);
  }

  openPreview(resource: Resource) {
    this.selectedResource = resource;
    this.isModalOpen = true;
    this.resourceService.incrementViewCount(resource.id).subscribe();
  }

  downloadResource(event: Event, resource: Resource) {
    event.stopPropagation(); // Prevent opening modal
    if (resource.url) {
      window.open(resource.url, '_blank');
    }
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedResource = null;
  }
}
