import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../pipes/translate.pipe';
import {
  Resource,
  ResourceService,
  CategoryService,
  Topic,
} from '@kindergarten-warehouse/data-access';
import {
  combineLatest,
  BehaviorSubject,
  map,
  switchMap,
  tap,
  finalize,
  catchError,
  of,
  startWith,
  debounceTime,
  Subject,
  takeUntil,
} from 'rxjs';

import { ActivatedRoute, Router } from '@angular/router';

import { ResourceCardComponent } from '../resource-card/resource-card.component';

import { LoadingSkeletonComponent } from '../shared/loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'app-resource-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    ResourceCardComponent,

    LoadingSkeletonComponent,
  ],
  templateUrl: './resource-list.component.html',
  styles: [],
})
export class ResourceListComponent implements OnInit, OnDestroy {
  private resourceService = inject(ResourceService);
  private categoryService = inject(CategoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef); // Add CDR

  private destroy$ = new Subject<void>();

  categories$ = this.categoryService.getCategories();

  // Sidebar & Filter State (Sources)
  expandedCategory$ = new BehaviorSubject<string>('');
  selectedCategory$ = new BehaviorSubject<string>('');
  selectedTopicId$ = new BehaviorSubject<string | null>(null); // Single Select
  currentTopics$ = new BehaviorSubject<Topic[]>([]);
  topicsCache: { [key: string]: Topic[] } = {};

  searchQuery$ = this.route.queryParams.pipe(
    map((params) => params['search'] || '')
  );
  sortOption$ = new BehaviorSubject<string>('newest');

  isLoading$ = new BehaviorSubject<boolean>(true);

  // Pagination State
  currentPage$ = new BehaviorSubject<number>(1);
  itemsPerPage = 8;
  totalItems$ = new BehaviorSubject<number>(0);

  totalPages$ = this.totalItems$.pipe(
    map((total) => Math.ceil(total / this.itemsPerPage))
  );

  pages$ = this.totalPages$.pipe(
    map((total) => Array.from({ length: total }, (_, i) => i + 1))
  );

  // Derived State (Depends on State above)
  activeTitle$ = combineLatest([
    this.categories$,
    this.selectedCategory$,
    this.selectedTopicId$,
    this.expandedCategory$,
  ]).pipe(
    map(([categories, selectedCatId, selectedTopicId]) => {
      // 1. If Topic is Selected, show Topic Title
      if (selectedTopicId) {
        for (const catId in this.topicsCache) {
          const topic = this.topicsCache[catId].find(
            (t) => t.id === selectedTopicId
          );
          if (topic) return topic.title;
        }
      }

      // 2. If Category is Selected (and no topic), show Category Name
      if (selectedCatId) {
        const cat = categories.data.find((c) => c.id === selectedCatId);
        if (cat) return cat.name;
      }

      return null;
    })
  );

  pageTitle$ = this.activeTitle$.pipe(
    map((name) => (name ? `${name}` : 'Tài liệu khám phá'))
  );

  breadcrumb$ = this.activeTitle$.pipe(
    map((name) =>
      name ? ['Trang chủ', 'Tài liệu', name] : ['Trang chủ', 'Tài liệu']
    )
  );

  constructor() {}

  ngOnInit() {
    // Handle initial query params (e.g. from Home page)
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const catId = params['category'];
        if (catId && catId !== this.selectedCategory$.value) {
          this.toggleCategory(catId, true); // Pass true to force open/select without toggling off
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Filtered Resources (before pagination)
  // Filtered Resources with Pagination
  // We trigger resource loading whenever filters OR page changes
  // We use combineLatest for filters, and merge page changes?
  // Actually, let's keep it simple: any filter change resets page to 1. Page change just triggers reload.
  ageGroups$ = this.resourceService.getAgeGroups();
  selectedAgeGroupIds$ = new BehaviorSubject<string[]>([]);

  // Combined Filters Stream
  private filters$ = combineLatest([
    this.selectedCategory$,
    this.selectedTopicId$,
    this.selectedAgeGroupIds$,
    this.searchQuery$.pipe(startWith('')),
    this.sortOption$,
    this.currentPage$,
  ]).pipe(
    map(([category, topicId, ageGroupIds, search, sort, page]) => ({
      category,
      topicId,
      ageGroupIds,
      search,
      sort,
      page,
    }))
  );

  resources$ = this.filters$.pipe(
    debounceTime(100), // Prevent rapid double-firing
    tap(() => this.isLoading$.next(true)),
    switchMap(({ category, topicId, ageGroupIds, search, sort, page }) => {
      console.log('Filter changed:', {
        category,
        topicId,
        ageGroupIds,
        search,
        sort,
        page,
      });

      let targetTopicIds: string[] | undefined = undefined;

      if (topicId) {
        targetTopicIds = [topicId];
      } else if (category) {
        // Fallback to Category Topics if no specific topics selected
        const cachedTopics = this.topicsCache[category];
        if (cachedTopics) {
          targetTopicIds = cachedTopics.map((t) => t.id);
        }
      }

      return this.resourceService
        .getResources(page, 9, {
          topicIds: targetTopicIds,
          // Note: Service uses 'topicIds' for filtering.
          // If we have a single topicId, we pass it as [topicId].
          // If we have a category, we pass all topics in that category.

          ageGroupIds: ageGroupIds.length > 0 ? ageGroupIds : undefined,
          search,
          status: 'approved',
        })
        .pipe(
          map((res) => {
            console.log('API Response:', res);
            this.totalItems$.next(res.total);
            return res.data;
          }),
          catchError(() => {
            return of([]);
          }),
          finalize(() => this.isLoading$.next(false))
        );
    })
  );

  // Removed client-side pagination wrapping
  // resources$ = combineLatest...

  nextPage() {
    // Subscribe/take(1) to get values cleanly or use withLatestFrom in a stream, but manual check is fine here
    const current = this.currentPage$.value;
    const total = Math.ceil(this.totalItems$.value / this.itemsPerPage);
    if (current < total) {
      this.currentPage$.next(current + 1);
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

  toggleCategory(catId: string, forceOpen = false) {
    const isSame = this.expandedCategory$.value === catId;

    if (isSame && !forceOpen) {
      this.expandedCategory$.next(''); // Just Close
    } else {
      this.expandedCategory$.next(catId); // Just Open

      // Fetch topics so they are visible in the accordion
      if (!this.topicsCache[catId]) {
        this.categoryService.getTopics(catId).subscribe((res) => {
          this.topicsCache[catId] = res.data;
          // Note: We don't necessarily need to push to currentTopics$ if we use the cache in the template
          // But our template iterates `currentTopics$`.
          // We should probably update the template to iterate `topicsCache[cat.id]` or similar,
          // OR update `currentTopics` to match the *expanded* category.
          this.currentTopics$.next(res.data);
        });
      } else {
        this.currentTopics$.next(this.topicsCache[catId]);
      }
    }

    // Crucial: DO NOT reset filters or page here.
  }

  // Updated to handle "All" button specifically
  onAllCategoriesClick() {
    this.resetFilters();
  }

  // Deprecated/Modified: onCategoryChange used to be the click handler.
  // Now we use `toggleCategory` for the accordion headers directly?
  // Or keep `onCategoryChange` but make it behavior differently.
  // Let's rely on the template calling `toggleCategory` for headers.

  resetFilters() {
    this.expandedCategory$.next('');
    this.selectedCategory$.next('');
    this.selectedTopicId$.next(null);
    this.currentTopics$.next([]);
    this.currentPage$.next(1);
  }

  // Refactored Single Select Logic
  selectTopic(topicId: string, categoryId: string) {
    this.selectedTopicId$.next(topicId);

    // Auto-Expand Category (Parent Recognition)
    if (this.expandedCategory$.value !== categoryId) {
      this.toggleCategory(categoryId, true);
    }

    this.currentPage$.next(1);
  }

  // Helper for Template
  onTopicClick(topic: Topic) {
    this.selectTopic(topic.id, topic.categoryId);
  }

  // Deprecated/Removed: toggleTopic for multi-select

  toggleAgeGroup(ageId: string) {
    const current = this.selectedAgeGroupIds$.value;
    if (current.includes(ageId)) {
      this.selectedAgeGroupIds$.next(current.filter((id) => id !== ageId));
    } else {
      this.selectedAgeGroupIds$.next([...current, ageId]);
    }
    this.currentPage$.next(1);
  }

  onSortChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.sortOption$.next(value);
  }

  openPreview(resource: Resource) {
    this.resourceService.incrementViewCount(resource.id).subscribe();
    this.router.navigate(['/resources', resource.id]);
  }

  downloadResource(resource: Resource) {
    if (resource.url) {
      window.open(resource.url, '_blank');
    }
  }

  // Mobile Filter Logic
  isMobileFilterOpen = false;

  toggleMobileFilter() {
    this.isMobileFilterOpen = !this.isMobileFilterOpen;
    if (this.isMobileFilterOpen) {
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    } else {
      document.body.style.overflow = '';
    }
  }

  isCategoryActive(catId: string): boolean {
    const selectedTopic = this.selectedTopicId$.value;
    // 1. If a topic is selected, check if it belongs to this category
    if (selectedTopic) {
      // Check cache (Active Parent Logic)
      const topics = this.topicsCache[catId];
      if (topics && topics.some((t) => t.id === selectedTopic)) {
        return true;
      }
    }
    // 2. Fallback: If no topic selected, check if this category itself is selected
    // (This allows "All in [Category]" to still highlight the parent)
    return this.selectedCategory$.value === catId;
  }

  closeMobileFilter() {
    this.isMobileFilterOpen = false;
    document.body.style.overflow = '';
  }
}
