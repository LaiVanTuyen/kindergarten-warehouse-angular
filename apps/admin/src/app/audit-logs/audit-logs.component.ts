import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import {
  FormsModule,
  ReactiveFormsModule,
  FormControl,
  FormGroup,
} from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AuditLogService } from '@kindergarten-warehouse/data-access';
import { AuditLog, AuditLogFilter } from '@kindergarten-warehouse/data-access';
import { PaginationComponent } from '../shared/components/pagination/pagination.component';
import { MultiSelectFilterComponent } from '../shared/components/multi-select-filter/multi-select-filter.component';
import { BreadcrumbComponent } from '../shared/components/breadcrumb/breadcrumb.component';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { FormatTargetPipe } from '../shared/pipes/format-target.pipe';
import { FormatDetailPipe } from '../shared/pipes/format-detail.pipe';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    PaginationComponent,
    MultiSelectFilterComponent,
    BreadcrumbComponent,
    FormatTargetPipe,
    FormatDetailPipe,
  ],
  templateUrl: './audit-logs.component.html',
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
    `,
  ],
})
export class AuditLogsComponent implements OnInit {
  private auditLogService = inject(AuditLogService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Data State
  auditLogs = signal<AuditLog[]>([]);
  totalLogs = signal(0);
  loading = signal(false);

  // Pagination & Sort State
  currentPage = signal(1);
  pageSize = signal(10);
  sortDir = signal<'asc' | 'desc'>('desc');

  // Filter State
  filterForm = new FormGroup({
    username: new FormControl(''),
    startDate: new FormControl(''),
    endDate: new FormControl(''),
  });

  actionFilter = signal<Set<string>>(new Set());
  activeFilterDropdown = signal<string | null>(null);
  showFilters = signal(false);

  actionOptions = [
    {
      label: 'Đăng nhập',
      value: 'LOGIN',
      colorClass: 'text-purple-600',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>',
    },
    {
      label: 'Tạo mới',
      value: 'CREATE',
      colorClass: 'text-emerald-600',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
    },
    {
      label: 'Cập nhật',
      value: 'UPDATE',
      colorClass: 'text-blue-600',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>',
    },
    {
      label: 'Xóa',
      value: 'DELETE',
      colorClass: 'text-rose-600',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    },
    {
      label: 'Khôi phục',
      value: 'RESTORE',
      colorClass: 'text-emerald-600',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>',
    },
    {
      label: 'Phê duyệt',
      value: 'APPROVE',
      colorClass: 'text-emerald-600',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    },
    {
      label: 'Từ chối',
      value: 'REJECT',
      colorClass: 'text-rose-600',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    },
    {
      label: 'Di chuyển',
      value: 'MOVE',
      colorClass: 'text-amber-600',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="19 9 22 12 19 15"/><polyline points="9 19 12 22 15 19"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>',
    },
    {
      label: 'Phê duyệt hl',
      value: 'APPROVE_BULK',
      colorClass: 'text-emerald-600',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/><polyline points="16 4 6 14.01 3 11.01"/></svg>',
    },
    {
      label: 'Từ chối hl',
      value: 'REJECT_BULK',
      colorClass: 'text-rose-600',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="15" x2="9" y2="9"/></svg>',
    },
    {
      label: 'Xóa hàng loạt',
      value: 'DELETE_BULK',
      colorClass: 'text-rose-600',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>',
    },
    {
      label: 'Khôi phục hl',
      value: 'RESTORE_BULK',
      colorClass: 'text-emerald-600',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12h18"/></svg>',
    },
  ];

  // Modal State
  selectedLog = signal<AuditLog | null>(null);
  isModalOpen = signal(false);

  ngOnInit() {
    this.initFromUrl();

    // If no params, initial load done by initFromUrl -> loadLogs
    // If initFromUrl set params, it called loadLogs

    // Debounce filter changes
    this.filterForm.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(() => {
        this.currentPage.set(1);
        this.updateUrl();
        this.loadLogs();
      });
  }

  private initFromUrl() {
    const params = this.route.snapshot.queryParams;

    if (params['page']) this.currentPage.set(Number(params['page']));
    if (params['size']) this.pageSize.set(Number(params['size']));
    if (params['sortDir']) this.sortDir.set(params['sortDir']);

    if (params['username'])
      this.filterForm.patchValue(
        { username: params['username'] },
        { emitEvent: false }
      );
    if (params['startDate'])
      this.filterForm.patchValue(
        { startDate: params['startDate'] },
        { emitEvent: false }
      );
    if (params['endDate'])
      this.filterForm.patchValue(
        { endDate: params['endDate'] },
        { emitEvent: false }
      );

    if (params['action']) {
      const actions = params['action'].split(',');
      this.actionFilter.set(new Set(actions));
    }

    this.loadLogs();
  }

  updateUrl() {
    const queryParams: Record<string, string | number | null> = {
      page: this.currentPage(),
      size: this.pageSize(),
      sortDir: this.sortDir(),
    };

    const formVal = this.filterForm.getRawValue();
    if (formVal.username) queryParams['username'] = formVal.username;
    if (formVal.startDate) queryParams['startDate'] = formVal.startDate;
    if (formVal.endDate) queryParams['endDate'] = formVal.endDate;

    if (this.actionFilter().size > 0) {
      queryParams['action'] = Array.from(this.actionFilter()).join(',');
    } else {
      queryParams['action'] = null;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  loadLogs() {
    this.loading.set(true);
    const formVal = this.filterForm.getRawValue();

    const filters: AuditLogFilter = {
      action:
        this.actionFilter().size > 0
          ? Array.from(this.actionFilter()).join(',')
          : undefined,
      username: formVal.username || undefined,
      startDate: formVal.startDate || undefined,
      endDate: formVal.endDate || undefined,
    };

    this.auditLogService
      .getAuditLogs(
        this.currentPage(),
        this.pageSize(),
        filters,
        this.sortDir()
      )
      .subscribe({
        next: (res) => {
          if (res.code === 1000 && res.result) {
            this.auditLogs.set(res.result.content);
            this.totalLogs.set(res.result.totalElements);
          } else {
            this.auditLogs.set([]);
            this.totalLogs.set(0);
          }
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load logs', err);
          this.auditLogs.set([]);
          this.loading.set(false);
        },
      });
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.updateUrl();
    this.loadLogs();
  }

  onPageSizeChange(newSize: number) {
    this.pageSize.set(Number(newSize));
    this.currentPage.set(1);
    this.updateUrl();
    this.loadLogs();
  }

  toggleSort() {
    this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    this.updateUrl();
    this.loadLogs();
  }

  // Filter Helpers
  toggleFilterDropdown(key: string) {
    this.activeFilterDropdown.update((current) =>
      current === key ? null : key
    );
  }

  removeActionFilter(action: string) {
    const current = this.actionFilter();
    const newSet = new Set(current);
    newSet.delete(action);
    this.actionFilter.set(newSet);
    this.currentPage.set(1);
    this.updateUrl();
    this.loadLogs();
  }

  clearActionFilter() {
    this.actionFilter.set(new Set());
    this.currentPage.set(1);
    this.updateUrl();
    this.loadLogs();
  }

  resetFilters() {
    this.filterForm.reset({}, { emitEvent: false });
    this.actionFilter.set(new Set());
    this.currentPage.set(1);
    this.updateUrl();
    this.loadLogs();
  }

  // Helper Methods
  getActionColor(action: string): string {
    switch (action) {
      case 'LOGIN':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'CREATE':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'APPROVE':
      case 'APPROVE_BULK':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'REJECT':
      case 'REJECT_BULK':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'DELETE':
      case 'DELETE_BULK':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'RESTORE':
      case 'RESTORE_BULK':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'MOVE':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }

  formatActionText(action: string): string {
    if (!action) return '';
    return action
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  formatUserAgent(ua?: string): string {
    if (!ua) return 'Unknown';
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    return 'Other';
  }

  // Modal Actions
  openDetail(log: AuditLog) {
    this.selectedLog.set(log);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.selectedLog.set(null);
  }
}
