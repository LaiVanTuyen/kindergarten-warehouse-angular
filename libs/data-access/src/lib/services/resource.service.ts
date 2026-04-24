import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
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
   * Get Admin Resources with Filters and Pagination
   * GET /admin/resources
   */
  getResources(
    params: ResourceFilterParams
  ): Observable<RestResponse<PaginatedResponse<Resource>>> {
    let httpParams = new HttpParams();

    if (params.page !== undefined)
      httpParams = httpParams.set('page', params.page - 1); // Backend is 0-indexed
    if (params.size !== undefined)
      httpParams = httpParams.set('size', params.size);

    // Helper to append array or single value
    const appendParam = (key: string, value: string | string[] | undefined) => {
      if (!value) return;
      if (Array.isArray(value)) {
        value.forEach((v) => (httpParams = httpParams.append(key, v)));
      } else {
        httpParams = httpParams.set(key, value as string);
      }
    };

    appendParam('topicId', params.topicId);
    appendParam('categoryId', params.categoryId);
    appendParam('ageGroupId', params.ageGroupId);

    // New Multi-select Params
    appendParam('topicSlugs', params.topicSlugs);
    appendParam('categorySlugs', params.categorySlugs);
    appendParam('ageSlugs', params.ageSlugs);
    appendParam('types', params.types);

    // Old Params (Backward compatibility if needed, but prefer new ones)
    if (!params.topicSlugs && params.topic)
      appendParam('topic', params.topic as any);
    if (!params.categorySlugs && params.category)
      appendParam('category', params.category as any);
    if (!params.ageSlugs && params.ages)
      appendParam('ages', params.ages as any);
    if (!params.types && params.type) appendParam('type', params.type);

    if (params.keyword) httpParams = httpParams.set('keyword', params.keyword);
    appendParam('status', params.status);
    if (params.sort) httpParams = httpParams.set('sort', params.sort);

    return this.http
      .get<RestResponse<PaginatedResponse<Resource>>>(
        `${this.apiUrl}/admin/resources`,
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
   * List the resources owned by the currently authenticated user
   * (teacher "My Uploads" page). Unlike `getResources` — which hits
   * `/admin/resources` — this uses `/me/resources` so it respects the
   * caller's identity on the backend without requiring admin scope.
   *
   * GET /me/resources?page&size&status&keyword
   */
  listMyResources(params: {
    page?: number;
    size?: number;
    status?: string | string[];
    keyword?: string;
    sort?: string;
  }): Observable<RestResponse<PaginatedResponse<Resource>>> {
    let httpParams = new HttpParams()
      .set('page', Math.max(0, (params.page ?? 1) - 1))
      .set('size', params.size ?? 12);
    if (params.keyword) httpParams = httpParams.set('keyword', params.keyword);
    if (params.sort) httpParams = httpParams.set('sort', params.sort);
    if (params.status) {
      const statuses = Array.isArray(params.status)
        ? params.status
        : [params.status];
      statuses.forEach((s) => (httpParams = httpParams.append('status', s)));
    }
    return this.http
      .get<RestResponse<PaginatedResponse<Resource>>>(
        `${this.apiUrl}/me/resources`,
        { params: httpParams }
      )
      .pipe(
        map((res) => {
          if (res.result && !res.data) res.data = res.result;
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
   * DELETE /resources/:id?hard={true/false}
   */
  deleteResource(
    id: string,
    hard: boolean = false
  ): Observable<RestResponse<void>> {
    let params = new HttpParams();
    if (hard) params = params.set('hard', 'true');
    return this.http
      .delete<RestResponse<void>>(`${this.apiUrl}/resources/${id}`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Bulk Delete Resources
   * DELETE /resources/bulk?hard={true/false}
   * Payload: Array of IDs
   */
  bulkDeleteResources(
    ids: string[],
    hard: boolean = false
  ): Observable<RestResponse<void>> {
    let params = new HttpParams();
    if (hard) params = params.set('hard', 'true');
    return this.http
      .delete<RestResponse<void>>(`${this.apiUrl}/resources/bulk`, {
        body: ids,
        params,
      })
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
   * Download a resource file
   * GET /resources/:id/file
   */
  downloadFile(id: string): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/resources/${id}/file`, {
      observe: 'response',
      responseType: 'blob',
    });
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
   * Update Resource (Text/JSON only - no file replacement)
   * PUT /resources/:id
   * Content-Type: application/json
   * Use this when only updating title, description, topicId, ageGroupIds, etc.
   */
  updateResource(id: string, data: any): Observable<RestResponse<Resource>> {
    return this.http
      .put<RestResponse<Resource>>(`${this.apiUrl}/resources/${id}`, data)
      .pipe(
        map((res) => {
          if (res.result && !res.data) res.data = res.result;
          return res;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Update Resource with File/Thumbnail Replacement
   * PUT /resources/:id
   * Content-Type: multipart/form-data
   * Use this when user needs to replace the content file or thumbnail.
   * FormData fields: file?, thumbnail?, title, description, topicId, ageGroupIds[]
   */
  updateResourceWithFormData(
    id: string,
    formData: FormData
  ): Observable<RestResponse<Resource>> {
    return this.http
      .put<RestResponse<Resource>>(`${this.apiUrl}/resources/${id}`, formData)
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
   * PATCH /admin/resources/:id/approve
   */
  approveResource(id: string): Observable<RestResponse<void>> {
    return this.http
      .patch<RestResponse<void>>(
        `${this.apiUrl}/admin/resources/${id}/approve`,
        {}
      )
      .pipe(catchError(this.handleError));
  }

  /**
   * Reject Resource
   * PATCH /admin/resources/:id/reject
   */
  rejectResource(id: string, reason: string): Observable<RestResponse<void>> {
    return this.http
      .patch<RestResponse<void>>(
        `${this.apiUrl}/admin/resources/${id}/reject`,
        { reason }
      )
      .pipe(catchError(this.handleError));
  }

  /**
   * Bulk Approve Resources
   * PATCH /admin/resources/bulk-approve
   */
  bulkApproveResources(
    ids: string[]
  ): Observable<
    RestResponse<{ successCount: number; failedIds: string[]; message: string }>
  > {
    return this.http
      .patch<
        RestResponse<{
          successCount: number;
          failedIds: string[];
          message: string;
        }>
      >(`${this.apiUrl}/admin/resources/bulk-approve`, {
        resourceIds: ids,
      })
      .pipe(catchError(this.handleError));
  }

  /**
   * Bulk Reject Resources
   * PATCH /admin/resources/bulk-reject
   */
  bulkRejectResources(
    ids: string[],
    reason: string
  ): Observable<
    RestResponse<{ successCount: number; failedIds: string[]; message: string }>
  > {
    return this.http
      .patch<
        RestResponse<{
          successCount: number;
          failedIds: string[];
          message: string;
        }>
      >(`${this.apiUrl}/admin/resources/bulk-reject`, {
        resourceIds: ids,
        reason,
      })
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

    let errorMsg = 'Đã xảy ra lỗi khi kết nối với máy chủ.';

    // Extract API specific error code/message if available
    if (error.error && error.error.code) {
      const code = error.error.code;
      switch (code) {
        case 6001:
          errorMsg = 'Không tìm thấy tài nguyên. Có thể đã bị xóa hoặc ẩn.';
          break;
        case 6004:
          errorMsg = 'Bạn không có quyền thực hiện thao tác này.';
          break;
        case 6005:
          errorMsg =
            'Đường dẫn YouTube không hợp lệ hoặc video không khả dụng.';
          break;
        case 6006:
          errorMsg =
            'Định dạng ảnh thu nhỏ không hợp lệ (hỗ trợ JPG, PNG, WebP).';
          break;
        case 6007:
          errorMsg =
            'Kích thước ảnh thu nhỏ quá lớn. Vui lòng chọn ảnh nhỏ hơn.';
          break;
        case 9001:
          errorMsg =
            'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin cung cấp.';
          break;
        default:
          if (error.error.message) {
            errorMsg = error.error.message;
          }
          break;
      }
    } else if (error.message) {
      errorMsg = error.message;
    }

    return throwError(() => new Error(errorMsg));
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

  /**
   * Change Resource Visibility
   * PATCH /resources/:id/visibility
   */
  changeVisibility(
    id: string,
    visibility: 'PUBLIC' | 'PRIVATE'
  ): Observable<RestResponse<void>> {
    return this.http
      .patch<RestResponse<void>>(`${this.apiUrl}/resources/${id}/visibility`, {
        visibility,
      })
      .pipe(catchError(this.handleError));
  }

  /**
   * Restore Resource
   * PUT /resources/:id/restore
   */
  restoreResource(id: string): Observable<RestResponse<void>> {
    return this.http
      .put<RestResponse<void>>(`${this.apiUrl}/resources/${id}/restore`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Bulk Restore Resources
   * PATCH /resources/bulk-restore
   * Payload: Array of IDs
   */
  bulkRestoreResources(ids: string[]): Observable<RestResponse<void>> {
    return this.http
      .patch<RestResponse<void>>(`${this.apiUrl}/resources/bulk-restore`, ids)
      .pipe(catchError(this.handleError));
  }
}
