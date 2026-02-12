import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';
import { Category } from '../models/models';
import { ApiResponse, Page } from '../models/api-response.model';
import { API_URL } from '../tokens';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  constructor(
    private http: HttpClient,
    @Inject(API_URL) private apiUrl: string
  ) {}

  // --- Categories CRUD ---

  /**
   * Get Categories with Pagination and Search
   * GET /categories
   */
  getCategories(
    page = 1,
    limit = 10,
    search?: string,
    isDeleted?: boolean,
    status?: string, // Comma separated 'ACTIVE', 'INACTIVE'
    sortBy: string = 'id',
    order: 'asc' | 'desc' = 'desc'
  ): Observable<{ data: Category[]; total: number }> {
    let params = new HttpParams()
      .set('page', (page - 1).toString()) // Backend usually 0-indexed
      .set('size', limit.toString())
      .set('sortBy', sortBy)
      .set('sortDir', order); // Backend expects 'sortDir'

    if (search) {
      params = params.set('keyword', search);
    }
    if (isDeleted !== undefined) {
      params = params.set('deleted', isDeleted.toString());
    }
    if (status) {
      params = params.set('status', status);
    }

    return this.http
      .get<ApiResponse<Page<Category>>>(`${this.apiUrl}/categories`, { params })
      .pipe(
        map((res) => {
          const pageData = res.result;
          return {
            data: pageData.content || [],
            total: pageData.totalElements || 0,
          };
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Create Category
   * POST /categories
   */
  createCategory(
    category: FormData | Partial<Category>
  ): Observable<ApiResponse<Category>> {
    return this.http
      .post<ApiResponse<Category>>(`${this.apiUrl}/categories`, category)
      .pipe(catchError(this.handleError));
  }

  /**
   * Update Category
   * PUT /categories/:id
   */
  updateCategory(
    id: string,
    updates: FormData | Partial<Category>
  ): Observable<ApiResponse<Category>> {
    return this.http
      .put<ApiResponse<Category>>(`${this.apiUrl}/categories/${id}`, updates)
      .pipe(catchError(this.handleError));
  }

  /**
   * Delete Category
   * DELETE /categories/:id
   */
  deleteCategory(id: string, hardDelete = false): Observable<ApiResponse<any>> {
    const params = hardDelete
      ? new HttpParams().set('hard', 'true')
      : undefined;
    return this.http
      .delete<ApiResponse<any>>(`${this.apiUrl}/categories/${id}`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Bulk Delete Categories
   * DELETE /categories/bulk
   */
  deleteCategories(
    ids: (string | number)[],
    hard = false
  ): Observable<ApiResponse<any>> {
    const params = new HttpParams().set('hard', hard);
    return this.http
      .request<ApiResponse<any>>('delete', `${this.apiUrl}/categories/bulk`, {
        body: ids,
        params,
      })
      .pipe(catchError(this.handleError));
  }

  /**
   * Bulk Restore Categories
   * PATCH /categories/bulk-restore
   */
  restoreCategories(ids: (string | number)[]): Observable<ApiResponse<any>> {
    return this.http
      .patch<ApiResponse<any>>(`${this.apiUrl}/categories/bulk-restore`, ids)
      .pipe(catchError(this.handleError));
  }

  /**
   * Restore Category
   * PATCH /categories/:id/restore
   */
  restoreCategory(id: string): Observable<ApiResponse<any>> {
    return this.http
      .patch<ApiResponse<any>>(`${this.apiUrl}/categories/${id}/restore`, {})
      .pipe(catchError(this.handleError));
  }

  // Helper for error handling
  private handleError(error: any) {
    console.error('CategoryService Error:', error);
    return throwError(
      () =>
        new Error(
          error.message ||
            'Something went wrong while communicating with the server.'
        )
    );
  }
}
