import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { Subject, of } from 'rxjs';

import {
  AiAssistantService,
  AiPlanDraft,
  AuthService,
  LessonPlanDetail,
  LessonPlanService,
  ResourceService,
  ToastService,
} from '@kindergarten-warehouse/data-access';
import { PlanEditorComponent } from './plan-editor.component';

const detail = (): LessonPlanDetail => ({
  plan: {
    id: 5, title: 'Màu sắc', status: 'DRAFT', template: false, ownerId: 1, ownerName: 'Cô An', isOwner: true,
    stepCount: 1, version: 3, createdAt: '', updatedAt: '', durationMinutes: 20,
  },
  stepMinutesTotal: 20,
  steps: [{ id: 1, title: 'Khám phá', durationMinutes: 20, description: 'Xem tranh', source: 'TEACHER', resources: [] }],
});

const aiResult: AiPlanDraft = {
  title: 'Màu sắc', durationMinutes: 15, notes: 'Rút còn 15 phút', remainingToday: 5,
  steps: [{ title: 'Khám phá', durationMinutes: 15, description: 'Xem tranh', resourceIds: [], resources: [] }],
};

describe('Trình soạn — trợ lý AI điều chỉnh', () => {
  let reply: Subject<AiPlanDraft>;
  let ai: { status: jest.Mock; adjustPlan: jest.Mock };
  let toast: { show: jest.Mock };

  beforeEach(() => {
    reply = new Subject();
    ai = {
      status: jest.fn(() => of({ enabled: true, dailyLimit: 30, remainingToday: 30 })),
      adjustPlan: jest.fn(() => reply),
    };
    toast = { show: jest.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: AiAssistantService, useValue: ai },
        { provide: LessonPlanService, useValue: { get: jest.fn(() => of(detail())) } },
        { provide: ToastService, useValue: toast },
        { provide: Router, useValue: { navigate: jest.fn() } },
        { provide: ResourceService, useValue: { getAgeGroups: () => of({ result: [] }) } },
        { provide: AuthService, useValue: { currentUser: () => ({ roles: ['TEACHER'] }) } },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: '5' })) } },
      ],
    });
  });

  const editor = () => TestBed.runInInjectionContext(() => new PlanEditorComponent());

  it('gửi bản đang soạn (kể cả chưa lưu), áp kết quả, đánh dấu bước AI và cho hoàn tác', () => {
    const c = editor();
    c.draft()!.plan.title = 'Màu sắc';
    c.adjustWithAi('Rút xuống 15 phút');
    expect(ai.adjustPlan).toHaveBeenCalledWith('Rút xuống 15 phút', expect.objectContaining({ version: 3 }));

    reply.next(aiResult);
    reply.complete();

    expect(c.draft()!.steps[0].source).toBe('AI_SUGGESTED');
    expect(c.draft()!.plan.durationMinutes).toBe(15);
    expect(c.dirty()).toBe(true);
    expect(c.aiNotes()).toBe('Rút còn 15 phút');

    c.undoAi();
    expect(c.draft()!.steps[0].source).toBe('TEACHER');
    expect(c.draft()!.plan.durationMinutes).toBe(20);
  });

  it('giáo viên sửa tiếp trong lúc chờ thì KHÔNG ghi đè, báo gửi lại', () => {
    const c = editor();
    c.adjustWithAi('Rút xuống 15 phút');
    c.draft()!.plan.title = 'Đang gõ dở';

    reply.next(aiResult);
    reply.complete();

    expect(c.draft()!.plan.title).toBe('Đang gõ dở');
    expect(c.draft()!.steps[0].durationMinutes).toBe(20);
    expect(c.canUndoAi()).toBe(false);
    expect(toast.show).toHaveBeenCalledWith(expect.stringContaining('gửi lại'), 'info');
  });
});
