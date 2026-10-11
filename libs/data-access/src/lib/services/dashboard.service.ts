import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_URL } from '../tokens';
import { DashboardStats, TrendSeries, PendingResource, TopResource, TopTeacher, TopicDistribution, ActivityItem, DashboardPeriod, DashboardPeriodRange } from '../models/dashboard.model';
export interface DashboardData {
  stats: DashboardStats; trend: TrendSeries; pending: PendingResource[];
  topResources: TopResource[]; topTeachers: TopTeacher[]; topicDistribution: TopicDistribution[]; activity: ActivityItem[];
}
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);
  getDashboard(period: DashboardPeriod, range?: DashboardPeriodRange): Observable<DashboardData> {
    let params = new HttpParams().set('period', period);
    if (period === 'custom') params = params.set('startDate', range?.startDate ?? '').set('endDate', range?.endDate ?? '');
    return this.http.get<{result: DashboardData}>(`${this.apiUrl}/admin/dashboard`, {params}).pipe(map(r => r.result));
  }
  approveResource(id: string): Observable<void> {
    return this.http.patch(`${this.apiUrl}/admin/resources/${id}/approve`, {}).pipe(map(() => undefined));
  }
  rejectResource(id: string, reason: string): Observable<void> {
    return this.http.patch(`${this.apiUrl}/admin/resources/${id}/reject`, {reason}).pipe(map(() => undefined));
  }
}
