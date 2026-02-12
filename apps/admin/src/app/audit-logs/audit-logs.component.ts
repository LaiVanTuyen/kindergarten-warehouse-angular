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

  actionOptions = [
    { label: 'Login', value: 'LOGIN' },
    { label: 'Create', value: 'CREATE' },
    { label: 'Update', value: 'UPDATE' },
    { label: 'Delete', value: 'DELETE' },
    { label: 'Restore', value: 'RESTORE' },
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
    const queryParams: any = {
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
        return 'bg-green-100 text-green-700 border-green-200';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'DELETE':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'RESTORE':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
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
