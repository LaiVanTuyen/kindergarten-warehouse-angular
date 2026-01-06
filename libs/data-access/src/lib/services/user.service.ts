import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  User,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from '../models/auth.model';
import { ApiResponse } from '../models/api-response.model';
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
}
