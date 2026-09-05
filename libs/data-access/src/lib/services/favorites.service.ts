import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { API_URL } from '../tokens';
import {
  PaginatedResponse,
  Resource,
  RestResponse,
} from '../models/resource.model';
import { AuthService } from './auth.service';

/**
 * Source of truth for "which resources are favorited by the current user".
 *
 * - `ids` is a signal-backed Set so `resource-card` can render the heart state
 *   in O(1) without hitting the server per card.
 * - `toggle(id)` does an optimistic update + server sync, and rolls back on error.
 * - Hydrates once when the user becomes authenticated; clears on logout.
 *
 * Backend contract expected:
 *   GET  /favorites?page&size    → ApiResponse<Page<Resource>>
 *   GET  /favorites/ids          → ApiResponse<string[]>
 *   POST /resources/:id/favorite → ApiResponse<{ favorited: boolean }>  (toggles)
 */
@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);
  private readonly auth = inject(AuthService);

  private readonly _ids = signal<ReadonlySet<string>>(new Set());
  readonly ids = this._ids.asReadonly();
  readonly count = computed(() => this._ids().size);

  private hydrated = false;

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      if (user) {
        this.hydrate();
      } else {
        this._ids.set(new Set());
        this.hydrated = false;
      }
    });
  }

  isFavorited(resourceId: string): boolean {
    return this._ids().has(resourceId);
  }

  hydrate(force = false): void {
    if (this.hydrated && !force) return;
    this.hydrated = true;
    this.http
      .get<RestResponse<string[]>>(`${this.apiUrl}/favorites/ids`)
      .subscribe({
        next: (res) => this._ids.set(new Set(res.result ?? res.data ?? [])),
        error: () => {
          // Non-fatal — user can still toggle; we'll reconcile next time.
          this.hydrated = false;
        },
      });
  }

  list(
    page = 1,
    size = 12
  ): Observable<RestResponse<PaginatedResponse<Resource>>> {
    const params = new HttpParams()
      .set('page', Math.max(0, page - 1))
      .set('size', size);
    return this.http
      .get<RestResponse<PaginatedResponse<Resource>>>(
        `${this.apiUrl}/favorites`,
        { params }
      )
      .pipe(
        tap((res) => {
          const content = (res.result ?? res.data)?.content ?? [];
          if (content.length) {
            const merged = new Set(this._ids());
            content.forEach((r) => merged.add(r.id));
            this._ids.set(merged);
          }
        })
      );
  }

  toggle(resourceId: string): Observable<boolean> {
    const before = this._ids();
    const wasFavorited = before.has(resourceId);

    // Optimistic update — UI flips instantly.
    const optimistic = new Set(before);
    wasFavorited ? optimistic.delete(resourceId) : optimistic.add(resourceId);
    this._ids.set(optimistic);

    return this.http
      .post<RestResponse<{ isFavorited?: boolean; favorited?: boolean } | null>>(
        `${this.apiUrl}/resources/${resourceId}/favorite`,
        {}
      )
      .pipe(
        map((res) => {
          const result = res.result ?? res.data;
          return result?.isFavorited ?? result?.favorited ?? !wasFavorited;
        }),
        tap((favorited) => {
          const reconciled = new Set(this._ids());
          favorited ? reconciled.add(resourceId) : reconciled.delete(resourceId);
          this._ids.set(reconciled);
        }),
        catchError((err) => {
          this._ids.set(before);
          return throwError(() => err);
        })
      );
  }
}
