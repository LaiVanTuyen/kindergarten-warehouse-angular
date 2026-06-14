import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  User,
  UpdateProfileRequest,
  AdminUpdateUserRequest,
  ChangePasswordRequest,
  UserCreationRequest,
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
    page: number,
    limit: number,
    query: string = '',
    role: string = '', // Comma-separated or 'ALL'
    status: string = '', // Comma-separated or 'ALL'
    sort: string = 'createdAt',
    dir: 'asc' | 'desc' = 'desc'
  ): Observable<ApiResponse<Page<User>>> {
    let params = new HttpParams()
      .set('page', (page - 1).toString()) // Backend expects 0-indexed
      .set('size', limit)
      .set('keyword', query)
      .set('sort', `${sort},${dir}`); // Contract v1 §1.2 — sort=field,dir

    if (role && role !== 'ALL') params = params.set('role', role);
    if (status && status !== 'ALL') params = params.set('status', status);

    return this.http.get<ApiResponse<Page<User>>>(`${this.apiUrl}/users`, {
      params,
      withCredentials: true,
    });
  }

  // Admin: Create User
  createUser(data: UserCreationRequest): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.apiUrl}/users`, data, {
      withCredentials: true,
    });
  }

  // Admin: Update User
  updateUser(
    id: string | number,
    data: AdminUpdateUserRequest
  ): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(
      `${this.apiUrl}/users/${id}`,
      data,
      {
        withCredentials: true,
      }
    );
  }

  // Admin: Reset Password
  // -- Password Reset (Secure OTP Flow) --

  // Step 1: Request OTP
  initiatePasswordReset(
    userId: string | number
  ): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(
      `${this.apiUrl}/users/${userId}/reset-password/init`,
      {}
    );
  }

  // Step 2: Confirm OTP & Reset
  completePasswordReset(
    userId: string | number,
    otp: string
  ): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(
      `${this.apiUrl}/users/${userId}/reset-password/confirm`,
      { otp }
    );
  }

  // Legacy (Direct Reset) - keeping for backward compatibility if needed, or deprecate
  resetPassword(userId: number): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(
      `${this.apiUrl}/users/${userId}/reset-password`,
      {}
    );
  }

  blockUser(id: string): Observable<ApiResponse<any>> {
    // Contract v1 §2.4 — state change → PATCH (BE standardised PUT→PATCH)
    return this.http.patch<ApiResponse<any>>(
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

  restoreUser(id: string): Observable<ApiResponse<any>> {
    // Contract v1 §2.4 — state change → PATCH
    return this.http.patch<ApiResponse<any>>(
      `${this.apiUrl}/users/${id}/restore`,
      {},
      { withCredentials: true }
    );
  }
}
