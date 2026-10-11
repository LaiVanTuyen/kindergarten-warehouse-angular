import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';

import {
  LESSON_PLAN_ERRORS,
  LessonPlanDetail,
  LessonPlanService,
  ToastService,
} from '@kindergarten-warehouse/data-access';
import { ErrorStateComponent } from '../shared/error-state/error-state.component';
import { SpinnerComponent } from '../shared/spinner/spinner.component';
import { PlanCollaborationComponent } from './plan-collaboration.component';

/**
 * Read view of a lesson plan. With route data `{ print: true }` it renders as a
 * printable A4 sheet ("In / Lưu PDF" uses the browser's print-to-PDF), without site chrome.
 */
@Component({
  selector: 'app-plan-view',
  standalone: true,
  imports: [CommonModule, RouterModule, ErrorStateComponent, SpinnerComponent, PlanCollaborationComponent],
  templateUrl: './plan-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanViewComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(LessonPlanService);
  private readonly toast = inject(ToastService);

  readonly printMode = this.route.snapshot.data['print'] === true;
  readonly id = signal<number | null>(null);
  readonly detail = signal<LessonPlanDetail | null>(null);
  readonly error = signal<string | null>(null);
  readonly busy = signal(false);

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const id = Number(params.get('id'));
      if (!Number.isInteger(id) || id <= 0) {
        this.error.set('Không tìm thấy kế hoạch.');
        return;
      }
      this.id.set(id);
      this.load();
    });
  }

  load(): void {
    const id = this.id();
    if (!id) return;
    this.error.set(null);
    this.api.get(id).subscribe({
      next: (d) => this.detail.set(d),
      error: (err: HttpErrorResponse) =>
        this.error.set(
          err.status === 404
            ? 'Không tìm thấy kế hoạch, hoặc kế hoạch chưa được chia sẻ với bạn.'
            : 'Không tải được kế hoạch.'
        ),
    });
  }

  print(): void {
    window.print();
  }

  copy(): void {
    const d = this.detail();
    if (!d) return;
    this.busy.set(true);
    this.api
      .copy(d.plan.id)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (created) => {
          this.toast.show(d.plan.template ? 'Đã tạo kế hoạch từ mẫu.' : 'Đã sao chép kế hoạch.', 'success');
          this.router.navigate(['/plans', created.id, 'edit']);
        },
        error: (err: HttpErrorResponse) =>
          this.toast.show(
            err.error?.code === LESSON_PLAN_ERRORS.LIMIT ? 'Bạn đã đạt số kế hoạch tối đa.' : 'Không sao chép được kế hoạch.',
            'error'
          ),
      });
  }

  remove(): void {
    const d = this.detail();
    if (!d || !confirm(`Xoá kế hoạch "${d.plan.title}"?`)) return;
    this.busy.set(true);
    this.api
      .delete(d.plan.id)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: () => {
          this.toast.show('Đã xoá kế hoạch.', 'success');
          this.router.navigate(['/plans']);
        },
        error: () => this.toast.show('Không xoá được kế hoạch.', 'error'),
      });
  }

  /** Text block helper: preserves the teacher's line breaks. */
  lines(text?: string | null): string[] {
    return (text ?? '').split('\n').map((l) => l.trim()).filter(Boolean);
  }
}
