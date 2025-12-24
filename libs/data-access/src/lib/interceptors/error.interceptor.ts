import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from '../services/toast.service';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toastService = inject(ToastService);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Unauthorized: Logout and redirect
        authService.logout();
        router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
        toastService.show('Session expired. Please login again.', 'error');
      } else if (error.status === 500) {
        // Server Error
        toastService.show('System is busy. Please try again later.', 'error');
      } else {
        // Other errors
        toastService.show(
          error.message || 'An unexpected error occurred',
          'error'
        );
      }
      return throwError(() => error);
    })
  );
};
