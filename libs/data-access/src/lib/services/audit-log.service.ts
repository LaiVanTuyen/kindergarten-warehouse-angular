import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../tokens';
import { AuditLog, AuditLogFilter } from '../models/audit-log.model';
import { ApiResponse, Page } from '../models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class AuditLogService {
  private http = inject(HttpClient);
  private apiUrl = inject(API_URL);

  getAuditLogs(
    page: number,
    limit: number,
    filters: AuditLogFilter = {},
    sortDir: 'asc' | 'desc' = 'desc'
  ): Observable<ApiResponse<Page<AuditLog>>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', limit)
      .set('sortDir', sortDir);

    if (filters.action && filters.action !== 'ALL') {
      params = params.set('action', filters.action);
    }
    if (filters.username) {
      params = params.set('username', filters.username);
    }
    if (filters.startDate) {
      params = params.set('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params = params.set('endDate', filters.endDate);
    }

    return this.http.get<ApiResponse<Page<AuditLog>>>(
      `${this.apiUrl}/audit-logs`,
      {
        params,
        withCredentials: true,
      }
    );
  }
}
