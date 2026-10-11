import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';

import {
  AuthService,
  LESSON_PLAN_ERRORS,
  LessonPlanDetail,
  LessonPlanService,
  PlanCollaboration,
  PlanComment,
  ToastService,
} from '@kindergarten-warehouse/data-access';

/**
 * "Phối hợp" block on a plan page: expert review (request / decide), "đã sử dụng",
 * and colleague comments. Emits `changed` when the plan itself should be reloaded.
 */
@Component({
  selector: 'app-plan-collaboration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './plan-collaboration.component.html',
})
export class PlanCollaborationComponent implements OnChanges {
  private readonly api = inject(LessonPlanService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);

  @Input({ required: true }) detail!: LessonPlanDetail;
  @Output() changed = new EventEmitter<void>();

  readonly collab = signal<PlanCollaboration | null>(null);
  readonly busy = signal(false);
  readonly isAdmin = computed(() => (this.auth.currentUser()?.roles ?? []).includes('ADMIN'));
  commentText = '';
  reviewNote = '';

  ngOnChanges(): void {
    this.loadCollab();
  }

  get plan() {
    return this.detail.plan;
  }

  get canRequestReview(): boolean {
    const r = this.plan.reviewStatus ?? 'NONE';
    return this.plan.isOwner && this.plan.status === 'SHARED' && (r === 'NONE' || r === 'CHANGES_REQUESTED');
  }

  get canDecide(): boolean {
    return this.isAdmin() && this.plan.reviewStatus === 'PENDING';
  }

  /** Comments and usage only make sense on plans other teachers can see. */
  get isOpenToColleagues(): boolean {
    return this.plan.status === 'SHARED' || this.plan.template;
  }

  requestReview(): void {
    this.run(this.api.requestReview(this.plan.id), 'Đã gửi duyệt chuyên môn.', true);
  }

  decide(decision: 'APPROVE' | 'REQUEST_CHANGES'): void {
    if (decision === 'REQUEST_CHANGES' && !this.reviewNote.trim()) {
      this.toast.show('Hãy ghi rõ cần chỉnh sửa gì.', 'error');
      return;
    }
    this.run(
      this.api.decideReview(this.plan.id, this.plan.version, decision, this.reviewNote.trim()),
      decision === 'APPROVE' ? 'Đã duyệt kế hoạch.' : 'Đã gửi yêu cầu chỉnh sửa.',
      true,
      () => (this.reviewNote = '')
    );
  }

  markUsed(): void {
    this.busy.set(true);
    this.api
      .markUsed(this.plan.id)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (c) => {
          this.collab.set(c);
          this.toast.show('Đã ghi nhận bạn dùng kế hoạch này hôm nay.', 'success');
        },
        error: () => this.toast.show('Không ghi nhận được.', 'error'),
      });
  }

  addComment(): void {
    const text = this.commentText.trim();
    if (!text || this.busy()) return;
    this.busy.set(true);
    this.api
      .addComment(this.plan.id, text)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (comment) => {
          this.commentText = '';
          const c = this.collab();
          if (c) this.collab.set({ ...c, comments: [...c.comments, comment] });
        },
        error: () => this.toast.show('Không gửi được góp ý.', 'error'),
      });
  }

  deleteComment(comment: PlanComment): void {
    if (!confirm('Xoá góp ý này?')) return;
    this.api.deleteComment(this.plan.id, comment.id).subscribe({
      next: () => {
        const c = this.collab();
        if (c) this.collab.set({ ...c, comments: c.comments.filter((x) => x.id !== comment.id) });
      },
      error: () => this.toast.show('Không xoá được góp ý.', 'error'),
    });
  }

  private loadCollab(): void {
    if (!this.detail) return;
    this.api.collaboration(this.plan.id).subscribe({
      next: (c) => this.collab.set(c),
      error: () => this.collab.set(null),
    });
  }

  private run(request: import('rxjs').Observable<unknown>, success: string, reload: boolean, after?: () => void): void {
    this.busy.set(true);
    request.pipe(finalize(() => this.busy.set(false))).subscribe({
      next: () => {
        after?.();
        this.toast.show(success, 'success');
        if (reload) this.changed.emit();
      },
      error: (err: HttpErrorResponse) => {
        this.toast.show(
          err.error?.code === LESSON_PLAN_ERRORS.REVIEW_STATE
            ? 'Kế hoạch vừa thay đổi hoặc đã được xử lý. Đã tải lại bản mới nhất.'
            : 'Không thực hiện được. Vui lòng thử lại.',
          'error'
        );
        if (err.error?.code === LESSON_PLAN_ERRORS.REVIEW_STATE) this.changed.emit();
      },
    });
  }
}
