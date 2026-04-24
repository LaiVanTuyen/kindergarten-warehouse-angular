import { HttpErrorResponse } from '@angular/common/http';
import { EMPTY, MonoTypeOperatorFunction } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastService } from '../services/toast.service';
import { extractErrorMessage } from './api-error.util';

/**
 * RxJS operator that surfaces HTTP errors via the global toast and swallows
 * them downstream. Use on read/write calls where the caller only needs to
 * react to success:
 *
 *   this.service.create(x)
 *     .pipe(
 *       handleHttpError(this.toast, 'Không tạo được banner.'),
 *       takeUntilDestroyed(this.destroyRef),
 *     )
 *     .subscribe(() => this.reload());
 *
 * Lives in `data-access` so both the admin app and the portal can share it.
 */
export function handleHttpError<T>(
  toast: ToastService,
  fallback = 'Đã có lỗi xảy ra.'
): MonoTypeOperatorFunction<T> {
  return (source$) =>
    source$.pipe(
      catchError((err: HttpErrorResponse | unknown) => {
        toast.show(extractErrorMessage(err, fallback), 'error');
        return EMPTY;
      })
    );
}
