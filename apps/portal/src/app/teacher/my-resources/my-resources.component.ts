import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, of } from 'rxjs';

import {
  Resource,
  ResourceService,
  ToastService,
} from '@kindergarten-warehouse/data-access';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/error-state/error-state.component';
import { PaginatorComponent } from '../../shared/paginator/paginator.component';
import { SpinnerComponent } from '../../shared/spinner/spinner.component';
import { StatusPillComponent } from '../../shared/status-pill/status-pill.component';

const STATUS_FILTERS = [
  { value: 'ALL',      label: 'Tất cả',       icon: 'ph-files' },
  { value: 'PENDING',  label: 'Đang chờ',     icon: 'ph-hourglass-high' },
  { value: 'APPROVED', label: 'Đã duyệt',     icon: 'ph-check-circle' },
  { value: 'REJECTED', label: 'Bị từ chối',   icon: 'ph-x-circle' },
  { value: 'HIDDEN',   label: 'Đã ẩn',        icon: 'ph-eye-slash' },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]['value'];

/**
 * Teacher's "My resources" dashboard. Shows every resource the logged-in
 * teacher has uploaded, lets them filter by moderation state, delete their
 * own work, or jump into a new upload. Deletes pass through a confirm modal.
 */
@Component({
  selector: 'app-teacher-my-resources',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ConfirmDialogComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    PaginatorComponent,
    SpinnerComponent,
    StatusPillComponent,
  ],
  templateUrl: './my-resources.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyResourcesComponent implements OnInit {
  private readonly resourceService = inject(ResourceService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly STATUS_FILTERS = STATUS_FILTERS;
  readonly pageSize = 12;

  readonly status = signal<StatusFilter>('ALL');
  readonly page = signal(1);
  readonly totalPages = signal(0);
  readonly totalElements = signal(0);
  readonly resources = signal<Resource[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly pendingDelete = signal<Resource | null>(null);
  readonly isDeleting = signal(false);

  readonly isEmpty = computed(
    () => !this.loading() && this.resources().length === 0 && !this.error()
  );

  readonly counts = computed(() => {
    const all = this.resources();
    const byStatus: Record<string, number> = {};
    for (const r of all) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    return byStatus;
  });

  ngOnInit(): void {
    const initialStatus = this.route.snapshot.queryParamMap.get('status');
    if (
      initialStatus &&
      STATUS_FILTERS.some((f) => f.value === initialStatus)
    ) {
      this.status.set(initialStatus as StatusFilter);
    }
    this.load();
  }

  setStatus(status: StatusFilter): void {
    if (this.status() === status) return;
    this.status.set(status);
    this.page.set(1);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { status: status === 'ALL' ? null : status },
      queryParamsHandling: 'merge',
    });
    this.load();
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.load();
  }

  trackById = (_: number, r: Resource) => r.id;

  askDelete(resource: Resource): void {
    this.pendingDelete.set(resource);
  }

  cancelDelete(): void {
    if (this.isDeleting()) return;
    this.pendingDelete.set(null);
  }

  confirmDelete(): void {
    const target = this.pendingDelete();
    if (!target || this.isDeleting()) return;
    this.isDeleting.set(true);
    this.resourceService
      .deleteResource(target.id, false)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: () => {
          this.pendingDelete.set(null);
          this.toast.show('Đã xoá tài liệu.', 'success');
          // Step back a page if we just emptied the current one.
          const shouldStepBack =
            this.resources().length === 1 && this.page() > 1;
          if (shouldStepBack) this.page.update((p) => p - 1);
          this.load();
        },
        error: (err: HttpErrorResponse) => {
          const msg =
            err?.status === 403
              ? 'Bạn không có quyền xoá tài liệu này.'
              : 'Không xoá được tài liệu. Vui lòng thử lại.';
          this.toast.show(msg, 'error');
        },
      });
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);

    const status = this.status();
    this.resourceService
      .listMyResources({
        page: this.page(),
        size: this.pageSize,
        status: status === 'ALL' ? undefined : status,
      })
      .pipe(
        finalize(() => this.loading.set(false)),
        catchError((err: HttpErrorResponse) => {
          this.error.set(
            err.status === 0
              ? 'Không thể kết nối đến máy chủ.'
              : 'Không tải được danh sách tài liệu.'
          );
          return of(null);
        })
      )
      .subscribe((res) => {
        if (!res) {
          this.resources.set([]);
          this.totalPages.set(0);
          this.totalElements.set(0);
          return;
        }
        const page = res.result ?? res.data;
        this.resources.set(page?.content ?? []);
        this.totalPages.set(page?.totalPages ?? 0);
        this.totalElements.set(page?.totalElements ?? 0);
      });
  }
}
