import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, tap, finalize } from 'rxjs';
import { Router } from '@angular/router';
import { User, LoginRequest, AuthResponse } from '../models/auth.model';
import { ApiResponse } from '../models/api-response.model';
import { API_URL } from '../tokens';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = inject(API_URL);
  private toastService = inject(ToastService);

  // No longer use access_token in localStorage
  private userKey = 'user_profile';

  // Initialize user state from saved profile
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  // LoggedIn state is derived from having a user profile for now (User session is valid)
  // Or purely rely on cookie presence which we can't check from JS directly if HttpOnly.
  // We assume if we have a user profile, we are logged in until 401 happens.
  private loggedIn = new BehaviorSubject<boolean>(!!this.getUser());

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  constructor() {}

  login(credentials: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap((response) => {
          // Cookie is set automatically by browser
          const user = response.result?.user;

          if (user) {
            this.setUser(user);
            this.loggedIn.next(true);
            this.currentUserSubject.next(user);
          }
        })
      );
  }

  logout(message?: string, callApi = true): void {
    // 1. Clear UI state immediately
    this.clearSession(false);

    if (callApi) {
      // 2. Fire & Forget API call to clear cookies
      this.http
        .post(`${this.apiUrl}/auth/logout`, {})
        .pipe(
          finalize(() => {
            // 3. Ensure we are redirected
            this.router.navigate(['/login']);
            if (message) {
              this.toastService.show(message, 'success');
            }
          })
        )
        .subscribe({
          next: () => {},
          error: (err) =>
            console.warn('Logout API failed but local session cleared', err),
        });
    } else {
      this.router.navigate(['/login']);
      if (message) {
        this.toastService.show(message, 'success');
      }
    }
  }

  private clearSession(redirect = true): void {
    // Only clear user profile
    localStorage.removeItem(this.userKey);
    // Remove legacy tokens if they exist
    localStorage.removeItem('access_token');
    localStorage.removeItem('accessToken');

    this.loggedIn.next(false);
    this.currentUserSubject.next(null);
    if (redirect) {
      this.router.navigate(['/login']);
    }
  }

  // Helper: Get user profile for UI (Avatar, Name)
  private setUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  private getUser(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    return userStr ? JSON.parse(userStr) : null;
  }

  getToken(): string | null {
    // No longer accessible
    return null;
  }

  isLoggedIn(): boolean {
    return !!this.getUser();
  }

  get isLoggedIn$(): Observable<boolean> {
    return this.loggedIn.asObservable();
  }
}
