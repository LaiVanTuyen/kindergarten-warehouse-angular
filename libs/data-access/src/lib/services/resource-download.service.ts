import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable, finalize, tap, throwError } from 'rxjs';
import type { Subscriber } from 'rxjs';
import { Resource } from '../models/resource.model';
import { ResourceService } from './resource.service';
import { ToastService } from './toast.service';

/**
 * Single implementation of "user clicked Download on a resource".
 * Replaces three copy-pasted blocks across home / resource-list / resource-detail.
 *
 * Responsibilities:
 *  - Hit `/resources/:id/file`, honour `Content-Disposition` for filename.
 *  - Trigger the browser save dialog by creating/revoking an object URL.
 *  - Bộ đếm lượt tải do backend tự tăng trong `/resources/:id/file`; frontend
 *    KHÔNG gọi thêm endpoint đếm nào nữa (xem ghi chú trong `download()`).
 *  - Fall back to opening `fileUrl` in a new tab if the blob request fails
 *    (e.g. CORS, external link, YouTube).
 *  - Toast a user-friendly error rather than console.error.
 */
@Injectable({ providedIn: 'root' })
export class ResourceDownloadService {
  private readonly resourceService = inject(ResourceService);
  private readonly toast = inject(ToastService);

  /**
   * Kicks off the download and returns an Observable that completes when the
   * file has been handed to the browser. Components usually ignore the return
   * value — it's provided for callers that want to show a per-item spinner.
   */
  download(resource: Pick<Resource, 'id' | 'title' | 'fileUrl'>): Observable<void> {
    if (!resource?.id) {
      return throwError(() => new Error('Thiếu id tài nguyên.'));
    }

    return new Observable<void>((subscriber) => {
      const sub = this.resourceService.downloadFile(resource.id).subscribe({
        next: (response) => {
          const filename = this.resolveFilename(response, resource);
          const blob = response.body;
          if (!blob) {
            this.openFallback(resource.fileUrl);
            subscriber.next();
            subscriber.complete();
            return;
          }
          this.triggerBrowserDownload(blob, filename);
          subscriber.next();
          subscriber.complete();
        },
        error: (err) => {
          void this.handleDownloadError(err, resource, subscriber);
        },
      });

      // Không bắn thêm lời gọi đếm nào ở đây. `GET /resources/:id/file` đã tăng
      // bộ đếm ở backend, nên gọi thêm `PUT /:id/download` (endpoint nay đã bị
      // bỏ) sẽ đếm hai lần cho mỗi lượt tải.

      return () => sub.unsubscribe();
    }).pipe(
      tap(() => this.toast.show('Đã tải tệp về máy.', 'success')),
      finalize(() => void 0)
    );
  }

  /**
   * Contract v1 §2.3: download errors are returned as `ApiResponse` JSON (even
   * though the success path is a binary stream, so the error body arrives as a
   * Blob). Parse it, then react by HTTP status:
   *  - 403 (6004): not the owner / not allowed — DO NOT fall back to the raw URL
   *    (it's a private MinIO object that would also 403).
   *  - 429 (6009): rate-limited — surface Retry-After if present.
   *  - 0 / CORS / external link: keep the open-in-new-tab fallback.
   */
  private async handleDownloadError(
    err: unknown,
    resource: Pick<Resource, 'fileUrl'>,
    subscriber: Subscriber<void>
  ): Promise<void> {
    const status = err instanceof HttpErrorResponse ? err.status : 0;

    if (status === 403) {
      const msg = await this.parseBlobError(err);
      this.toast.show(
        msg || 'Bạn không có quyền tải tệp này.',
        'error'
      );
      subscriber.error(err);
      return;
    }

    if (status === 429) {
      const retry =
        err instanceof HttpErrorResponse
          ? err.headers.get('Retry-After')
          : null;
      const suffix = retry ? ` Thử lại sau ${retry}s.` : '';
      this.toast.show(`Bạn thao tác quá nhanh.${suffix}`, 'error');
      subscriber.error(err);
      return;
    }

    // Network/CORS/external — fall back to opening the file URL directly.
    if (status === 0 && this.openFallback(resource.fileUrl)) {
      subscriber.next();
      subscriber.complete();
      return;
    }

    const msg = await this.parseBlobError(err);
    this.toast.show(msg || 'Không tải được tệp. Vui lòng thử lại sau.', 'error');
    subscriber.error(err);
  }

  /** Best-effort extraction of `message` from an ApiResponse blob error body. */
  private async parseBlobError(err: unknown): Promise<string | null> {
    if (!(err instanceof HttpErrorResponse)) return null;
    const body = err.error;
    try {
      if (body instanceof Blob) {
        const text = await body.text();
        return JSON.parse(text)?.message ?? null;
      }
      if (typeof body === 'string') return JSON.parse(body)?.message ?? null;
      if (body && typeof body === 'object') return (body as any).message ?? null;
    } catch {
      /* not JSON — ignore */
    }
    return null;
  }

  private resolveFilename(
    response: HttpResponse<Blob>,
    resource: Pick<Resource, 'title' | 'fileUrl'>
  ): string {
    const cd = response.headers.get('content-disposition');
    if (cd) {
      const utf8 = /filename\*=UTF-8''([^;]+)/.exec(cd);
      if (utf8?.[1]) return decodeURIComponent(utf8[1]);
      const fallback = /filename="?([^"]+)"?/.exec(cd);
      if (fallback?.[1]) return fallback[1];
    }
    const ext = resource.fileUrl?.split('.').pop()?.split('?')[0] || 'pdf';
    const safeTitle = (resource.title ?? 'tai-lieu').replace(/[\\/:*?"<>|]+/g, '-');
    return `${safeTitle}.${ext}`;
  }

  private triggerBrowserDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Defer revoke so Safari has time to commit the download.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private openFallback(fileUrl: string | undefined): boolean {
    if (!fileUrl) return false;
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
    return true;
  }
}
