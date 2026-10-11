import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_URL } from '../tokens';
import {
  PaginatedResponse,
  Resource,
  RestResponse,
} from '../models/resource.model';

export interface AuthorProfile {
  id: number;
  fullName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  joinedAt?: string | null;
  resourceCount: number;
  totalViews: number;
  totalDownloads: number;
}

export interface TagCount {
  tag: string;
  count: number;
}

export interface DownloadHistoryItem {
  resource: Resource;
  downloadCount: number;
  lastDownloadedAt: string;
}

export type ReportReason =
  | 'COPYRIGHT'
  | 'INAPPROPRIATE'
  | 'WRONG_INFO'
  | 'BROKEN_FILE'
  | 'SPAM'
  | 'OTHER';

export type ReportStatus = 'OPEN' | 'RESOLVED' | 'DISMISSED';

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  COPYRIGHT: 'Vi phạm bản quyền',
  INAPPROPRIATE: 'Nội dung không phù hợp với trẻ',
  WRONG_INFO: 'Thông tin sai lệch',
  BROKEN_FILE: 'Tệp lỗi / không mở được',
  SPAM: 'Spam / quảng cáo',
  OTHER: 'Lý do khác',
};

export interface ResourceReport {
  id: number;
  resourceId: string;
  resourceTitle: string;
  resourceSlug: string;
  reporterId: number;
  reporterName: string;
  reason: ReportReason;
  details?: string | null;
  status: ReportStatus;
  resolutionNote?: string | null;
  resolvedByName?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
}

export interface AppNotification {
  id: number;
  type: 'RESOURCE_APPROVED' | 'RESOURCE_REJECTED' | 'REPORT_RESOLVED' | 'REPORT_DISMISSED';
  title: string;
  message?: string | null;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

const unwrap = <T>(res: RestResponse<T>): T => (res.result ?? res.data) as T;

/** Author pages, tag cloud and per-user download history. */
@Injectable({ providedIn: 'root' })
export class DiscoveryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  getAuthor(id: number | string): Observable<AuthorProfile> {
    return this.http
      .get<RestResponse<AuthorProfile>>(`${this.apiUrl}/authors/${id}`)
      .pipe(map(unwrap));
  }

  getPopularTags(limit = 20): Observable<TagCount[]> {
    return this.http
      .get<RestResponse<TagCount[]>>(`${this.apiUrl}/tags/popular`, {
        params: new HttpParams().set('limit', limit),
      })
      .pipe(map((res) => unwrap(res) ?? []));
  }

  /** `page` is 1-based like the rest of the Portal. */
  getMyDownloads(page = 1, size = 10): Observable<PaginatedResponse<DownloadHistoryItem>> {
    return this.http
      .get<RestResponse<PaginatedResponse<DownloadHistoryItem>>>(`${this.apiUrl}/downloads/me`, {
        params: new HttpParams().set('page', page - 1).set('size', size),
      })
      .pipe(map(unwrap));
  }
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  create(resourceId: string, reason: ReportReason, details?: string): Observable<ResourceReport> {
    return this.http
      .post<RestResponse<ResourceReport>>(`${this.apiUrl}/reports`, { resourceId, reason, details })
      .pipe(map(unwrap));
  }

  /** Admin. `page` is 1-based. */
  search(status: ReportStatus | '' , page = 1, size = 20): Observable<PaginatedResponse<ResourceReport>> {
    let params = new HttpParams().set('page', page - 1).set('size', size);
    if (status) params = params.set('status', status);
    return this.http
      .get<RestResponse<PaginatedResponse<ResourceReport>>>(`${this.apiUrl}/admin/reports`, { params })
      .pipe(map(unwrap));
  }

  openCount(): Observable<number> {
    return this.http
      .get<RestResponse<{ count: number }>>(`${this.apiUrl}/admin/reports/open-count`)
      .pipe(map((res) => unwrap(res)?.count ?? 0));
  }

  resolve(
    id: number,
    action: 'RESOLVE' | 'DISMISS',
    note: string,
    hideResource: boolean
  ): Observable<ResourceReport> {
    return this.http
      .patch<RestResponse<ResourceReport>>(`${this.apiUrl}/admin/reports/${id}`, {
        action,
        note,
        hideResource,
      })
      .pipe(map(unwrap));
  }
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  list(page = 1, size = 10): Observable<PaginatedResponse<AppNotification>> {
    return this.http
      .get<RestResponse<PaginatedResponse<AppNotification>>>(`${this.apiUrl}/notifications`, {
        params: new HttpParams().set('page', page - 1).set('size', size),
      })
      .pipe(map(unwrap));
  }

  unreadCount(): Observable<number> {
    return this.http
      .get<RestResponse<{ count: number }>>(`${this.apiUrl}/notifications/unread-count`)
      .pipe(map((res) => unwrap(res)?.count ?? 0));
  }

  markRead(id: number): Observable<unknown> {
    return this.http.patch(`${this.apiUrl}/notifications/${id}/read`, {});
  }

  markAllRead(): Observable<unknown> {
    return this.http.patch(`${this.apiUrl}/notifications/read-all`, {});
  }
}
