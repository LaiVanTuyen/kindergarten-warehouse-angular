import { Injectable, inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';
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
 *  - Fire `/resources/:id/download` so stats stay accurate.
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
          if (this.openFallback(resource.fileUrl)) {
            subscriber.next();
            subscriber.complete();
          } else {
            this.toast.show(
              'Không tải được tệp. Vui lòng thử lại sau.',
              'error'
            );
            subscriber.error(err);
          }
        },
      });

      // Fire-and-forget counter update — doesn't block UX.
      this.resourceService
        .incrementDownloadCount(resource.id)
        .pipe(
          catchError(() => {
            // Counter failing is not user-facing.
            return [];
          })
        )
        .subscribe();

      return () => sub.unsubscribe();
    }).pipe(
      tap(() => this.toast.show('Đã tải tệp về máy.', 'success')),
      finalize(() => void 0)
    );
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
