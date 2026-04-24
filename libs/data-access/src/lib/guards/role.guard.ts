import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

/**
 * Factory for a CanActivate guard that allows a route only for users holding
 * at least one of the given roles. Usage:
 *
 *   { path: '...', canActivate: [roleGuard('ADMIN')], ... }
 *
 * Not logged-in users are redirected to /login with a returnUrl param.
 * Logged-in users without the required role are logged out and bounced to /login.
 */
export function roleGuard(...requiredRoles: string[]): CanActivateFn {
  return (_route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const toast = inject(ToastService);

    if (!authService.isLoggedIn()) {
      return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url },
      });
    }

    if (requiredRoles.length === 0 || authService.hasAnyRole(requiredRoles)) {
      return true;
    }

    toast.show('Bạn không đủ quyền truy cập khu vực này.', 'error');
    authService.logout(undefined, false);
    return router.createUrlTree(['/login']);
  };
}
