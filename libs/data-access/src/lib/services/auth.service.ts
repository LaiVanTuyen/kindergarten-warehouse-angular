import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { User, LoginRequest, AuthResponse } from '../models/auth.model';
import { RestResponse } from '../models/resource.model';
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

  private tokenKey = 'access_token';
  private loggedIn = new BehaviorSubject<boolean>(this.hasToken());

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  constructor() {
    // Try to restore user from storage or fetch profile if needed
    // For now, we rely on login to set it, or could decode JWT
    if (this.hasToken()) {
      // Ideally fetch profile here: this.getProfile().subscribe()
    }
  }

  login(credentials: LoginRequest): Observable<RestResponse<AuthResponse>> {
    return this.http
      .post<RestResponse<AuthResponse>>(
        `${this.apiUrl}/auth/login`,
        credentials
      )
      .pipe(
        tap<any>((response) => {
          const token =
            response.data?.accessToken ||
            response.accessToken ||
            response.data?.token ||
            response.token;
          const user = response.data?.user || response.user;

          if (token) {
            this.setToken(token);
            this.loggedIn.next(true);
            this.currentUserSubject.next(user || null);
          }
        })
      );
  }

  logout(message?: string): void {
    this.http.post(`${this.apiUrl}/auth/logout`, {}).subscribe({
      next: () => {
        // success
      },
      error: (err) => {
        console.error('Logout failed', err);
      },
      complete: () => {
        // Session already cleared optimistically
      },
    });
    // Fallback in case API hangs or whatever, we usually want to clear immediately or after response.
    // For better UX, we clear immediately but fire the request.
    this.clearSession(message);
  }

  private clearSession(message?: string): void {
    localStorage.removeItem(this.tokenKey);
    this.loggedIn.next(false);
    this.currentUserSubject.next(null);
    if (message) {
      this.toastService.show(message, 'success');
    }
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return this.hasToken();
  }

  get isLoggedIn$(): Observable<boolean> {
    return this.loggedIn.asObservable();
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }
}
