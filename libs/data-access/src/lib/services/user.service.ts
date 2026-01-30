import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  User,
  UpdateProfileRequest,
  AdminUpdateUserRequest,
  ChangePasswordRequest,
} from '../models/auth.model';
import { ApiResponse, Page } from '../models/api-response.model';
import { API_URL } from '../tokens';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = inject(API_URL);

  updateProfile(data: UpdateProfileRequest): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(
      `${this.apiUrl}/users/profile`,
      data,
      { withCredentials: true }
    );
  }

  // Admin Update User
  updateUser(
    id: number,
    data: AdminUpdateUserRequest
  ): Observable<ApiResponse<User>> {
    // Note: Endpoint might need adjustment when BE is ready.
    // Assuming /users/:id or similar.
    return this.http.put<ApiResponse<User>>(
      `${this.apiUrl}/users/${id}`, // RESTful standard
      data,
      { withCredentials: true }
    );
  }

  changePassword(data: ChangePasswordRequest): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(
      `${this.apiUrl}/users/change-password`,
      data,
      { withCredentials: true }
    );
  }

  uploadAvatar(file: File): Observable<ApiResponse<User>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<User>>(
      `${this.apiUrl}/users/avatar`,
      formData,
      { withCredentials: true }
    );
  }

  getUsers(
    page = 0,
    size = 10,
    keyword?: string,
    role?: string,
    status?: string,
    sortBy: string = 'id',
    order: 'asc' | 'desc' = 'desc'
  ): Observable<ApiResponse<Page<User>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', order);

    if (keyword) params = params.set('keyword', keyword);
    if (role && role !== 'ALL') params = params.set('role', role);
    if (status && status !== 'ALL') params = params.set('status', status);

    return this.http.get<ApiResponse<Page<User>>>(`${this.apiUrl}/users`, {
      params,
      withCredentials: true,
    });
  }

  blockUser(id: string): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(
      `${this.apiUrl}/users/${id}/block`,
      {},
      { withCredentials: true }
    );
  }

  deleteUser(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/users/${id}`, {
      withCredentials: true,
    });
  }
}
