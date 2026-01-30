import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, EMPTY } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { ApiResponse } from '../models/api-response.model';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toastService = inject(ToastService);
  const authService = inject(AuthService);

  // 1. Always send Cookies (Credentials)
  const authReq = req.clone({
    withCredentials: true,
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const apiError = error.error as ApiResponse<any>;

      // CASE A: Login failed (401 on /auth/login)
      if (error.status === 401 && req.url.includes('/auth/login')) {
        return throwError(() => apiError);
      }

      // CASE B: Logout failed (401 on /auth/logout) -> Stop the loop!
      if (error.status === 401 && req.url.includes('/auth/logout')) {
        // Just clear local state and redirect to login
        localStorage.removeItem('user_profile');
        localStorage.removeItem('access_token');
        localStorage.removeItem('accessToken');
        router.navigate(['/login']);
        return EMPTY;
      }

      // CASE C: Token expired while using app (401 elsewhere)
      if (error.status === 401) {
        toastService.show('Session expired. Please login again.', 'error');
        // Clear user info and redirect
        authService.logout(undefined, false); // See updated AuthService
      }

      // Handle other errors (500 etc)
      // Don't show toast here - let components handle it via their error handlers
      // This prevents duplicate toasts
      if (error.status !== 401 && error.status !== 500) {
        const msg =
          error.error?.message ||
          error.message ||
          'An unexpected error occurred';
        toastService.show(msg, 'error');
      }

      return throwError(() => error);
    })
  );
};
