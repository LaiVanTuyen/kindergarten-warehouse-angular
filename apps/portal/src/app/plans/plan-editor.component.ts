import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, map } from 'rxjs/operators';

import {
  AgeGroup,
  AuthService,
  LESSON_PLAN_ERRORS,
  LessonPlanDetail,
  LessonPlanService,
  LessonPlanStep,
  Resource,
  ResourceService,
  ToastService,
  toLessonPlanRequest,
} from '@kindergarten-warehouse/data-access';
import { ErrorStateComponent } from '../shared/error-state/error-state.component';
import { SpinnerComponent } from '../shared/spinner/spinner.component';
import { ResourcePickerDialogComponent } from './resource-picker-dialog.component';

const MAX_STEPS = 20;
const MAX_RESOURCES_PER_STEP = 10;

/**
 * Lesson-plan editor. Works on a local copy of the detail and saves the whole document
 * (with the version it loaded) so a save from a stale tab is refused, not merged.
 */
@Component({
  selector: 'app-plan-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ErrorStateComponent, SpinnerComponent, ResourcePickerDialogComponent],
  templateUrl: './plan-editor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanEditorComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(LessonPlanService);
  private readonly resourceService = inject(ResourceService);
  private readonly toast = inject(ToastService);
  readonly auth = inject(AuthService);

  readonly maxSteps = MAX_STEPS;
  readonly maxResources = MAX_RESOURCES_PER_STEP;
  readonly id = signal<number | null>(null);
  /** Working copy; mutated by the form, sent whole on save. */
  readonly draft = signal<LessonPlanDetail | null>(null);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);
  readonly dirty = signal(false);
  readonly ageGroups = signal<AgeGroup[]>([]);
  /** Index of the step whose resource picker is open. */
  readonly pickerStep = signal<number | null>(null);
  readonly isAdmin = computed(() => (this.auth.currentUser()?.roles ?? []).includes('ADMIN'));

  constructor() {
    this.resourceService
      .getAgeGroups()
      .pipe(map((res) => res.result ?? []))
      .subscribe({ next: (g) => this.ageGroups.set(g), error: () => void 0 });

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
      next: (d) => {
        if (!d.plan.isOwner) {
          // Only the owner edits; colleagues view (and may copy) instead.
          this.router.navigate(['/plans', id], { replaceUrl: true });
          return;
        }
        // Deep copy of plain JSON data (structuredClone is missing in older browsers and jsdom).
        this.draft.set(JSON.parse(JSON.stringify(d)) as LessonPlanDetail);
        this.dirty.set(false);
      },
      error: (err: HttpErrorResponse) =>
        this.error.set(err.status === 404 ? 'Không tìm thấy kế hoạch.' : 'Không tải được kế hoạch.'),
    });
  }

  touch(): void {
    this.dirty.set(true);
  }

  stepTotal(): number {
    return (this.draft()?.steps ?? []).reduce((sum, s) => sum + (Number(s.durationMinutes) || 0), 0);
  }

  // --- steps ----------------------------------------------------------------

  addStep(): void {
    const d = this.draft();
    if (!d || d.steps.length >= MAX_STEPS) return;
    d.steps.push({ title: 'Bước mới', durationMinutes: null, description: '', source: 'TEACHER', resources: [] });
    this.commit(d);
  }

  removeStep(index: number): void {
    const d = this.draft();
    if (!d) return;
    d.steps.splice(index, 1);
    this.commit(d);
  }

  moveStep(index: number, delta: -1 | 1): void {
    const d = this.draft();
    const target = index + delta;
    if (!d || target < 0 || target >= d.steps.length) return;
    [d.steps[index], d.steps[target]] = [d.steps[target], d.steps[index]];
    this.commit(d);
  }

  /** Teacher reviewed an AI-drafted step: it now counts as their own content. */
  confirmStep(step: LessonPlanStep): void {
    step.source = 'TEACHER';
    this.commit(this.draft()!);
  }

  attach(resource: Resource): void {
    const d = this.draft();
    const i = this.pickerStep();
    if (!d || i === null) return;
    const step = d.steps[i];
    if (step.resources.some((r) => r.resourceId === resource.id)) return;
    if (step.resources.length >= MAX_RESOURCES_PER_STEP) {
      this.toast.show(`Mỗi bước gắn tối đa ${MAX_RESOURCES_PER_STEP} học liệu.`, 'info');
      return;
    }
    step.resources.push({ resourceId: resource.id, available: true, resource });
    this.commit(d);
  }

  detach(step: LessonPlanStep, resourceId: string): void {
    step.resources = step.resources.filter((r) => r.resourceId !== resourceId);
    this.commit(this.draft()!);
  }

  selectedIds(index: number): string[] {
    return this.draft()?.steps[index]?.resources.map((r) => r.resourceId) ?? [];
  }

  // --- save -------------------------------------------------------------------

  save(thenView = false): void {
    const d = this.draft();
    const id = this.id();
    if (!d || !id || this.saving()) return;
    if (!d.plan.title.trim()) {
      this.toast.show('Vui lòng nhập tên kế hoạch.', 'error');
      return;
    }
    if (d.steps.some((s) => !s.title.trim())) {
      this.toast.show('Mỗi bước cần có tên.', 'error');
      return;
    }
    this.saving.set(true);
    const payload = toLessonPlanRequest(d);
    const submitted = JSON.stringify(payload);
    this.api
      .update(id, payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (summary) => {
          const current = this.draft();
          if (!current || this.id() !== id) return;
          const changedDuringSave = JSON.stringify(toLessonPlanRequest(current)) !== submitted;
          current.plan.version = summary.version;
          this.dirty.set(changedDuringSave);
          this.toast.show(changedDuringSave ? 'Đã lưu bản vừa gửi. Bạn còn thay đổi mới chưa lưu.' : 'Đã lưu kế hoạch.', 'success');
          if (thenView && !changedDuringSave) this.router.navigate(['/plans', id]);
        },
        error: (err: HttpErrorResponse) => {
          const code = err.error?.code;
          if (code === LESSON_PLAN_ERRORS.STALE || err.status === 409) {
            // Keep the teacher's text on screen; they decide whether to reload.
            this.toast.show('Kế hoạch đã được lưu ở nơi khác. Hãy sao chép nội dung cần giữ rồi tải lại trang.', 'error');
          } else if (err.status === 404) {
            this.toast.show('Có học liệu bạn không còn quyền gắn. Hãy gỡ học liệu đó rồi lưu lại.', 'error');
          } else if (err.status === 400) {
            this.toast.show('Một số trường chưa hợp lệ (độ dài, số phút…). Vui lòng kiểm tra lại.', 'error');
          } else {
            this.toast.show('Không lưu được kế hoạch.', 'error');
          }
        },
      });
  }

  cancel(): void {
    const id = this.id();
    this.router.navigate(id ? ['/plans', id] : ['/plans']);
  }

  canLeave(): boolean {
    return !this.saving() && (!this.dirty() || confirm('Bỏ các thay đổi chưa lưu?'));
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnload(event: BeforeUnloadEvent): void {
    if (this.dirty() || this.saving()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  trackByIndex = (i: number) => i;

  /** Re-emit the mutated draft so OnPush views depending on the signal refresh. */
  private commit(d: LessonPlanDetail): void {
    this.draft.set({ ...d, steps: [...d.steps] });
    this.dirty.set(true);
  }
}
