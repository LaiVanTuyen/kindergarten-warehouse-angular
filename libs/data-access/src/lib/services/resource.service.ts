import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_URL } from '../tokens';
import { Observable, catchError, throwError, map } from 'rxjs';
import {
  Resource,
  RestResponse,
  PaginatedResponse,
  ResourceFilterParams,
  AgeGroup,
} from '../models/resource.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class ResourceService {
  private http = inject(HttpClient);
  private apiUrl = inject(API_URL);

  /**
   * Get Public Resources with Filters and Pagination
   * GET /resources
   */
  getResources(
    params: ResourceFilterParams
  ): Observable<RestResponse<PaginatedResponse<Resource>>> {
    let httpParams = new HttpParams();

    if (params.page !== undefined)
      httpParams = httpParams.set('page', params.page - 1); // Backend is 0-indexed
    if (params.size !== undefined)
      httpParams = httpParams.set('size', params.size);
    if (params.topicId) httpParams = httpParams.set('topicId', params.topicId);
    if (params.categoryId)
      httpParams = httpParams.set('categoryId', params.categoryId);
    if (params.ageGroupId)
      httpParams = httpParams.set('ageGroupId', params.ageGroupId);
    if (params.keyword) httpParams = httpParams.set('keyword', params.keyword);
    if (params.topic) httpParams = httpParams.set('topic', params.topic);
    if (params.category)
      httpParams = httpParams.set('category', params.category);
    if (params.ages) httpParams = httpParams.set('ages', params.ages);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.type) httpParams = httpParams.set('type', params.type);

    return this.http
      .get<RestResponse<PaginatedResponse<Resource>>>(
        `${this.apiUrl}/resources`,
        {
          params: httpParams,
        }
      )
      .pipe(
        map((res) => {
          if (res.result && !res.data) {
            res.data = res.result;
          }
          return res;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get Resource by Slug
   * GET /resources/:slug
   */
  getResource(slug: string): Observable<RestResponse<Resource>> {
    return this.http
      .get<RestResponse<Resource>>(`${this.apiUrl}/resources/${slug}`)
      .pipe(
        map((res) => {
          if (res.result && !res.data) res.data = res.result;
          return res;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Upload Resource
   * POST /resources
   * Payload: FormData
   */
  uploadResource(formData: FormData): Observable<RestResponse<Resource>> {
    // Username should be appended by the component before calling this
    return this.http
      .post<RestResponse<Resource>>(`${this.apiUrl}/resources`, formData)
      .pipe(
        map((res) => {
          if (res.result && !res.data) res.data = res.result;
          return res;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Delete Resource
   * DELETE /resources/:id
   */
  deleteResource(id: string): Observable<RestResponse<void>> {
    return this.http
      .delete<RestResponse<void>>(`${this.apiUrl}/resources/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Increment View Count
   * PUT /resources/:id/view
   */
  incrementViewCount(id: string): Observable<void> {
    return this.http
      .put<void>(`${this.apiUrl}/resources/${id}/view`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Increment Download Count
   * PUT /resources/:id/download
   */
  incrementDownloadCount(id: string): Observable<void> {
    return this.http
      .put<void>(`${this.apiUrl}/resources/${id}/download`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Get Age Groups
   * GET /age-groups
   */
  getAgeGroups(): Observable<ApiResponse<AgeGroup[]>> {
    return this.http
      .get<ApiResponse<AgeGroup[]>>(`${this.apiUrl}/age-groups`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Create Resource (Metadata)
   * POST /resources/json
   */
  createResource(data: any): Observable<RestResponse<Resource>> {
    return this.http
      .post<RestResponse<Resource>>(`${this.apiUrl}/resources/json`, data)
      .pipe(
        map((res) => {
          if (res.result && !res.data) res.data = res.result;
          return res;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Update Resource
   * PUT /resources/:id
   * Content-Type: Query Params
   */
  updateResource(id: string, data: any): Observable<RestResponse<Resource>> {
    return this.http
      .put<RestResponse<Resource>>(`${this.apiUrl}/resources/${id}`, data) // Send data as JSON body
      .pipe(
        map((res) => {
          if (res.result && !res.data) res.data = res.result;
          return res;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Toggle Favorite
   * POST /resources/:id/favorite
   */
  toggleFavorite(id: string): Observable<RestResponse<null>> {
    return this.http
      .post<RestResponse<null>>(`${this.apiUrl}/resources/${id}/favorite`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Approve Resource
   * PUT /resources/:id/approve (Or Update Status)
   */
  approveResource(id: string): Observable<RestResponse<void>> {
    // Based on spec, Admin calls Update with status=APPROVED
    const params = new HttpParams().set('status', 'APPROVED');
    return this.http
      .put<RestResponse<void>>(`${this.apiUrl}/resources/${id}`, {}, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Reject Resource
   * PUT /resources/:id/reject
   */
  rejectResource(id: string): Observable<RestResponse<void>> {
    return this.http
      .put<RestResponse<void>>(`${this.apiUrl}/resources/${id}/reject`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Move Resources
   * PUT /resources/move
   */
  moveResources(
    ids: string[],
    topicId: string
  ): Observable<RestResponse<void>> {
    return this.http
      .put<RestResponse<void>>(`${this.apiUrl}/resources/move`, {
        ids,
        topicId,
      })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any) {
    console.error('ResourceService Error:', error);
    return throwError(
      () =>
        new Error(
          error.message ||
            'Something went wrong while communicating with the server.'
        )
    );
  }
  /**
   * Update Resource Thumbnail
   * POST /resources/:id/thumbnail
   * Payload: FormData (thumbnail: File)
   */
  updateThumbnail(
    id: string,
    thumbnail: File
  ): Observable<RestResponse<{ thumbnailUrl: string }>> {
    const formData = new FormData();
    formData.append('thumbnail', thumbnail);

    return this.http
      .post<RestResponse<{ thumbnailUrl: string }>>(
        `${this.apiUrl}/resources/${id}/thumbnail`,
        formData
      )
      .pipe(catchError(this.handleError));
  }
}
