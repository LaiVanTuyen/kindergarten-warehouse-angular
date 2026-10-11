import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, map } from 'rxjs/operators';

import {
  AgeGroup,
  AiAssistantService,
  AiPlanDraft,
  AiSearchItem,
  AiStatus,
  LessonPlanService,
  ResourceService,
  ToastService,
  aiDraftToPlanRequest,
  aiErrorMessage,
} from '@kindergarten-warehouse/data-access';
import { AddToCollectionDialogComponent } from '../collections/add-to-collection-dialog.component';

type Tab = 'search' | 'draft';

/**
 * Teacher AI assistant. Results are always split visually into "từ kho" (real resources the
 * teacher can open) and "AI đề xuất" (generated text that needs review); nothing is saved
 * until the teacher clicks to create a plan, and then every step is marked AI_SUGGESTED.
 */
@Component({
  selector: 'app-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AddToCollectionDialogComponent],
  templateUrl: './assistant.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssistantComponent implements OnInit {
  private readonly ai = inject(AiAssistantService);
  private readonly plans = inject(LessonPlanService);
  private readonly resources = inject(ResourceService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly tab = signal<Tab>('search');
  readonly status = signal<AiStatus | null>(null);
  readonly statusError = signal(false);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly ageGroups = signal<AgeGroup[]>([]);

  readonly searchExamples = [
    'Tìm bài hát về gia đình cho trẻ 3–4 tuổi, có video',
    'Truyện kể về con vật nuôi trong nhà',
    'Tranh tô màu chủ đề giao thông',
  ];
  readonly draftExamples = [
    'Soạn hoạt động 20 phút về màu sắc, lớp có 25 trẻ, chỉ có giấy và bút màu',
    'Hoạt động âm nhạc về Tết Trung thu cho lớp lá',
  ];

  query = '';
  readonly results = signal<AiSearchItem[] | null>(null);
  readonly collectFor = signal<AiSearchItem | null>(null);

  draftRequest = '';
  draftAgeGroupId: number | null = null;
  draftDuration: number | null = null;
  draftClassSize: number | null = null;
  readonly draft = signal<AiPlanDraft | null>(null);

  ngOnInit(): void {
    this.ai.status().subscribe({
      next: (s) => this.status.set(s),
      error: () => this.statusError.set(true),
    });
    this.resources
      .getAgeGroups()
      .pipe(map((res) => res.result ?? []))
      .subscribe({ next: (g) => this.ageGroups.set(g), error: () => void 0 });
  }

  setTab(tab: Tab): void {
    this.tab.set(tab);
    this.error.set(null);
  }

  search(): void {
    const q = this.query.trim();
    if (!q || this.busy()) return;
    this.run(this.ai.search(q), (res) => {
      this.results.set(res.items);
      this.updateRemaining(res.remainingToday);
    });
  }

  makeDraft(): void {
    const request = this.draftRequest.trim();
    if (!request || this.busy()) return;
    this.draft.set(null);
    this.run(
      this.ai.draftPlan({
        request,
        ageGroupId: this.draftAgeGroupId,
        durationMinutes: this.draftDuration,
        classSize: this.draftClassSize,
      }),
      (d) => {
        this.draft.set(d);
        this.updateRemaining(d.remainingToday);
      }
    );
  }

  /** The only write: creates a DRAFT plan whose steps are all marked AI_SUGGESTED. */
  createPlanFromDraft(): void {
    const d = this.draft();
    if (!d || this.busy()) return;
    this.busy.set(true);
    this.plans
      .create(aiDraftToPlanRequest(d, { ageGroupId: this.draftAgeGroupId, classSize: this.draftClassSize }))
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (plan) => {
          this.toast.show('Đã tạo bản nháp. Hãy đọc lại từng bước được đánh dấu “AI đề xuất”.', 'success');
          this.router.navigate(['/plans', plan.id, 'edit']);
        },
        error: () => this.toast.show('Không tạo được kế hoạch.', 'error'),
      });
  }

  totalMinutes(d: AiPlanDraft): number {
    return d.steps.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0);
  }

  lines(text?: string | null): string[] {
    return (text ?? '').split('\n').map((l) => l.trim()).filter(Boolean);
  }

  private run<T>(request: import('rxjs').Observable<T>, onSuccess: (value: T) => void): void {
    this.busy.set(true);
    this.error.set(null);
    request.pipe(finalize(() => this.busy.set(false))).subscribe({
      next: onSuccess,
      error: (err: HttpErrorResponse) => this.error.set(aiErrorMessage(err.error?.code)),
    });
  }

  private updateRemaining(remaining: number): void {
    const s = this.status();
    if (s) this.status.set({ ...s, remainingToday: remaining });
  }
}
