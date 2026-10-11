import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, Subject, throwError } from 'rxjs';

import {
  AuthService,
  LessonPlanDetail,
  LessonPlanService,
  Resource,
  ResourceService,
  ToastService,
  toLessonPlanRequest,
} from '@kindergarten-warehouse/data-access';
import { PlanEditorComponent } from './plan-editor.component';

function detail(): LessonPlanDetail {
  return {
    plan: {
      id: 5, title: 'Màu sắc', status: 'DRAFT', template: false, ownerId: 1, ownerName: 'Cô An',
      isOwner: true, stepCount: 2, version: 3, createdAt: '', updatedAt: '', durationMinutes: 20,
    },
    stepMinutesTotal: 15,
    steps: [
      { id: 1, title: 'Khởi động', durationMinutes: 5, source: 'TEACHER', resources: [] },
      {
        id: 2, title: 'Khám phá', durationMinutes: 10, source: 'AI_SUGGESTED',
        resources: [{ resourceId: 'gone', available: false, resource: null }],
      },
    ],
  };
}

describe('Kế hoạch hoạt động (FE)', () => {
  let api: Record<string, jest.Mock>;
  let toast: { show: jest.Mock };
  let router: { navigate: jest.Mock };

  beforeEach(() => {
    api = {
      get: jest.fn(() => of(detail())),
      update: jest.fn(() => of({ version: 4 })),
    };
    toast = { show: jest.fn() };
    router = { navigate: jest.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: LessonPlanService, useValue: api },
        { provide: ToastService, useValue: toast },
        { provide: Router, useValue: router },
        { provide: ResourceService, useValue: { getAgeGroups: () => of({ result: [] }) } },
        { provide: AuthService, useValue: { currentUser: () => ({ roles: ['TEACHER'] }) } },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: '5' })) } },
      ],
    });
  });

  const editor = () => TestBed.runInInjectionContext(() => new PlanEditorComponent());

  it('lưu giữ cả tham chiếu học liệu không còn khả dụng (không tự ý xoá của giáo viên)', () => {
    const req = toLessonPlanRequest(detail());
    expect(req.steps![1].resourceIds).toEqual(['gone']);
    expect(req.steps![1].source).toBe('AI_SUGGESTED');
    expect(req.version).toBe(3);
  });

  it('gắn học liệu: bỏ qua trùng, giới hạn 10 mỗi bước', () => {
    const c = editor();
    c.pickerStep.set(0);
    const r = (id: string) => ({ id, title: id } as Resource);
    c.attach(r('a'));
    c.attach(r('a'));
    expect(c.draft()!.steps[0].resources.map((x) => x.resourceId)).toEqual(['a']);
    for (let i = 0; i < 12; i++) c.attach(r('x' + i));
    expect(c.draft()!.steps[0].resources).toHaveLength(10);
    expect(toast.show).toHaveBeenCalledWith(expect.stringContaining('tối đa 10'), 'info');
  });

  it('đổi thứ tự bước, xác nhận bước AI và tính tổng phút', () => {
    const c = editor();
    c.moveStep(1, -1);
    expect(c.draft()!.steps.map((s) => s.title)).toEqual(['Khám phá', 'Khởi động']);
    c.confirmStep(c.draft()!.steps[0]);
    expect(c.draft()!.steps[0].source).toBe('TEACHER');
    expect(c.stepTotal()).toBe(15);
    expect(c.dirty()).toBe(true);
  });

  it('lưu gửi version đã tải và cập nhật version mới', () => {
    const c = editor();
    c.save();
    expect(api['update']).toHaveBeenCalledWith(5, expect.objectContaining({ version: 3 }));
    expect(c.draft()!.plan.version).toBe(4);
    expect(c.dirty()).toBe(false);
  });

  it('bị từ chối vì bản cũ (6903) thì giữ nội dung đang soạn, không tải đè', () => {
    api['update'].mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { code: 6903 } })));
    const c = editor();
    c.draft()!.plan.title = 'Đang sửa dở';
    c.touch();
    api['get'].mockClear();

    c.save();

    expect(c.draft()!.plan.title).toBe('Đang sửa dở');
    expect(api['get']).not.toHaveBeenCalled();
    expect(toast.show).toHaveBeenCalledWith(expect.stringContaining('lưu ở nơi khác'), 'error');
  });

  it('người không phải chủ bị chuyển sang trang xem', () => {
    api['get'].mockReturnValue(of({ ...detail(), plan: { ...detail().plan, isOwner: false } }));
    const c = editor();
    expect(c.draft()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/plans', 5], { replaceUrl: true });
  });

  it('keeps edits made while saving dirty and uses the new version next time', () => {
    const response = new Subject<{version: number}>();
    api['update'].mockReturnValue(response);
    const c = editor();
    c.save(true);
    c.addStep(); c.removeStep(0);
    c.draft()!.plan.title = 'Sửa thêm trong khi lưu'; c.touch();
    c.save();
    expect(api['update']).toHaveBeenCalledTimes(1);
    response.next({ version: 4 }); response.complete();
    expect(c.dirty()).toBe(true);
    expect(c.draft()!.plan.version).toBe(4);
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
