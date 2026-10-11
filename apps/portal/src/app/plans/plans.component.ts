import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';

import {
  LESSON_PLAN_ERRORS,
  LessonPlanService,
  LessonPlanSummary,
  ToastService,
} from '@kindergarten-warehouse/data-access';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { ErrorStateComponent } from '../shared/error-state/error-state.component';
import { PaginatorComponent } from '../shared/paginator/paginator.component';
import { SpinnerComponent } from '../shared/spinner/spinner.component';

type Scope = 'me' | 'shared' | 'templates';

/** "Kế hoạch hoạt động": mine, colleagues' shared plans, and templates. */
@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, EmptyStateComponent, ErrorStateComponent, PaginatorComponent, SpinnerComponent],
  templateUrl: './plans.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlansComponent implements OnInit {
  private readonly api = inject(LessonPlanService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly pageSize = 12;
  readonly scope = signal<Scope>('me');
  readonly page = signal(1);
  readonly totalPages = signal(0);
  readonly items = signal<LessonPlanSummary[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly busy = signal(false);
  keyword = '';
  /** Library filter: only plans approved by a reviewer ("duyệt chuyên môn"). */
  approvedOnly = false;

  ngOnInit(): void {
    this.load();
  }

  setScope(scope: Scope): void {
    if (scope === this.scope()) return;
    this.scope.set(scope);
    this.page.set(1);
    this.keyword = '';
    this.load();
  }

  search(): void {
    this.page.set(1);
    this.load();
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.load();
  }

  /** Blank plan with the default four steps, straight into the editor. */
  createBlank(): void {
    this.busy.set(true);
    this.api
      .create({ title: 'Kế hoạch hoạt động mới', status: 'DRAFT' })
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (plan) => this.router.navigate(['/plans', plan.id, 'edit']),
        error: (err: HttpErrorResponse) => this.showError(err, 'Không tạo được kế hoạch.'),
      });
  }

  /** "Dùng mẫu" / "Sao chép": copy into my drafts and open the editor. */
  copy(plan: LessonPlanSummary): void {
    this.busy.set(true);
    this.api
      .copy(plan.id)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (created) => {
          this.toast.show(plan.template ? 'Đã tạo kế hoạch từ mẫu.' : 'Đã sao chép kế hoạch.', 'success');
          this.router.navigate(['/plans', created.id, 'edit']);
        },
        error: (err: HttpErrorResponse) => this.showError(err, 'Không sao chép được kế hoạch.'),
      });
  }

  trackById = (_: number, p: LessonPlanSummary) => p.id;

  private showError(err: HttpErrorResponse, fallback: string): void {
    this.toast.show(
      err.error?.code === LESSON_PLAN_ERRORS.LIMIT ? 'Bạn đã đạt số kế hoạch tối đa.' : fallback,
      'error'
    );
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    // "Đồng nghiệp chia sẻ" is the school library: same shared plans, with an approved-only filter.
    const request = this.scope() === 'shared'
      ? this.api.library(this.keyword, this.approvedOnly, this.page(), this.pageSize)
      : this.api.list(this.scope(), this.page(), this.pageSize, this.keyword);
    request
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (page) => {
          this.items.set(page?.content ?? []);
          this.totalPages.set(page?.totalPages ?? 0);
        },
        error: () => {
          this.items.set([]);
          this.error.set('Không tải được danh sách kế hoạch.');
        },
      });
  }
}
