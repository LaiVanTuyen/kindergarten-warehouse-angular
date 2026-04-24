import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import {
  ActivityItem,
  DashboardPeriod,
  DashboardPeriodRange,
  DashboardStats,
  PendingResource,
  TopResource,
  TopTeacher,
  TopicDistribution,
  TrendSeries,
} from '../models/dashboard.model';

/**
 * DashboardService — currently backed by in-memory mock data to unblock UI work
 * while the backend team ships the real endpoints. Swap each `of(...)` for
 * `this.http.get(...)` once the API is ready; the component layer will not
 * need to change.
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly latency = 250; // ms — tiny delay so skeletons are visible

  // ------- Stats (4 KPI cards) --------------------------------------------

  getStats(
    period: DashboardPeriod,
    _range?: DashboardPeriodRange
  ): Observable<DashboardStats> {
    return of(STATS_BY_PERIOD[period]).pipe(delay(this.latency));
  }

  // ------- Trend (line charts) --------------------------------------------

  getTrend(
    period: DashboardPeriod,
    _range?: DashboardPeriodRange
  ): Observable<TrendSeries> {
    return of(TREND_BY_PERIOD[period]).pipe(delay(this.latency));
  }

  // ------- Moderation queue -----------------------------------------------

  getPending(limit = 5): Observable<PendingResource[]> {
    return of(MOCK_PENDING.slice(0, limit)).pipe(delay(this.latency));
  }

  approveResource(id: number): Observable<void> {
    const idx = MOCK_PENDING.findIndex((p) => p.id === id);
    if (idx >= 0) MOCK_PENDING.splice(idx, 1);
    return of(void 0).pipe(delay(this.latency));
  }

  rejectResource(id: number, _reason: string): Observable<void> {
    const idx = MOCK_PENDING.findIndex((p) => p.id === id);
    if (idx >= 0) MOCK_PENDING.splice(idx, 1);
    return of(void 0).pipe(delay(this.latency));
  }

  // ------- Insight widgets ------------------------------------------------

  getTopResources(
    _period: DashboardPeriod,
    limit = 5
  ): Observable<TopResource[]> {
    return of(MOCK_TOP_RESOURCES.slice(0, limit)).pipe(delay(this.latency));
  }

  getTopTeachers(
    _period: DashboardPeriod,
    limit = 5
  ): Observable<TopTeacher[]> {
    return of(MOCK_TOP_TEACHERS.slice(0, limit)).pipe(delay(this.latency));
  }

  getTopicDistribution(
    _period: DashboardPeriod
  ): Observable<TopicDistribution[]> {
    return of(MOCK_TOPIC_DISTRIBUTION).pipe(delay(this.latency));
  }

  getRecentActivity(limit = 8): Observable<ActivityItem[]> {
    return of(MOCK_ACTIVITY.slice(0, limit)).pipe(delay(this.latency));
  }
}

// ============== MOCK DATA ===================================================
// Grouped at the bottom so swapping to HTTP is a pure deletion.

const STATS_BY_PERIOD: Record<DashboardPeriod, DashboardStats> = {
  last_7_days: {
    totalResources: 42,
    totalViews: 2180,
    totalUsers: 18,
    pendingApprovals: 8,
    trendPct: { resources: 14.3, views: 9.7, users: 22.1 },
  },
  this_month: {
    totalResources: 118,
    totalViews: 16780,
    totalUsers: 52,
    pendingApprovals: 8,
    trendPct: { resources: 11.2, views: 6.4, users: 18.9 },
  },
  this_year: {
    totalResources: 842,
    totalViews: 187420,
    totalUsers: 326,
    pendingApprovals: 8,
    trendPct: { resources: 23.5, views: 18.2, users: 34.0 },
  },
  custom: {
    totalResources: 56,
    totalViews: 5900,
    totalUsers: 21,
    pendingApprovals: 8,
    trendPct: { resources: 4.2, views: -2.1, users: 7.8 },
  },
};

const TREND_BY_PERIOD: Record<DashboardPeriod, TrendSeries> = {
  last_7_days: {
    xAxis: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
    resources: [5, 8, 3, 12, 6, 9, 7],
    views: [150, 230, 220, 180, 260, 310, 290],
    users: [2, 1, 4, 3, 5, 4, 6],
  },
  this_month: {
    xAxis: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'],
    resources: [18, 25, 32, 43],
    views: [3200, 4100, 3800, 5600],
    users: [8, 12, 10, 15],
  },
  this_year: {
    xAxis: [
      'Th.1',
      'Th.2',
      'Th.3',
      'Th.4',
      'Th.5',
      'Th.6',
      'Th.7',
      'Th.8',
      'Th.9',
      'Th.10',
      'Th.11',
      'Th.12',
    ],
    resources: [15, 20, 25, 18, 22, 30, 35, 28, 40, 45, 50, 55],
    views: [
      800, 1200, 1100, 1600, 2200, 2000, 3500, 3100, 4000, 4500, 5200, 5800,
    ],
    users: [5, 8, 12, 15, 18, 22, 28, 32, 38, 45, 50, 60],
  },
  custom: {
    xAxis: ['Ngày 1', 'Ngày 2', 'Ngày 3', 'Ngày 4', 'Ngày 5'],
    resources: [5, 10, 8, 15, 12],
    views: [800, 1200, 1100, 1500, 1300],
    users: [2, 4, 3, 6, 5],
  },
};

const MOCK_PENDING: PendingResource[] = [
  {
    id: 1,
    title: 'Bảng chữ cái tiếng Việt cho bé',
    uploader: 'Cô Nguyễn Ngọc Lan',
    uploaderAvatarUrl: '',
    thumbnailUrl: '',
    topic: 'Ngôn ngữ',
    submittedAt: isoDaysAgo(0, 2),
  },
  {
    id: 2,
    title: 'Đếm số từ 1 đến 20 qua bài hát',
    uploader: 'Thầy Trần Văn Minh',
    thumbnailUrl: '',
    topic: 'Toán sớm',
    submittedAt: isoDaysAgo(0, 5),
  },
  {
    id: 3,
    title: 'Màu sắc và hình khối cơ bản',
    uploader: 'Cô Phạm Thu Hà',
    thumbnailUrl: '',
    topic: 'Nghệ thuật',
    submittedAt: isoDaysAgo(1, 3),
  },
  {
    id: 4,
    title: 'Khám phá động vật trong rừng',
    uploader: 'Cô Lê Minh Châu',
    thumbnailUrl: '',
    topic: 'Khám phá khoa học',
    submittedAt: isoDaysAgo(1, 8),
  },
  {
    id: 5,
    title: 'Kể chuyện cổ tích Tấm Cám',
    uploader: 'Cô Đỗ Thu Hiền',
    thumbnailUrl: '',
    topic: 'Văn học',
    submittedAt: isoDaysAgo(2, 1),
  },
];

const MOCK_TOP_RESOURCES: TopResource[] = [
  {
    id: 101,
    title: 'Bé học đếm với con vật',
    topic: 'Toán sớm',
    views: 8420,
    thumbnailUrl: '',
  },
  {
    id: 102,
    title: 'Bài hát chữ cái ABC vui nhộn',
    topic: 'Ngôn ngữ',
    views: 7310,
    thumbnailUrl: '',
  },
  {
    id: 103,
    title: 'Tô màu hình khối cơ bản',
    topic: 'Nghệ thuật',
    views: 6280,
    thumbnailUrl: '',
  },
  {
    id: 104,
    title: 'Chuyện kể trước giờ ngủ',
    topic: 'Văn học',
    views: 5920,
    thumbnailUrl: '',
  },
  {
    id: 105,
    title: 'Vận động theo nhịp điệu',
    topic: 'Thể chất',
    views: 4870,
    thumbnailUrl: '',
  },
];

const MOCK_TOP_TEACHERS: TopTeacher[] = [
  { id: 201, fullName: 'Cô Nguyễn Ngọc Lan', avatarUrl: '', uploadCount: 42 },
  { id: 202, fullName: 'Thầy Trần Văn Minh', avatarUrl: '', uploadCount: 38 },
  { id: 203, fullName: 'Cô Phạm Thu Hà', avatarUrl: '', uploadCount: 29 },
  { id: 204, fullName: 'Cô Lê Minh Châu', avatarUrl: '', uploadCount: 25 },
  { id: 205, fullName: 'Cô Đỗ Thu Hiền', avatarUrl: '', uploadCount: 21 },
];

const MOCK_TOPIC_DISTRIBUTION: TopicDistribution[] = [
  { topic: 'Ngôn ngữ', count: 186, color: '#FB7185' },
  { topic: 'Toán sớm', count: 142, color: '#FBBF24' },
  { topic: 'Khám phá khoa học', count: 128, color: '#34D399' },
  { topic: 'Nghệ thuật', count: 110, color: '#60A5FA' },
  { topic: 'Thể chất', count: 94, color: '#C4B5FD' },
  { topic: 'Văn học', count: 78, color: '#F472B6' },
];

const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: 1,
    actor: 'Admin',
    action: 'APPROVE',
    target: 'Tài nguyên "Bé học đếm"',
    timestamp: isoMinutesAgo(4),
  },
  {
    id: 2,
    actor: 'Cô Nguyễn Ngọc Lan',
    action: 'UPLOAD',
    target: '"Bảng chữ cái tiếng Việt"',
    timestamp: isoMinutesAgo(18),
  },
  {
    id: 3,
    actor: 'Thầy Trần Văn Minh',
    action: 'UPLOAD',
    target: '"Đếm số từ 1 đến 20"',
    timestamp: isoMinutesAgo(42),
  },
  {
    id: 4,
    actor: 'Admin',
    action: 'REJECT',
    target: 'Tài nguyên "Thử nghiệm"',
    timestamp: isoMinutesAgo(90),
  },
  {
    id: 5,
    actor: 'Cô Phạm Thu Hà',
    action: 'UPDATE',
    target: 'Hồ sơ cá nhân',
    timestamp: isoMinutesAgo(150),
  },
  {
    id: 6,
    actor: 'Admin',
    action: 'UPLOAD',
    target: 'Banner "Tết Trung Thu"',
    timestamp: isoMinutesAgo(240),
  },
  {
    id: 7,
    actor: 'Cô Đỗ Thu Hiền',
    action: 'LOGIN',
    target: 'đã đăng nhập',
    timestamp: isoMinutesAgo(360),
  },
  {
    id: 8,
    actor: 'Admin',
    action: 'DELETE',
    target: 'Chủ đề "Test"',
    timestamp: isoMinutesAgo(720),
  },
];

function isoDaysAgo(days: number, hours = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

function isoMinutesAgo(minutes: number): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - minutes);
  return d.toISOString();
}
