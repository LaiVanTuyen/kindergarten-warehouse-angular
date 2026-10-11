import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_URL } from '../tokens';
import { PaginatedResponse, Resource, RestResponse } from '../models/resource.model';
import { CollectionRef } from './collection.service';

export type LessonPlanStatus = 'DRAFT' | 'SHARED';
/** Who wrote the content. AI_SUGGESTED arrives with the phase-2 assistant. */
export type ContentSource = 'TEACHER' | 'AI_SUGGESTED';

export interface LessonPlanSummary {
  id: number;
  title: string;
  ageGroup?: CollectionRef | null;
  topic?: CollectionRef | null;
  durationMinutes?: number | null;
  objectives?: string | null;
  status: LessonPlanStatus;
  template: boolean;
  ownerId: number;
  ownerName: string;
  isOwner: boolean;
  stepCount: number;
  taughtOn?: string | null;
  sourcePlanId?: number | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

/** `resource` is null when this viewer can't open it (title not exposed). */
export interface LessonPlanStepResource {
  resourceId: string;
  available: boolean;
  resource: Resource | null;
}

export interface LessonPlanStep {
  id?: number;
  position?: number;
  title: string;
  durationMinutes?: number | null;
  description?: string | null;
  source: ContentSource;
  resources: LessonPlanStepResource[];
}

export interface LessonPlanDetail {
  plan: LessonPlanSummary;
  classSize?: number | null;
  preparation?: string | null;
  adaptations?: string | null;
  reflection?: string | null;
  collectionId?: number | null;
  stepMinutesTotal: number;
  steps: LessonPlanStep[];
}

/** Whole-document save: steps are replaced as a unit. */
export interface LessonPlanRequest {
  title: string;
  ageGroupId?: number | null;
  topicId?: number | null;
  durationMinutes?: number | null;
  classSize?: number | null;
  objectives?: string | null;
  preparation?: string | null;
  adaptations?: string | null;
  reflection?: string | null;
  taughtOn?: string | null;
  status: LessonPlanStatus;
  template?: boolean | null;
  collectionId?: number | null;
  steps?: {
    title: string;
    durationMinutes?: number | null;
    description?: string | null;
    source: ContentSource;
    resourceIds: string[];
  }[];
  version?: number;
}

export const LESSON_PLAN_ERRORS = {
  NOT_FOUND: 6901,
  FORBIDDEN: 6902,
  STALE: 6903,
  LIMIT: 6904,
} as const;

const unwrap = <T>(res: RestResponse<T>): T => (res.result ?? res.data) as T;

/** "Kế hoạch hoạt động" — `/api/v1/plans`. Pages are 1-based like the rest of the Portal. */
@Injectable({ providedIn: 'root' })
export class LessonPlanService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_URL)}/plans`;

  list(
    scope: 'me' | 'shared' | 'templates',
    page = 1,
    size = 12,
    keyword = ''
  ): Observable<PaginatedResponse<LessonPlanSummary>> {
    let params = new HttpParams().set('page', page - 1).set('size', size);
    if (keyword.trim()) params = params.set('keyword', keyword.trim());
    return this.http
      .get<RestResponse<PaginatedResponse<LessonPlanSummary>>>(`${this.base}/${scope}`, { params })
      .pipe(map(unwrap));
  }

  get(id: number): Observable<LessonPlanDetail> {
    return this.http.get<RestResponse<LessonPlanDetail>>(`${this.base}/${id}`).pipe(map(unwrap));
  }

  create(body: LessonPlanRequest): Observable<LessonPlanSummary> {
    return this.http.post<RestResponse<LessonPlanSummary>>(this.base, body).pipe(map(unwrap));
  }

  update(id: number, body: LessonPlanRequest): Observable<LessonPlanSummary> {
    return this.http.put<RestResponse<LessonPlanSummary>>(`${this.base}/${id}`, body).pipe(map(unwrap));
  }

  delete(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`);
  }

  copy(id: number): Observable<LessonPlanSummary> {
    return this.http.post<RestResponse<LessonPlanSummary>>(`${this.base}/${id}/copy`, {}).pipe(map(unwrap));
  }
}

/** Detail → request, preserving every reference (including unavailable ones). */
export function toLessonPlanRequest(detail: LessonPlanDetail): LessonPlanRequest {
  const p = detail.plan;
  return {
    title: p.title,
    ageGroupId: p.ageGroup?.id ?? null,
    topicId: p.topic?.id ?? null,
    durationMinutes: p.durationMinutes ?? null,
    classSize: detail.classSize ?? null,
    objectives: p.objectives ?? null,
    preparation: detail.preparation ?? null,
    adaptations: detail.adaptations ?? null,
    reflection: detail.reflection ?? null,
    taughtOn: p.taughtOn ?? null,
    status: p.status,
    template: p.template,
    collectionId: detail.collectionId ?? null,
    steps: detail.steps.map((s) => ({
      title: s.title,
      durationMinutes: s.durationMinutes ?? null,
      description: s.description ?? null,
      source: s.source,
      resourceIds: s.resources.map((r) => r.resourceId),
    })),
    version: p.version,
  };
}
