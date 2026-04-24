import { HttpErrorResponse } from '@angular/common/http';

/**
 * Extracts a user-friendly message from any error thrown by an HTTP call.
 * Prefers the server-provided `message` field (ApiResponse shape),
 * falls back to provided default or a generic message.
 */
export function extractErrorMessage(
  err: unknown,
  fallback = 'Đã có lỗi xảy ra. Vui lòng thử lại.'
): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error;
    if (body && typeof body === 'object') {
      if (typeof body.message === 'string' && body.message) return body.message;
      if (typeof body.error === 'string' && body.error) return body.error;
    }
    if (err.status === 0) return 'Không thể kết nối tới máy chủ.';
  }
  return fallback;
}

/**
 * Returns true when a URL is safe to redirect to inside this SPA:
 * must start with `/` and not with `//` (protocol-relative).
 */
export function isSafeInternalUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.startsWith('/') && !url.startsWith('//');
}
