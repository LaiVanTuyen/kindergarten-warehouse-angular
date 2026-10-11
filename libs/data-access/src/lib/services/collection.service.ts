import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_URL } from '../tokens';
import { PaginatedResponse, Resource, RestResponse } from '../models/resource.model';

export type CollectionVisibility = 'PRIVATE' | 'SHARED';

export interface CollectionRef {
  id: number;
  name: string;
}

export interface CollectionSummary {
  id: number;
  title: string;
  description?: string | null;
  visibility: CollectionVisibility;
  ageGroup?: CollectionRef | null;
  topic?: CollectionRef | null;
  ownerId: number;
  ownerName: string;
  isOwner: boolean;
  itemCount: number;
  sourceCollectionId?: number | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

/** `resource` is null when the viewer can no longer open it (removed, taken down, private). */
export interface CollectionItem {
  id: number;
  position: number;
  note?: string | null;
  resourceId: string;
  available: boolean;
  resource: Resource | null;
}

export interface CollectionDetail {
  collection: CollectionSummary;
  items: CollectionItem[];
}

export interface CollectionMembership {
  id: number;
  title: string;
  itemCount: number;
  containsResource: boolean;
}

export interface CollectionUpsert {
  title: string;
  description?: string | null;
  ageGroupId?: number | null;
  topicId?: number | null;
  visibility: CollectionVisibility;
  /** Required for updates (optimistic lock). */
  version?: number;
}

const unwrap = <T>(res: RestResponse<T>): T => (res.result ?? res.data) as T;

/** "Bộ học liệu" — `/api/v1/collections`. Pages are 1-based like the rest of the Portal. */
@Injectable({ providedIn: 'root' })
export class CollectionService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_URL)}/collections`;

  listMine(page = 1, size = 12): Observable<PaginatedResponse<CollectionSummary>> {
    return this.http
      .get<RestResponse<PaginatedResponse<CollectionSummary>>>(`${this.base}/me`, {
        params: new HttpParams().set('page', page - 1).set('size', size),
      })
      .pipe(map(unwrap));
  }

  listShared(keyword = '', page = 1, size = 12): Observable<PaginatedResponse<CollectionSummary>> {
    let params = new HttpParams().set('page', page - 1).set('size', size);
    if (keyword.trim()) params = params.set('keyword', keyword.trim());
    return this.http
      .get<RestResponse<PaginatedResponse<CollectionSummary>>>(`${this.base}/shared`, { params })
      .pipe(map(unwrap));
  }

  membership(resourceId: string): Observable<CollectionMembership[]> {
    return this.http
      .get<RestResponse<CollectionMembership[]>>(`${this.base}/me/membership`, {
        params: new HttpParams().set('resourceId', resourceId),
      })
      .pipe(map((res) => unwrap(res) ?? []));
  }

  get(id: number): Observable<CollectionDetail> {
    return this.http.get<RestResponse<CollectionDetail>>(`${this.base}/${id}`).pipe(map(unwrap));
  }

  create(body: CollectionUpsert): Observable<CollectionSummary> {
    return this.http.post<RestResponse<CollectionSummary>>(this.base, body).pipe(map(unwrap));
  }

  update(id: number, body: CollectionUpsert): Observable<CollectionSummary> {
    return this.http.put<RestResponse<CollectionSummary>>(`${this.base}/${id}`, body).pipe(map(unwrap));
  }

  delete(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`);
  }

  copy(id: number): Observable<CollectionSummary> {
    return this.http.post<RestResponse<CollectionSummary>>(`${this.base}/${id}/copy`, {}).pipe(map(unwrap));
  }

  addItem(id: number, resourceId: string, note?: string): Observable<CollectionItem> {
    return this.http
      .post<RestResponse<CollectionItem>>(`${this.base}/${id}/items`, { resourceId, note })
      .pipe(map(unwrap));
  }

  updateItem(id: number, itemId: number, note: string): Observable<unknown> {
    return this.http.patch(`${this.base}/${id}/items/${itemId}`, { note });
  }

  removeItem(id: number, itemId: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}/items/${itemId}`);
  }

  /** `itemIds` must be every current item id in the new order; a stale list returns 409 (code 6806). */
  reorder(id: number, itemIds: number[]): Observable<unknown> {
    return this.http.put(`${this.base}/${id}/items/order`, { itemIds });
  }
}

/** Backend error codes the collection screens react to. */
export const COLLECTION_ERRORS = {
  NOT_FOUND: 6801,
  FORBIDDEN: 6802,
  ITEM_EXISTS: 6803,
  FULL: 6805,
  STALE: 6806,
  LIMIT: 6807,
} as const;
