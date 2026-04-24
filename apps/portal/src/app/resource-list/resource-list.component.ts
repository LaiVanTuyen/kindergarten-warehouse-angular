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
  TopicService,
  Topic,
  Category,
  AgeGroup,
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
  shareReplay,
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
  styles: [
    `
      .custom-scrollbar::-webkit-scrollbar {
        width: 5px;
        height: 5px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: #fbcfe8; /* pink-200 */
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background-color: #f9a8d4; /* pink-300 */
      }
      /* Firefox */
      .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: #fbcfe8 transparent;
      }
    `,
  ],
})
export class ResourceListComponent implements OnInit, OnDestroy {
  private resourceService = inject(ResourceService);
  private categoryService = inject(CategoryService);
  private topicService = inject(TopicService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef); // Add CDR

  private destroy$ = new Subject<void>();

  categories$ = this.categoryService.getCategories(1, 100).pipe(
    shareReplay(1) // Share the result to avoid multiple API calls
  );

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

  // Age Groups State
  ageGroups$ = this.resourceService.getAgeGroups().pipe(
    map((res) => res.result),
    shareReplay(1)
  );
  selectedAgeGroups$ = new BehaviorSubject<AgeGroup[]>([]);

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

  // Cache Update Signal
  private topicsCacheUpdated$ = new BehaviorSubject<void>(undefined);

  // Derived State (Depends on State above)
  activeTitle$ = combineLatest([
    this.categories$,
    this.selectedCategory$,
    this.selectedTopicId$,
    this.topicsCacheUpdated$,
  ]).pipe(
    map(([categories, selectedCatId, selectedTopicId, _]) => {
      // 1. If Topic is Selected, show Topic Title
      if (selectedTopicId) {
        // Search all cache to be safe and handle type mismatches
        for (const catId in this.topicsCache) {
          const topic = this.topicsCache[catId].find(
            (t) => String(t.id) === String(selectedTopicId)
          );
          if (topic) return topic.name;
        }
      }

      // 2. If Category is Selected, show Category Name
      if (selectedCatId) {
        const cat = categories.data.find(
          (c) => String(c.id) === String(selectedCatId)
        );
        if (cat) return cat.name;
      }

      return null;
    })
  );

  pageTitle$ = this.activeTitle$.pipe(
    map((name) => (name ? `${name}` : 'Tài liệu khám phá'))
  );

  breadcrumb$ = combineLatest([
    this.categories$,
    this.selectedCategory$,
    this.selectedTopicId$,
    this.topicsCacheUpdated$,
  ]).pipe(
    map(([categories, selectedCatId, selectedTopicId, _]) => {
      const base = ['Trang chủ', 'Tài liệu'];

      if (selectedTopicId) {
        // Find Topic Object first
        let foundTopic: Topic | undefined;
        for (const catId in this.topicsCache) {
          const t = this.topicsCache[catId].find(
            (item) => String(item.id) === String(selectedTopicId)
          );
          if (t) {
            foundTopic = t;
            break;
          }
        }

        if (foundTopic) {
          // Robustly find parent via topic.categoryId
          const parentCat = categories.data.find(
            (c) => String(c.id) === String(foundTopic?.categoryId)
          );

          if (parentCat) {
            return [...base, parentCat.name, foundTopic.name];
          } else {
            // Fallback if parent not found but topic exists (shouldn't happen)
            return [...base, foundTopic.name];
          }
        }
      }

      if (selectedCatId) {
        const cat = categories.data.find(
          (c) => String(c.id) === String(selectedCatId)
        );
        if (cat) return [...base, cat.name];
      }

      return base;
    })
  );

  constructor() {}

  ngOnInit() {
    // Initialization Logic: Load Categories & AgeGroups -> Read URL -> Find Object -> Activate
    combineLatest([this.categories$, this.ageGroups$, this.route.queryParams])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([categoriesRes, ageGroups, params]) => {
        const catSlug = params['category'];
        const topicSlug = params['topic'];
        const agesParam = params['ages'];

        // 1. Handle Age Groups Sync
        if (agesParam) {
          const slugs = agesParam.split(',');
          const matchedAges = ageGroups.filter((g) => slugs.includes(g.slug));
          // Only update if different to avoid infinite loops if we were 2-way binding differently
          // But here we rely on URL as source of truth mostly
          const currentIds = this.selectedAgeGroups$.value
            .map((g) => g.id)
            .sort()
            .join(',');
          const newIds = matchedAges
            .map((g) => g.id)
            .sort()
            .join(',');

          if (currentIds !== newIds) {
            this.selectedAgeGroups$.next(matchedAges);
          }
        } else {
          if (this.selectedAgeGroups$.value.length > 0) {
            this.selectedAgeGroups$.next([]);
          }
        }

        // 2. Handle Category & Topic Sync
        let foundCat: Category | undefined;

        if (catSlug) {
          foundCat = categoriesRes.data.find((c) => c.slug === catSlug);
          if (foundCat) {
            // Update Sidebar State for Category
            const isCategoryAlreadySelected =
              this.selectedCategory$.value === foundCat.id;

            if (!isCategoryAlreadySelected) {
              this.expandedCategory$.next(foundCat.id);
              this.selectedCategory$.next(foundCat.id);
            }

            // Load Topics for this category to resolve topic slug
            // We need to fetch topics to check if topicSlug exists
            const targetCatId = foundCat.id; // Capture ID for closure safety
            if (!this.topicsCache[targetCatId]) {
              this.topicService.getTopics(targetCatId).subscribe((res) => {
                this.topicsCache[targetCatId] = res.data;
                this.currentTopics$.next(res.data);
                this.topicsCacheUpdated$.next();

                this.resolveTopic(topicSlug, targetCatId);
              });
            } else {
              // If already cached, just ensure currentTopics is updated (e.g. if switching back)
              this.currentTopics$.next(this.topicsCache[targetCatId]);
              this.resolveTopic(topicSlug, targetCatId);
            }
          } else {
            // Slug not found in categories? Maybe handle 404 or just reset
            console.warn(`Category slug '${catSlug}' not found.`);
          }
        } else {
          // No category slug -> Reset if needed, but 'resetFilters' handles the view logic usually
        }
      });
  }

  // Helper to resolve topic slug/id after topics are loaded
  private resolveTopic(topicParam: string | undefined, catId: string) {
    if (topicParam && this.topicsCache[catId]) {
      const foundTopic = this.topicsCache[catId].find(
        (t) => t.slug === topicParam || t.id === topicParam
      );
      if (foundTopic) {
        if (this.selectedTopicId$.value !== foundTopic.id) {
          this.selectedTopicId$.next(foundTopic.id);
        }
      } else {
        console.warn(
          `Topic param '${topicParam}' not found in category ${catId}.`
        );
        this.selectedTopicId$.next(null);
      }
    } else {
      this.selectedTopicId$.next(null);
    }
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

  // Combined Filters Stream
  private filters$ = combineLatest([
    this.selectedCategory$,
    this.selectedTopicId$,
    this.selectedAgeGroups$,
    this.searchQuery$.pipe(startWith('')),
    this.sortOption$,
    this.currentPage$,
  ]).pipe(
    map(([category, topicId, ageGroups, search, sort, page]) => ({
      category,
      topicId,
      ageGroups,
      search,
      sort,
      page,
    }))
  );

  resources$ = this.filters$.pipe(
    debounceTime(100), // Prevent rapid double-firing
    tap(() => this.isLoading$.next(true)),
    switchMap(({ category, topicId, ageGroups, search, sort, page }) => {
      console.log('Filter changed:', {
        category,
        topicId,
        ageGroups,
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

      // Note: We don't need to manually filter by slug here because the
      // subscriptions to URL updates above will set the IDs (category, topicId)
      // which then triggers this stream.

      const ageGroupIds = ageGroups.map((g) => g.id);

      return this.resourceService
        .getResources({
          topicId: targetTopicIds ? targetTopicIds[0] : undefined, // Assuming single topic filter for now or update service to support array
          ageGroupId:
            ageGroupIds.length > 0 ? ageGroupIds.join(',') : undefined,
          keyword: search,
          status: 'APPROVED',
          page,
          size: 9,
        })
        .pipe(
          map((res) => {
            console.log('API Response:', res);
            this.totalItems$.next(res.data.totalElements);
            return res.data.content;
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

  toggleCategory(category: Category, forceOpen = false) {
    // Navigate using SLUG instead of just setting state locally
    // If it's the same category and we are just toggling it closed (if logic allowed),
    // we might want to navigate to root. But instructions say "Selecting a parent category -> remove Topic param".
    // Also usually toggling header in accordion opens it.

    // We update URL, and let the ngOnInit subscription handle state update.

    const isSame = this.expandedCategory$.value === category.id;

    if (isSame && !forceOpen) {
      // Ideally we might want to close it aka deselect everything?
      // The original logic was: expandedCategory$.next(''); selectedCategory$.next('');
      this.router.navigate(['/resources'], {
        queryParams: {
          category: null,
          topic: null,
        },
        queryParamsHandling: 'merge',
      });
    } else {
      // Select Category, Deselect Topic
      this.router.navigate(['/resources'], {
        queryParams: {
          category: category.slug, // Use Slug
          topic: null,
        },
        queryParamsHandling: 'merge',
      });
    }
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
    this.selectedAgeGroups$.next([]); // Clear Age Group Filters
    this.currentPage$.next(1);

    // Clear search/query params and ensure we act as a full reset
    this.router.navigate(['/resources']);
  }

  // Refactored Single Select Logic
  selectTopic(topic: Topic, category: Category) {
    if (category) {
      this.router.navigate(['/resources'], {
        queryParams: {
          category: category.slug, // Use Slug from passed category
          topic: topic.slug || topic.id,
        },
        queryParamsHandling: 'merge',
      });
    }
  }

  // Helper for Template
  onTopicClick(topic: Topic, category: Category, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.selectTopic(topic, category);
  }

  // Deprecated/Removed: toggleTopic for multi-select

  toggleAgeGroup(age: AgeGroup) {
    const current = this.selectedAgeGroups$.value;
    const exists = current.find((g) => g.id === age.id);

    let newSelection: AgeGroup[];

    if (exists) {
      newSelection = current.filter((g) => g.id !== age.id);
    } else {
      newSelection = [...current, age];
    }

    // Update URL
    const slugs = newSelection.map((g) => g.slug).join(',');
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ages: slugs.length > 0 ? slugs : null },
      queryParamsHandling: 'merge',
    });

    this.currentPage$.next(1);
  }

  removeAgeFilter(age: AgeGroup) {
    this.toggleAgeGroup(age);
  }

  isChecked(ageId: string): boolean {
    return this.selectedAgeGroups$.value.some((g) => g.id === ageId);
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
    if (!resource || !resource.id) return;

    this.resourceService.downloadFile(resource.id).subscribe({
      next: (response) => {
        const contentDisposition = response.headers.get('content-disposition');
        let filename = 'tai_lieu_mac_dinh.pdf';

        if (contentDisposition) {
          const regex = /filename\*=UTF-8''(.+)/;
          const matches = regex.exec(contentDisposition);
          if (matches != null && matches[1]) {
            filename = decodeURIComponent(matches[1]);
          } else {
            const fallbackRegex = /filename="?([^"]+)"?/;
            const fallbackMatches = fallbackRegex.exec(contentDisposition);
            if (fallbackMatches != null && fallbackMatches[1]) {
              filename = fallbackMatches[1];
            }
          }
        } else if (resource.title) {
          const ext = resource.fileUrl?.split('.').pop() || 'pdf';
          filename = `${resource.title}.${ext}`;
        }

        const blob = response.body;
        if (blob) {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }

        resource.downloadCount = (resource.downloadCount || 0) + 1;
      },
      error: (err) => {
        console.error('Download failed', err);
        // Fallback
        if (resource.fileUrl) {
          window.open(resource.fileUrl, '_blank');
        }
      },
    });
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

  isTopicSelected(topicId: any): boolean {
    const selected = this.selectedTopicId$.value;
    return String(selected) === String(topicId);
  }

  isCategoryActive(catId: string): boolean {
    const selectedTopic = this.selectedTopicId$.value;
    // 1. If a topic is selected, check if it belongs to this category
    if (selectedTopic) {
      // Check cache (Active Parent Logic)
      const topics = this.topicsCache[catId];
      if (
        topics &&
        topics.some((t) => String(t.id) === String(selectedTopic))
      ) {
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
