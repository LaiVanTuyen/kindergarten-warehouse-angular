import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
    action: new FormControl('ALL'),
    username: new FormControl(''),
    startDate: new FormControl(''),
    endDate: new FormControl(''),
  });

  // Modal State
  selectedLog = signal<AuditLog | null>(null);
  isModalOpen = signal(false);

  ngOnInit() {
    this.loadLogs();

    // Debounce filter changes
    this.filterForm.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(() => {
        this.currentPage.set(1);
        this.loadLogs();
      });
  }

  loadLogs() {
    this.loading.set(true);
    const filters: AuditLogFilter = {
      action: this.filterForm.value.action?.toString() || undefined,
      username: this.filterForm.value.username?.toString() || undefined,
      startDate: this.filterForm.value.startDate?.toString() || undefined,
      endDate: this.filterForm.value.endDate?.toString() || undefined,
    };

    // Clean up empty filters
    if (filters.action === 'ALL') delete filters.action;
    if (!filters.username) delete filters.username;
    if (!filters.startDate) delete filters.startDate;
    if (!filters.endDate) delete filters.endDate;

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
    this.loadLogs();
  }

  onPageSizeChange(newSize: number) {
    this.pageSize.set(Number(newSize));
    this.currentPage.set(1);
    this.loadLogs();
  }

  toggleSort() {
    this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
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
