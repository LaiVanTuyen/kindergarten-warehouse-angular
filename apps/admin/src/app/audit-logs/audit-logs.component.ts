import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  switchMap,
  tap,
} from 'rxjs/operators';
import { combineLatest, timer } from 'rxjs';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AuditLogService, AuditLog } from '@kindergarten-warehouse/data-access';
import { PaginationComponent } from '../shared/components/pagination/pagination.component';
import { SkeletonTableComponent } from '../shared/components/skeleton-table/skeleton-table.component';
import { BreadcrumbComponent } from '../shared/components/breadcrumb/breadcrumb.component';
import { EmptyStateComponent } from '../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PaginationComponent,
    SkeletonTableComponent,
    BreadcrumbComponent,
    EmptyStateComponent,
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
export class AuditLogsComponent {
  auditLogService = inject(AuditLogService);

  // Data Signals
  allLogs = signal<AuditLog[]>([]);
  isLoading = signal(false);

  // Filter Controls
  searchControl = new FormControl('');
  actionControl = new FormControl('ALL');

  // Filter State
  searchQuery = signal('');
  actionFilter = signal<'ALL' | 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN'>(
    'ALL'
  );

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);

  constructor() {
    this.loadLogs();

    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((val) => {
        this.searchQuery.set(val || '');
        this.currentPage.set(1);
      });

    this.actionControl.valueChanges.subscribe((val) => {
      this.actionFilter.set(
        (val as 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'ALL') || 'ALL'
      );
      this.currentPage.set(1);
    });
  }

  loadLogs() {
    this.isLoading.set(true);
    // Initial fetch might be slow, so we set loading true.
    // However, the pipeline below will also trigger loading when allLogs updates.
    this.auditLogService.getAuditLogs().subscribe((logs) => {
      this.allLogs.set(logs);
      // The pipeline below will pick this up.
    });
  }

  // Reactive Filtering Pipeline
  private filterState$ = combineLatest([
    toObservable(this.allLogs),
    toObservable(this.searchQuery),
    toObservable(this.actionFilter),
  ]).pipe(
    tap(() => this.isLoading.set(true)),
    switchMap(([logs, queryRaw, action]) => {
      return timer(500).pipe(
        // Mock Delay
        map(() => {
          let res = logs;

          // 1. Search
          const query = queryRaw.toLowerCase();
          if (query) {
            res = res.filter(
              (log) =>
                log.username.toLowerCase().includes(query) ||
                log.target.toLowerCase().includes(query) ||
                log.detail.toLowerCase().includes(query)
            );
          }

          // 2. Action Filter
          if (action !== 'ALL') {
            res = res.filter((log) => log.action === action);
          }

          // Sort by Date Descending
          return res.sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        }),
        tap(() => this.isLoading.set(false))
      );
    })
  );

  filteredLogs = toSignal(this.filterState$, { initialValue: [] });

  // Computed Pagination Helpers
  paginatedLogs = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredLogs().slice(start, start + this.pageSize());
  });

  totalLogs = computed(() => this.filteredLogs().length);

  onPageChange(page: number) {
    this.currentPage.set(page);
  }

  resetFilters() {
    this.searchControl.setValue('');
    this.actionControl.setValue('ALL');
  }

  // Helper for Template
  Math = Math;
}
