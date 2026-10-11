import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';

import {
  REPORT_REASON_LABELS,
  ReportService,
  ReportStatus,
  ResourceReport,
  ToastService,
} from '@kindergarten-warehouse/data-access';
import { PageHeaderComponent } from '../shared/components/page-header/page-header.component';
import { StatusPillComponent, StatusPillTone } from '../shared/components/status-pill/status-pill.component';
import { EmptyStateComponent } from '../shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '../shared/components/pagination/pagination.component';

const STATUS_META: Record<ReportStatus, { label: string; tone: StatusPillTone }> = {
  OPEN: { label: 'Chờ xử lý', tone: 'pending' },
  RESOLVED: { label: 'Đã xử lý', tone: 'approved' },
  DISMISSED: { label: 'Bác bỏ', tone: 'neutral' },
};

/** Hàng đợi báo cáo vi phạm từ người dùng Portal. */
@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [DatePipe, FormsModule, PageHeaderComponent, StatusPillComponent, EmptyStateComponent, PaginationComponent],
  templateUrl: './reports.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsComponent implements OnInit {
  private readonly api = inject(ReportService);
  private readonly toast = inject(ToastService);

  readonly reasonLabels = REPORT_REASON_LABELS;
  readonly statusOptions: { value: ReportStatus | ''; label: string }[] = [
    { value: 'OPEN', label: 'Chờ xử lý' },
    { value: 'RESOLVED', label: 'Đã xử lý' },
    { value: 'DISMISSED', label: 'Bác bỏ' },
    { value: '', label: 'Tất cả' },
  ];

  readonly pageSize = 20;
  readonly status = signal<ReportStatus | ''>('OPEN');
  readonly page = signal(1);
  readonly total = signal(0);
  readonly items = signal<ResourceReport[]>([]);
  readonly loading = signal(false);

  /** Report being handled in the dialog. */
  readonly active = signal<ResourceReport | null>(null);
  readonly submitting = signal(false);
  note = '';
  hideResource = true;

  ngOnInit(): void {
    this.load();
  }

  statusMeta(status: ReportStatus) {
    return STATUS_META[status];
  }

  setStatus(status: ReportStatus | ''): void {
    this.status.set(status);
    this.page.set(1);
    this.load();
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.load();
  }

  openHandle(report: ResourceReport): void {
    this.note = '';
    this.hideResource = true;
    this.active.set(report);
  }

  closeHandle(): void {
    if (!this.submitting()) this.active.set(null);
  }

  submit(action: 'RESOLVE' | 'DISMISS'): void {
    const report = this.active();
    if (!report || this.submitting()) return;
    this.submitting.set(true);
    this.api
      .resolve(report.id, action, this.note.trim(), action === 'RESOLVE' && this.hideResource)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.toast.show(action === 'RESOLVE' ? 'Đã xử lý báo cáo.' : 'Đã bác bỏ báo cáo.', 'success');
          this.active.set(null);
          this.load();
        },
        error: (err: HttpErrorResponse) => {
          this.toast.show(
            err.error?.code === 6603 ? 'Báo cáo này đã được xử lý trước đó.' : 'Không xử lý được báo cáo.',
            'error'
          );
          if (err.error?.code === 6603) {
            this.active.set(null);
            this.load();
          }
        },
      });
  }

  private load(): void {
    this.loading.set(true);
    this.api
      .search(this.status(), this.page(), this.pageSize)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (page) => {
          this.items.set(page?.content ?? []);
          this.total.set(page?.totalElements ?? 0);
        },
        error: () => {
          this.items.set([]);
          this.total.set(0);
          this.toast.show('Không tải được danh sách báo cáo.', 'error');
        },
      });
  }
}
