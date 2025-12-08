import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../pipes/translate.pipe';
import {
  Resource,
  ResourceService,
  CategoryService,
} from '@kindergarten-warehouse/data-access';
import { combineLatest, BehaviorSubject, map, switchMap } from 'rxjs';


import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-resource-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
  ],
  templateUrl: './resource-list.component.html',
  styles: [],
})
export class ResourceListComponent {
  private resourceService = inject(ResourceService);
  private categoryService = inject(CategoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  categories$ = this.categoryService.getCategories();

  selectedCategory$ = new BehaviorSubject<string>('');
  searchQuery$ = this.route.queryParams.pipe(
    map((params) => params['search'] || '')
  );

  // Resources based on filters
  // Pagination State
  currentPage$ = new BehaviorSubject<number>(1);
  itemsPerPage = 8;
  totalItems = 0;

  sortOption$ = new BehaviorSubject<string>('newest'); // Default sort

  // Filtered Resources (before pagination)
  private filteredResources$ = combineLatest([
    this.selectedCategory$,
    this.searchQuery$,
    this.sortOption$,
  ]).pipe(
    switchMap(([categoryId, search, sort]) => {
      // Reset to page 1 when filters change
      this.currentPage$.next(1);
      return this.resourceService.getResources({ categoryId, search }).pipe(
        map(resources => {
          // 1. Filter by Category
          let filtered = resources;
          if (categoryId) {
             // Note: The mock data uses 'topicId' but the interface has 'topicId'. 
             // The categories component uses 'id' which maps to 'topicId' in resources?
             // Let's assume categoryId maps to topicId for now based on previous context or just check both.
             // Actually, looking at mock data, it has 'topicId'. 
             // Let's assume for now we just filter if it matches.
             filtered = filtered.filter(r => r.topicId === categoryId);
          }

          // 2. Filter by Search
          if (search) {
            const lowerSearch = search.toLowerCase();
            filtered = filtered.filter(r => 
              r.title.toLowerCase().includes(lowerSearch) || 
              r.description?.toLowerCase().includes(lowerSearch)
            );
          }

          // 3. Sort
          return filtered.sort((a, b) => {
            switch (sort) {
              case 'name-asc':
                return a.title.localeCompare(b.title);
              case 'name-desc':
                return b.title.localeCompare(a.title);
              case 'rating-desc':
                return (b.rating || 0) - (a.rating || 0);
              case 'rating-asc':
                return (a.rating || 0) - (b.rating || 0);
              default: // 'newest' or others
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
          });
        })
      );
    })
  );

  // Paginated Resources
  resources$ = combineLatest([this.filteredResources$, this.currentPage$]).pipe(
    map(([resources, page]) => {
      this.totalItems = resources.length;
      const startIndex = (page - 1) * this.itemsPerPage;
      return resources.slice(startIndex, startIndex + this.itemsPerPage);
    })
  );

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  nextPage() {
    if (this.currentPage$.value < this.totalPages) {
      this.currentPage$.next(this.currentPage$.value + 1);
      this.scrollToTop();
    }
  }

  prevPage() {
    if (this.currentPage$.value > 1) {
      this.currentPage$.next(this.currentPage$.value - 1);
      this.scrollToTop();
    }
  }

  goToPage(page: number) {
    this.currentPage$.next(page);
    this.scrollToTop();
  }

  private scrollToTop() {
    const element = document.getElementById('resources');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  onCategoryChange(catId: string) {
    this.selectedCategory$.next(catId);
  }

  onSortChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.sortOption$.next(value);
  }

  openPreview(resource: Resource) {
    this.resourceService.incrementViewCount(resource.id).subscribe();
    this.router.navigate(['/resources', resource.id]);
  }

  downloadResource(event: Event, resource: Resource) {
    event.stopPropagation(); // Prevent opening modal
    if (resource.url) {
      window.open(resource.url, '_blank');
    }
  }
}
