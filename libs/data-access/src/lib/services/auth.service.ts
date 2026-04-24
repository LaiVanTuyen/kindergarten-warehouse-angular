import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { BehaviorSubject, Observable, tap, finalize } from 'rxjs';
import { Router } from '@angular/router';
import {
  User,
  LoginRequest,
  AuthResponse,
  RegisterRequest,
} from '../models/auth.model';
import { ApiResponse } from '../models/api-response.model';
import { API_URL } from '../tokens';
import { ToastService } from './toast.service';
import { environment } from '../environments/environment';

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

  // Signal mirror for ergonomic use in templates / computed state.
  // Kept in sync with `currentUserSubject` (the legacy Observable API).
  private readonly currentUserSignal = signal<User | null>(this.getUser());
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isLoggedIn$$ = computed(() => this.currentUserSignal() !== null);
  readonly roles = computed<string[]>(() => {
    const user = this.currentUserSignal();
    if (!user) return [];
    if (user.roles && user.roles.length > 0) return user.roles;
    return user.role ? [user.role] : [];
  });
  readonly isTeacher = computed(() => this.roles().includes('TEACHER'));
  readonly isAdmin = computed(() => this.roles().includes('ADMIN'));

  // LoggedIn state is derived from having a user profile (session is valid
  // until a 401 tells us otherwise). We cannot inspect the HttpOnly cookie
  // directly from JS.
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
            this.applyUser(user);
          }
        })
      );
  }

  /**
   * Register a new account. Backend contract:
   *   POST /auth/register
   *   { fullName, email, password, username? }
   *   → 201 ApiResponse<AuthResponse>  (session cookie set, user returned)
   *   → 409 if email/username already exists
   *
   * We opt into the same "cookie session" flow as login so the user lands on
   * the portal already authenticated. If the backend does not auto-login after
   * register (some setups require email verification first), the caller can
   * simply ignore the returned user and redirect to /login.
   */
  register(payload: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.apiUrl}/auth/register`, payload)
      .pipe(
        tap((response) => {
          const user = response.result?.user;
          if (user) {
            this.applyUser(user);
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
    this.currentUserSignal.set(null);
    if (redirect) {
      this.router.navigate(['/login']);
    }
  }

  /**
   * Single source of truth for "a user just became active". Persists the
   * profile, broadcasts through the legacy Subjects AND the new signal.
   */
  private applyUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
    this.currentUserSignal.set(user);
    this.loggedIn.next(true);
  }

  updateCurrentUser(user: User): void {
    this.applyUser(user);
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

  /**
   * Rewrites backend-internal storage hosts (e.g. `minio:9000` inside docker)
   * to the host the browser can actually reach. Configured via
   * `environment.minioInternalHost` → `environment.minioPublicHost`.
   * Safe to call on any URL (returns as-is when nothing to rewrite).
   */
  formatAssetUrl(url: string | undefined | null): string {
    if (!url) return '';
    const { minioInternalHost, minioPublicHost } = environment;
    if (
      minioInternalHost &&
      minioPublicHost &&
      minioInternalHost !== minioPublicHost &&
      url.includes(minioInternalHost)
    ) {
      return url.replace(minioInternalHost, minioPublicHost);
    }
    return url;
  }

  /** @deprecated Use {@link formatAssetUrl}. Kept for source compatibility. */
  formatAvatarUrl(url: string | undefined): string {
    return this.formatAssetUrl(url);
  }

  // --- Role helpers -----------------------------------------------------

  /** Returns the effective roles of the current user. Handles both `roles[]`
   *  (new) and the deprecated single `role` field for backward compatibility. */
  getCurrentRoles(): string[] {
    const user = this.currentUserValue;
    if (!user) return [];
    if (user.roles && user.roles.length > 0) return user.roles;
    return user.role ? [user.role] : [];
  }

  hasRole(role: string): boolean {
    return this.getCurrentRoles().includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    if (roles.length === 0) return true;
    const current = this.getCurrentRoles();
    return roles.some((r) => current.includes(r));
  }

  // --- Password recovery ------------------------------------------------

  /** Request a password-reset email. Backend should always respond 200 even
   *  if the email is unknown, to avoid leaking account existence. */
  forgotPassword(email: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(
      `${this.apiUrl}/auth/forgot-password`,
      { email }
    );
  }

  /** Complete a password reset using the token sent to the user by email. */
  resetPassword(
    token: string,
    newPassword: string
  ): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(
      `${this.apiUrl}/auth/reset-password`,
      { token, newPassword }
    );
  }
}
