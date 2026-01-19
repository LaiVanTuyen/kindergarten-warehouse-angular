import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError, map, of } from 'rxjs';
import { Category, Topic } from '../models/models';
import { ApiResponse } from '../models/api-response.model'; // Use correct model
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
    search?: string
  ): Observable<{ data: Category[]; total: number }> {
    let params = new HttpParams()
      .set('page', (page - 1).toString()) // Backend usually 0-indexed
      .set('size', limit.toString());

    if (search) {
      params = params.set('keyword', search);
    }

    return this.http
      .get<ApiResponse<Category[]>>( // Expecting Array in result
        `${this.apiUrl}/categories`,
        { params }
      )
      .pipe(
        map((res) => {
           // Handle if result is array (no pagination metadata provided in common 'result' field?)
           // If backend doesn't return total, we might validly assume list length or just no pagination support yet unless wrapped.
           // Based on screenshot, result IS the array.
           const data = res.result || [];
           return {
             data: data,
             total: data.length, // Fallback as we don't have totalElements
           };
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Create Category
   * POST /categories
   */
  createCategory(category: Partial<Category>): Observable<Category> {
    return this.http
      .post<ApiResponse<Category>>(`${this.apiUrl}/categories`, category)
      .pipe(
        map((res) => res.result), // Map result
        catchError(this.handleError)
      );
  }

  /**
   * Update Category
   * PUT /categories/:id
   */
  updateCategory(id: string, updates: Partial<Category>): Observable<Category> {
    return this.http
      .put<ApiResponse<Category>>(
        `${this.apiUrl}/categories/${id}`,
        updates
      )
      .pipe(
        map((res) => res.result),
        catchError(this.handleError)
      );
  }

  /**
   * Delete Category
   * DELETE /categories/:id
   */
  deleteCategory(id: string): Observable<boolean> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/categories/${id}`).pipe(
      map(() => true),
      catchError(this.handleError)
    );
  }

  // --- Topics CRUD ---

  /**
   * Get Topics (Lazy Loading support)
   * GET /topics
   */
  getTopics(
    categoryId?: string,
    page = 1,
    limit = 10,
    search?: string
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

    return this.http
      .get<ApiResponse<Topic[]>>(`${this.apiUrl}/topics`, { // Expecting Array
        params,
      })
      .pipe(
        map((res) => {
          const data = res.result || [];
          return {
            data: data,
            total: data.length, // Fallback
          };
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Create Topic
   * POST /topics
   */
  createTopic(topic: Partial<Topic>): Observable<Topic> {
    return this.http
      .post<ApiResponse<Topic>>(`${this.apiUrl}/topics`, topic)
      .pipe(
        map((res) => res.result),
        catchError(this.handleError)
      );
  }

  /**
   * Update Topic
   * PUT /topics/:id
   */
  updateTopic(id: string, updates: Partial<Topic>): Observable<Topic> {
    return this.http
      .put<ApiResponse<Topic>>(`${this.apiUrl}/topics/${id}`, updates)
      .pipe(
        map((res) => res.result),
        catchError(this.handleError)
      );
  }

  /**
   * Delete Topic
   * DELETE /topics/:id
   */
  deleteTopic(id: string): Observable<boolean> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/topics/${id}`).pipe(
      map(() => true),
      catchError(this.handleError)
    );
  }
  
  // Legacy support for resource details breadcrumb
  getAllTopicsMock(): Observable<Topic[]> {
     return this.getTopics(undefined, 1, 1000).pipe(map(res => res.data));
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
