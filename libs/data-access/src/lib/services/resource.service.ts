import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_URL } from '../tokens';
import { Observable, catchError, throwError, map } from 'rxjs';
import {
  Resource,
  RestResponse,
  PaginatedResponse,
  ResourceFilterParams,
} from '../models/resource.model';
import { AgeGroup } from '../models/models';

@Injectable({
  providedIn: 'root',
})
export class ResourceService {
  constructor(
    private http: HttpClient,
    @Inject(API_URL) private apiUrl: string
  ) {}

  /**
   * Get Public Resources with Filters and Pagination
   * GET /resources
   */
  getResources(
    params: ResourceFilterParams
  ): Observable<RestResponse<PaginatedResponse<Resource>>> {
    let httpParams = new HttpParams();

    if (params.page !== undefined)
      httpParams = httpParams.set('page', params.page);
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

    return this.http
      .get<RestResponse<PaginatedResponse<Resource>>>(
        `${this.apiUrl}/resources`,
        {
          params: httpParams,
        }
      )
      .pipe(catchError(this.handleError));
  }

  /**
   * Get Resource by Slug
   * GET /resources/:slug
   */
  getResource(slug: string): Observable<RestResponse<Resource>> {
    return this.http
      .get<RestResponse<Resource>>(`${this.apiUrl}/resources/${slug}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Upload Resource
   * POST /resources
   * Payload: FormData
   */
  uploadResource(formData: FormData): Observable<RestResponse<Resource>> {
    return this.http
      .post<RestResponse<Resource>>(`${this.apiUrl}/resources`, formData)
      .pipe(catchError(this.handleError));
  }

  /**
   * Delete Resource
   * DELETE /resources/:id
   */
  deleteResource(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/resources/${id}`)
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
  getAgeGroups(): Observable<RestResponse<AgeGroup[]>> {
    return this.http
      .get<RestResponse<AgeGroup[]>>(`${this.apiUrl}/age-groups`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Create Resource (Metadata)
   * POST /resources/json
   */
  createResource(data: any): Observable<Resource> {
    return this.http
      .post<RestResponse<Resource>>(`${this.apiUrl}/resources/json`, data)
      .pipe(
        map((res) => res.data),
        catchError(this.handleError)
      );
  }

  /**
   * Update Resource
   * PUT /resources/:id
   */
  updateResource(id: string, data: any): Observable<Resource> {
    return this.http
      .put<RestResponse<Resource>>(`${this.apiUrl}/resources/${id}`, data)
      .pipe(
        map((res) => res.data),
        catchError(this.handleError)
      );
  }

  /**
   * Approve Resource
   * PUT /resources/:id/approve
   */
  approveResource(id: string): Observable<void> {
    return this.http
      .put<void>(`${this.apiUrl}/resources/${id}/approve`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Reject Resource
   * PUT /resources/:id/reject
   */
  rejectResource(id: string): Observable<void> {
    return this.http
      .put<void>(`${this.apiUrl}/resources/${id}/reject`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Move Resources
   * PUT /resources/move
   */
  moveResources(ids: string[], topicId: string): Observable<void> {
    return this.http
      .put<void>(`${this.apiUrl}/resources/move`, { ids, topicId })
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
}
