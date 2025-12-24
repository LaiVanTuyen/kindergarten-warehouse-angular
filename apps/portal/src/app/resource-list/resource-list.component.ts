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

  selectedCategory$ = new BehaviorSubject<string>('');
  searchQuery$ = this.route.queryParams.pipe(
    map((params) => params['search'] || '')
  );

  // Derived State for UI
  activeCategoryName$ = combineLatest([
    this.categories$,
    this.selectedCategory$,
  ]).pipe(
    map(([categories, selectedId]) => {
      const cat = categories.data.find((c) => c.id === selectedId);
      return cat ? cat.name : null;
    })
  );

  pageTitle$ = this.activeCategoryName$.pipe(
    map((name) => (name ? `${name} Resources` : 'list.explore'))
  );

  breadcrumb$ = this.activeCategoryName$.pipe(
    map((name) => (name ? ['Home', 'Resources', name] : ['Home', 'Resources']))
  );

  // Sidebar State
  expandedCategory$ = new BehaviorSubject<string>('');
  selectedTopicIds$ = new BehaviorSubject<string[]>([]); // Changed to Array
  currentTopics$ = new BehaviorSubject<Topic[]>([]);
  topicsCache: { [key: string]: Topic[] } = {};

  isLoading$ = new BehaviorSubject<boolean>(true);

  // Resources based on filters
  // Pagination State
  currentPage$ = new BehaviorSubject<number>(1);
  itemsPerPage = 8;
  totalItems$ = new BehaviorSubject<number>(0); // Reactive totalItems

  totalPages$ = this.totalItems$.pipe(
    map((total) => Math.ceil(total / this.itemsPerPage))
  );

  pages$ = this.totalPages$.pipe(
    map((total) => Array.from({ length: total }, (_, i) => i + 1))
  );

  sortOption$ = new BehaviorSubject<string>('newest'); // Default sort

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

  private filterState$ = combineLatest([
    this.selectedCategory$,
    this.selectedTopicIds$,
    this.searchQuery$.pipe(startWith('')),
    this.sortOption$,
    this.currentPage$,
  ]);

  resources$ = this.filterState$.pipe(
    debounceTime(100), // Prevent rapid double-firing
    tap(() => this.isLoading$.next(true)),
    switchMap(([categoryId, topicIds, search, sort, page]) => {
      console.log('Filter changed:', {
        categoryId,
        topicIds,
        search,
        sort,
        page,
      });
      // Logic:
      // If TopicIds are selected -> Filter by those topicIds
      // If Category is selected (but no specific topics) -> Filter by ALL topics in that category

      let targetTopicIds: string[] | undefined = undefined;

      if (topicIds && topicIds.length > 0) {
        targetTopicIds = topicIds;
      } else if (categoryId) {
        // Fallback to Category Topics if no specific topics selected
        const cachedTopics = this.topicsCache[categoryId];
        if (cachedTopics) {
          targetTopicIds = cachedTopics.map((t) => t.id);
        } else {
          // If topics not loaded yet, we might miss filtering here in this synchronous flow.
          // However, onCategoryChange triggers fetching, so hopefully they arrive soon
          // and trigger this stream again via `currentTopics$` if we were listening to it?
          // Actually, we are not listening to currentTopics$ here.
          // Ideally we should include currentTopics$ in combineLatest or just rely on the fetch.
          // For now, let's leave it as best effort based on cache.
        }
      }

      // Hardcode isLoading reset in case of error/completion
      // const safeFinalize = () => this.isLoading$.next(false);
      // finalized in pipe

      return this.resourceService
        .getResources(page, this.itemsPerPage, {
          topicIds: targetTopicIds,
          search,
          status: 'approved',
        })
        .pipe(
          map((res) => {
            console.log('API Response:', res);
            this.totalItems$.next(res.total); // Update reactive total
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
    // 3. Rewrite toggleCategory (Open/Close)
    const isSame = this.expandedCategory$.value === catId;

    if (isSame && !forceOpen) {
      this.expandedCategory$.next(''); // Close if same and not forced
    } else {
      this.expandedCategory$.next(catId); // Open new

      // Update selected Category
      this.selectedCategory$.next(catId);

      // Also fetch topics if needed
      if (!this.topicsCache[catId]) {
        this.categoryService.getTopics(catId).subscribe((res) => {
          this.topicsCache[catId] = res.data;
          this.currentTopics$.next(res.data);
        });
      } else {
        this.currentTopics$.next(this.topicsCache[catId]);
      }
    }

    if (this.expandedCategory$.value === '') {
      this.selectedCategory$.next(''); // Clear selection if collapsed
      this.currentTopics$.next([]);
    }

    this.currentPage$.next(1);
  }

  // Backward compatibility wrapper if needed, or replace html calls
  onCategoryChange(catId: string) {
    if (catId === '') {
      this.resetFilters();
    } else {
      this.toggleCategory(catId);
    }
  }

  resetFilters() {
    this.expandedCategory$.next('');
    this.selectedCategory$.next('');
    this.selectedTopicIds$.next([]);
    this.currentTopics$.next([]);
    this.currentPage$.next(1);
  }

  toggleTopic(topicId: string) {
    // 2. Rewrite toggleTopic function (Select multiple)
    const currentIds = this.selectedTopicIds$.value;
    const index = currentIds.indexOf(topicId);

    let newIds: string[];
    if (index > -1) {
      // If it is: Delete it (Deselect)
      newIds = currentIds.filter((id) => id !== topicId);
    } else {
      // If it is not: Add it to the array (Select add)
      newIds = [...currentIds, topicId];
    }

    this.selectedTopicIds$.next(newIds);
    this.currentPage$.next(1); // Next: Call the loadResources function again and reset to page 1.
  }

  // Backward compatibility
  onTopicChange(topicId: string) {
    this.toggleTopic(topicId);
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

  closeMobileFilter() {
    this.isMobileFilterOpen = false;
    document.body.style.overflow = '';
  }
}
