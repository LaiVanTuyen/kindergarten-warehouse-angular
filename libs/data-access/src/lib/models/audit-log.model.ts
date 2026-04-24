export interface AuditLog {
  id: number;
  action: string;
  username: string;
  target: string;
  detail: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface AuditLogFilter {
  action?: string;
  username?: string;
  startDate?: string; // yyyy-MM-dd
  endDate?: string; // yyyy-MM-dd
}
