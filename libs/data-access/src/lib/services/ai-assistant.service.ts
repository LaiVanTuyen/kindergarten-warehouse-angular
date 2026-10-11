import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_URL } from '../tokens';
import { Resource, RestResponse } from '../models/resource.model';
import { LessonPlanDetail, LessonPlanRequest, LessonPlanStep } from './lesson-plan.service';

export interface AiStatus {
  enabled: boolean;
  dailyLimit: number;
  remainingToday: number;
}

/** A real warehouse resource the teacher can open, with the assistant's reason. */
export interface AiSearchItem {
  resource: Resource;
  reason: string;
}

export interface AiSearchResult {
  items: AiSearchItem[];
  remainingToday: number;
}

export interface AiDraftStep {
  title: string;
  durationMinutes?: number | null;
  description?: string | null;
  /** Only ids the teacher may open, or (adjustments) ids already in their plan. */
  resourceIds: string[];
  resources: Resource[];
}

/** Never saved by the server — the teacher reviews it first. */
export interface AiPlanDraft {
  title: string;
  durationMinutes?: number | null;
  objectives?: string | null;
  preparation?: string | null;
  adaptations?: string | null;
  notes?: string | null;
  steps: AiDraftStep[];
  remainingToday: number;
}

export const AI_ERRORS = {
  DISABLED: 7101,
  QUOTA: 7102,
  UNAVAILABLE: 7103,
  REFUSED: 7104,
} as const;

const unwrap = <T>(res: RestResponse<T>): T => (res.result ?? res.data) as T;

/** Teacher AI assistant — `/api/v1/ai`. */
@Injectable({ providedIn: 'root' })
export class AiAssistantService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_URL)}/ai`;

  status(): Observable<AiStatus> {
    return this.http.get<RestResponse<AiStatus>>(`${this.base}/status`).pipe(map(unwrap));
  }

  search(query: string): Observable<AiSearchResult> {
    return this.http.post<RestResponse<AiSearchResult>>(`${this.base}/search`, { query }).pipe(map(unwrap));
  }

  draftPlan(body: {
    request: string;
    ageGroupId?: number | null;
    durationMinutes?: number | null;
    classSize?: number | null;
  }): Observable<AiPlanDraft> {
    return this.http.post<RestResponse<AiPlanDraft>>(`${this.base}/plan-draft`, body).pipe(map(unwrap));
  }

  /** Sends the editor's current (possibly unsaved) plan; returns a revised draft. */
  adjustPlan(instruction: string, plan: LessonPlanRequest): Observable<AiPlanDraft> {
    return this.http
      .post<RestResponse<AiPlanDraft>>(`${this.base}/plan-adjust`, { instruction, plan })
      .pipe(map(unwrap));
  }
}

/** User-facing message for an AI error response. */
export function aiErrorMessage(code: number | undefined): string {
  switch (code) {
    case AI_ERRORS.DISABLED:
      return 'Trợ lý AI chưa được bật trên hệ thống.';
    case AI_ERRORS.QUOTA:
      return 'Bạn đã dùng hết lượt trợ lý AI hôm nay. Hãy thử lại vào ngày mai.';
    case AI_ERRORS.REFUSED:
      return 'Trợ lý AI không xử lý được yêu cầu này. Hãy diễn đạt lại.';
    default:
      return 'Trợ lý AI tạm thời không phản hồi. Vui lòng thử lại sau.';
  }
}

/** A new plan from an AI draft: every step is marked AI_SUGGESTED until the teacher reviews it. */
export function aiDraftToPlanRequest(
  draft: AiPlanDraft,
  extra: { ageGroupId?: number | null; classSize?: number | null } = {}
): LessonPlanRequest {
  return {
    title: draft.title,
    ageGroupId: extra.ageGroupId ?? null,
    durationMinutes: draft.durationMinutes ?? null,
    classSize: extra.classSize ?? null,
    objectives: draft.objectives ?? null,
    preparation: draft.preparation ?? null,
    adaptations: draft.adaptations ?? null,
    status: 'DRAFT',
    steps: draft.steps.map((s) => ({
      title: s.title,
      durationMinutes: s.durationMinutes ?? null,
      description: s.description ?? null,
      source: 'AI_SUGGESTED',
      resourceIds: s.resourceIds,
    })),
  };
}

/**
 * Applies an AI adjustment to the editor's plan. Steps the assistant returned unchanged keep
 * their source; changed or new steps become AI_SUGGESTED so the teacher sees what to review.
 * Plan id, version, sharing status, reflection and date are never touched by the assistant.
 */
export function applyAiAdjustment(current: LessonPlanDetail, ai: AiPlanDraft): LessonPlanDetail {
  const known = new Map<string, LessonPlanStep['resources'][number]>();
  for (const step of current.steps) for (const r of step.resources) known.set(r.resourceId, r);
  const fingerprint = (s: { title: string; durationMinutes?: number | null; description?: string | null }, ids: string[]) =>
    JSON.stringify([s.title.trim(), s.durationMinutes ?? null, (s.description ?? '').trim(), ids]);
  const unchanged = new Map<string, LessonPlanStep>();
  for (const s of current.steps) unchanged.set(fingerprint(s, s.resources.map((r) => r.resourceId)), s);

  const steps: LessonPlanStep[] = ai.steps.map((s) => {
    const same = unchanged.get(fingerprint(s, s.resourceIds));
    if (same) return { ...same, id: undefined, position: undefined };
    return {
      title: s.title,
      durationMinutes: s.durationMinutes ?? null,
      description: s.description ?? '',
      source: 'AI_SUGGESTED',
      resources: s.resourceIds.map(
        (id) =>
          known.get(id) ?? {
            resourceId: id,
            available: s.resources.some((r) => r.id === id),
            resource: s.resources.find((r) => r.id === id) ?? null,
          }
      ),
    };
  });

  return {
    ...current,
    plan: {
      ...current.plan,
      title: ai.title || current.plan.title,
      durationMinutes: ai.durationMinutes ?? current.plan.durationMinutes,
      objectives: ai.objectives ?? null,
    },
    preparation: ai.preparation ?? null,
    adaptations: ai.adaptations ?? null,
    steps,
  };
}
