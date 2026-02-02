import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface AuditLog {
  id: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN';
  username: string;
  target: string;
  detail: string;
  timestamp: string;
}

const MOCK_LOGS: AuditLog[] = [
  {
    id: 1,
    action: 'DELETE',
    username: 'gv_lan',
    target: 'Lecture 1: Intro to Math',
    detail: 'Deleted resource from repository',
    timestamp: '2023-11-20T10:00:00',
  },
  {
    id: 2,
    action: 'UPDATE',
    username: 'admin',
    target: 'User: John Doe',
    detail: 'Changed role from USER to TEACHER',
    timestamp: '2023-11-20T09:45:00',
  },
  {
    id: 3,
    action: 'LOGIN',
    username: 'parent_sarah',
    target: 'System',
    detail: 'Successful login via Email',
    timestamp: '2023-11-20T08:30:00',
  },
  {
    id: 4,
    action: 'CREATE',
    username: 'gv_lan',
    target: 'Assignment: Drawing',
    detail: 'Created new assignment in Art category',
    timestamp: '2023-11-19T14:20:00',
  },
  {
    id: 5,
    action: 'UPDATE',
    username: 'admin',
    target: 'Resource: Zoo Trip Video',
    detail: 'Approved resource status (Pending -> Approved)',
    timestamp: '2023-11-19T11:15:00',
  },
  {
    id: 6,
    action: 'DELETE',
    username: 'admin',
    target: 'User: spam_bot',
    detail: 'Permanent deletion of user account',
    timestamp: '2023-11-18T16:50:00',
  },
];

@Injectable({
  providedIn: 'root',
})
export class AuditLogService {
  getAuditLogs(): Observable<AuditLog[]> {
    return of(MOCK_LOGS).pipe(delay(500)); // Simulate network latency
  }
}
