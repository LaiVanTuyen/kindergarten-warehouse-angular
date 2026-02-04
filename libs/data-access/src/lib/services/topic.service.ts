import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';
import { Topic } from '../models/models';
import { ApiResponse, Page } from '../models/api-response.model';
import { API_URL } from '../tokens';

@Injectable({
  providedIn: 'root',
})
export class TopicService {
  constructor(
    private http: HttpClient,
    @Inject(API_URL) private apiUrl: string
  ) {}

  // --- Topics CRUD ---

  /**
   * Get Topics (Lazy Loading support)
   * GET /topics
   */
  getTopics(
    categoryId?: string,
    page = 1,
    limit = 10,
    search?: string,
    isDeleted?: boolean
  ): Observable<{ data: Topic[]; total: number }> {
    let params = new HttpParams()
      .set('page', (page - 1).toString())
      .set('size', limit.toString());

    if (categoryId) {
      params = params.set('categoryId', categoryId);
    }
    if (search) {
      params = params.set('keyword', search);
    }
    if (isDeleted !== undefined) {
      params = params.set('deleted', isDeleted.toString());
    }

    return this.http
      .get<ApiResponse<Page<Topic>>>(`${this.apiUrl}/topics`, {
        params,
      })
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
   * Get functionality for single topic
   * GET /topics/:id
   */
  getTopic(id: string): Observable<ApiResponse<Topic>> {
    return this.http
      .get<ApiResponse<Topic>>(`${this.apiUrl}/topics/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Create Topic
   * POST /topics
   */
  createTopic(topic: Partial<Topic>): Observable<ApiResponse<Topic>> {
    return this.http
      .post<ApiResponse<Topic>>(`${this.apiUrl}/topics`, topic)
      .pipe(catchError(this.handleError));
  }

  /**
   * Update Topic
   * PUT /topics/:id
   */
  updateTopic(
    id: string,
    updates: Partial<Topic>
  ): Observable<ApiResponse<Topic>> {
    return this.http
      .put<ApiResponse<Topic>>(`${this.apiUrl}/topics/${id}`, updates)
      .pipe(catchError(this.handleError));
  }

  /**
   * Delete Topic
   * DELETE /topics/:id
   */
  deleteTopic(id: string, hardDelete = false): Observable<ApiResponse<any>> {
    const params = hardDelete
      ? new HttpParams().set('hard', 'true')
      : undefined;
    return this.http
      .delete<ApiResponse<any>>(`${this.apiUrl}/topics/${id}`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Restore Topic
   * PATCH /topics/:id/restore
   */
  restoreTopic(id: string): Observable<ApiResponse<any>> {
    return this.http
      .patch<ApiResponse<any>>(`${this.apiUrl}/topics/${id}/restore`, {})
      .pipe(catchError(this.handleError));
  }

  // Legacy support for resource details breadcrumb
  getAllTopicsMock(): Observable<Topic[]> {
    return this.getTopics(undefined, 1, 1000).pipe(map((res) => res.data));
  }

  // Helper for error handling
  private handleError(error: any) {
    console.error('TopicService Error:', error);
    return throwError(
      () =>
        new Error(
          error.message ||
            'Something went wrong while communicating with the server.'
        )
    );
  }
}
