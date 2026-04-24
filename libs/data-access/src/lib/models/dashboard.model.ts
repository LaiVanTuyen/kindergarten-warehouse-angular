export type DashboardPeriod =
  | 'last_7_days'
  | 'this_month'
  | 'this_year'
  | 'custom';

export interface DashboardPeriodRange {
  startDate?: string; // ISO yyyy-MM-dd, used when period === 'custom'
  endDate?: string;
}

export interface DashboardStats {
  totalResources: number;
  totalViews: number;
  totalUsers: number;
  pendingApprovals: number;
  trendPct: {
    resources: number;
    views: number;
    users: number;
  };
}

export interface TrendSeries {
  xAxis: string[];
  resources: number[];
  views: number[];
  users: number[];
}

export interface PendingResource {
  id: number;
  title: string;
  uploader: string;
  uploaderAvatarUrl?: string;
  thumbnailUrl?: string;
  topic?: string;
  submittedAt: string;
}

export interface TopResource {
  id: number;
  title: string;
  topic: string;
  views: number;
  thumbnailUrl?: string;
}

export interface TopTeacher {
  id: number;
  fullName: string;
  avatarUrl?: string;
  uploadCount: number;
}

export interface TopicDistribution {
  topic: string;
  count: number;
  color?: string;
}

export type ActivityAction =
  | 'UPLOAD'
  | 'APPROVE'
  | 'REJECT'
  | 'DELETE'
  | 'UPDATE'
  | 'LOGIN';

export interface ActivityItem {
  id: number;
  actor: string;
  actorAvatarUrl?: string;
  action: ActivityAction;
  target: string;
  timestamp: string;
}
