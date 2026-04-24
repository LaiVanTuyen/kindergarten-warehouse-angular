import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, of, shareReplay } from 'rxjs';
import { finalize, map, tap } from 'rxjs/operators';
import { Category } from '../models/models';
import { CategoryService } from './category.service';

/**
 * In-memory cache for the category list shared across admin pages.
 *
 * Multiple pages (Resources filters, Categories page, Banners future, etc.)
 * need the full category list. A singleton store avoids duplicate HTTP calls
 * and keeps category state consistent after CRUD operations.
 *
 *   // Anywhere:
 *   this.categoriesStore.load();              // idempotent, cached
 *   this.categoriesStore.categories();        // signal
 *   this.categoriesStore.invalidate();        // after CRUD elsewhere
 */
@Injectable({ providedIn: 'root' })
export class CategoriesStore {
  private service = inject(CategoryService);

  private readonly _categories = signal<Category[] | null>(null);
  private readonly _isLoading = signal<boolean>(false);

  /** Shared in-flight request so concurrent callers don't all trigger HTTP. */
  private inFlight$: Observable<Category[]> | null = null;

  readonly categories = computed(() => this._categories() ?? []);
  readonly isLoading = this._isLoading.asReadonly();
  readonly isLoaded = computed(() => this._categories() !== null);

  /**
   * Return cached list if available; otherwise fetch and cache.
   * Concurrent calls during first load share a single HTTP request.
   */
  load(force = false): Observable<Category[]> {
    const cached = this._categories();
    if (!force && cached !== null) return of(cached);
    if (this.inFlight$ && !force) return this.inFlight$;

    this._isLoading.set(true);
    this.inFlight$ = this.service.getCategories(1, 500).pipe(
      map((res) => res.data),
      tap((data) => this._categories.set(data)),
      finalize(() => {
        this._isLoading.set(false);
        this.inFlight$ = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );
    return this.inFlight$;
  }

  /** Invalidate so the next `load()` refetches (call after external CRUD). */
  invalidate(): void {
    this._categories.set(null);
    this.inFlight$ = null;
  }

  /** Optimistic update — avoids refetching after a successful CRUD. */
  upsert(category: Category): void {
    const list = this._categories() ?? [];
    const idx = list.findIndex((c) => c.id === category.id);
    this._categories.set(
      idx >= 0
        ? list.map((c) => (c.id === category.id ? category : c))
        : [...list, category]
    );
  }

  remove(id: string): void {
    const list = this._categories() ?? [];
    this._categories.set(list.filter((c) => c.id !== id));
  }
}
