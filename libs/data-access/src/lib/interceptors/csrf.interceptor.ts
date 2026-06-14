import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/**
 * Attaches the CSRF double-submit header (X-XSRF-TOKEN = XSRF-TOKEN cookie) to
 * every request, explicitly — so it works even where Angular's built-in XSRF
 * interceptor would skip (e.g. absolute/cross-origin API URLs).
 *
 * Retry-once safety net: in the browser the FIRST mutating request of a session
 * can reach the BE without a valid X-XSRF-TOKEN (cookie read/attach timing), so
 * Spring's CsrfFilter returns 403 (body `{code:1012}`). The login-issued token
 * is itself valid (verified: a write that carries it returns 200), so we simply
 * re-read the cookie and replay the request once. Safe for every verb: a 403 is
 * rejected before any side-effect, so replaying a create/toggle is not a
 * double-write. A genuinely forbidden write just 403s again (one extra call).
 */
export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  const withToken = () => {
    const token = getCookie('XSRF-TOKEN');
    return token
      ? req.clone({ setHeaders: { 'X-XSRF-TOKEN': token } })
      : req;
  };

  const isMutating = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);

  return next(withToken()).pipe(
    catchError((error) => {
      // Replay exactly once (the replay has no catchError, so a 2nd 403 throws).
      if (isMutating && error?.status === 403) {
        return next(withToken());
      }
      return throwError(() => error);
    })
  );
};

function getCookie(name: string): string | null {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}
