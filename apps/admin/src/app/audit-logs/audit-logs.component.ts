import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AuditLog,
  AuditLogFilter,
  AuditLogService,
  ToastService,
  downloadCsv,
} from '@kindergarten-warehouse/data-access';
import { PageHeaderComponent } from '../shared/components/page-header/page-header.component';
import { StatusPillComponent, StatusPillTone } from '../shared/components/status-pill/status-pill.component';
import { SearchInputComponent } from '../shared/components/search-input/search-input.component';
import { EmptyStateComponent } from '../shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '../shared/components/pagination/pagination.component';
import { DrawerComponent } from '../shared/components/drawer/drawer.component';
import { handleHttpError } from '../shared/utils/rx-operators';
import { setupUrlSync } from '../shared/utils/url-sync';

const ACTION_TONES: Record<string, StatusPillTone> = {
  LOGIN: 'teacher',
  LOGOUT: 'neutral',
  CREATE: 'approved',
  UPDATE: 'pending',
  DELETE: 'rejected',
  APPROVE: 'approved',
  REJECT: 'rejected',
  UPLOAD: 'teacher',
  RESTORE: 'active',
  BLOCK: 'rejected',
};

const ACTION_LABELS: Record<string, string> = {
  LOGIN: 'Đăng nhập',
  LOGOUT: 'Đăng xuất',
  CREATE: 'Tạo',
  UPDATE: 'Cập nhật',
  DELETE: 'Xoá',
  APPROVE: 'Duyệt',
  REJECT: 'Từ chối',
  UPLOAD: 'Tải lên',
  RESTORE: 'Khôi phục',
  BLOCK: 'Khoá',
};

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    PageHeaderComponent,
    StatusPillComponent,
    SearchInputComponent,
    EmptyStateComponent,
    PaginationComponent,
    DrawerComponent,
  ],
  templateUrl: './audit-logs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLogsComponent {
  private service = inject(AuditLogService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly isLoading = signal(true);
  readonly isExporting = signal(false);
  readonly logs = signal<AuditLog[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly selectedLog = signal<AuditLog | null>(null);

  readonly username = signal('');
  readonly action = signal<string>('');
  readonly startDate = signal<string>('');
  readonly endDate = signal<string>('');
  readonly sortDir = signal<'asc' | 'desc'>('desc');

  readonly actionOptions = [
    { value: '', label: 'Tất cả hành động' },
    { value: 'LOGIN', label: 'Đăng nhập' },
    { value: 'LOGOUT', label: 'Đăng xuất' },
    { value: 'CREATE', label: 'Tạo' },
    { value: 'UPDATE', label: 'Cập nhật' },
    { value: 'DELETE', label: 'Xoá' },
    { value: 'APPROVE', label: 'Duyệt' },
    { value: 'REJECT', label: 'Từ chối' },
    { value: 'UPLOAD', label: 'Tải lên' },
    { value: 'RESTORE', label: 'Khôi phục' },
    { value: 'BLOCK', label: 'Khoá' },
  ];

  readonly hasFilters = computed(
    () =>
      !!(
        this.username() ||
        this.action() ||
        this.startDate() ||
        this.endDate()
      )
  );

  constructor() {
    setupUrlSync({
      fields: {
        u: this.username,
        action: this.action,
        from: this.startDate,
        to: this.endDate,
        dir: this.sortDir,
        page: this.page,
      },
      skipValues: [''],
      router: this.router,
      route: this.route,
    });

    // Filter change resets page and reloads, untracked to avoid loop.
    effect(() => {
      this.username();
      this.action();
      this.startDate();
      this.endDate();
      this.sortDir();
      untracked(() => {
        this.page.set(1);
        this.load();
      });
    });
  }

  load() {
    this.isLoading.set(true);
    const filters: AuditLogFilter = {
      username: this.username() || undefined,
      action: this.action() || undefined,
      startDate: this.startDate() || undefined,
      endDate: this.endDate() || undefined,
    };
    this.service
      .getAuditLogs(this.page(), this.pageSize(), filters, this.sortDir())
      .pipe(
        handleHttpError(this.toast, 'Không tải được nhật ký.'),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        this.logs.set(res.result?.content || []);
        this.total.set(res.result?.totalElements || 0);
        this.isLoading.set(false);
      });
  }

  onPageChange(p: number) {
    this.page.set(p);
    this.load();
  }

  toggleSortDir() {
    this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
  }

  resetFilters() {
    this.username.set('');
    this.action.set('');
    this.startDate.set('');
    this.endDate.set('');
  }

  openDetail(log: AuditLog) {
    this.selectedLog.set(log);
  }

  closeDetail() {
    this.selectedLog.set(null);
  }

  actionTone(action: string): StatusPillTone {
    return ACTION_TONES[action] ?? 'neutral';
  }
  actionLabel(action: string): string {
    return ACTION_LABELS[action] ?? action;
  }

  /**
   * Export the currently-filtered result set (respecting filters but ignoring
   * pagination; we refetch with a large page size so the export matches what
   * the user sees).
   */
  exportCsv() {
    this.isExporting.set(true);
    const filters: AuditLogFilter = {
      username: this.username() || undefined,
      action: this.action() || undefined,
      startDate: this.startDate() || undefined,
      endDate: this.endDate() || undefined,
    };
    this.service
      .getAuditLogs(1, 10_000, filters, this.sortDir())
      .pipe(
        handleHttpError(this.toast, 'Không xuất được file.'),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        const rows = (res.result?.content || []).map((log) => ({
          'Thời gian': log.timestamp,
          'Người dùng': log.username,
          'Hành động': this.actionLabel(log.action),
          'Mã hành động': log.action,
          'Đối tượng': log.target,
          'Địa chỉ IP': log.ipAddress ?? '',
          'Chi tiết': log.detail ?? '',
        }));
        const stamp = new Date().toISOString().slice(0, 10);
        downloadCsv(`audit-logs-${stamp}.csv`, rows);
        this.isExporting.set(false);
        this.toast.show(`Đã xuất ${rows.length} dòng.`, 'success');
      });
  }
}
