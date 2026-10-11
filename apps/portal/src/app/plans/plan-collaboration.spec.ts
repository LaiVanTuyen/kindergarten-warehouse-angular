import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { AuthService, LessonPlanDetail, LessonPlanService, ToastService } from '@kindergarten-warehouse/data-access';
import { PlanCollaborationComponent } from './plan-collaboration.component';

const detail = (patch: Partial<LessonPlanDetail['plan']> = {}): LessonPlanDetail => ({
  plan: {
    id: 3, title: 'Màu sắc', status: 'SHARED', template: false, reviewStatus: 'NONE', ownerId: 1, ownerName: 'Cô An',
    isOwner: true, stepCount: 1, version: 7, createdAt: '', updatedAt: '', ...patch,
  },
  stepMinutesTotal: 0,
  steps: [],
});

describe('Khối Phối hợp', () => {
  let api: Record<string, jest.Mock>;
  let toast: { show: jest.Mock };
  let roles: string[];

  beforeEach(() => {
    roles = ['TEACHER'];
    api = {
      collaboration: jest.fn(() => of({ teachersUsed: 0, usedByMe: false, comments: [] })),
      requestReview: jest.fn(() => of({})),
      decideReview: jest.fn(() => of({})),
    };
    toast = { show: jest.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: LessonPlanService, useValue: api },
        { provide: ToastService, useValue: toast },
        { provide: AuthService, useValue: { currentUser: () => ({ roles }) } },
      ],
    });
  });

  function make(d: LessonPlanDetail) {
    const c = TestBed.runInInjectionContext(() => new PlanCollaborationComponent());
    c.detail = d;
    c.ngOnChanges();
    return c;
  }

  it('chỉ chủ kế hoạch ĐÃ chia sẻ mới gửi duyệt được, và gửi lại sau khi bị yêu cầu sửa', () => {
    expect(make(detail()).canRequestReview).toBe(true);
    expect(make(detail({ status: 'DRAFT' })).canRequestReview).toBe(false);
    expect(make(detail({ isOwner: false })).canRequestReview).toBe(false);
    expect(make(detail({ reviewStatus: 'PENDING' })).canRequestReview).toBe(false);
    expect(make(detail({ reviewStatus: 'CHANGES_REQUESTED' })).canRequestReview).toBe(true);
  });

  it('admin duyệt gửi kèm version đang xem; yêu cầu sửa bắt buộc có nhận xét', () => {
    roles = ['ADMIN'];
    const c = make(detail({ reviewStatus: 'PENDING', isOwner: false }));
    expect(c.canDecide).toBe(true);
    c.decide('REQUEST_CHANGES');
    expect(api['decideReview']).not.toHaveBeenCalled();
    c.decide('APPROVE');
    expect(api['decideReview']).toHaveBeenCalledWith(3, 7, 'APPROVE', '');
  });

  it('kế hoạch vừa bị sửa (6905) thì báo và yêu cầu tải lại', () => {
    roles = ['ADMIN'];
    api['decideReview'].mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { code: 6905 } })));
    const c = make(detail({ reviewStatus: 'PENDING', isOwner: false }));
    const changed = jest.fn();
    c.changed.subscribe(changed);
    c.decide('APPROVE');
    expect(changed).toHaveBeenCalled();
    expect(toast.show).toHaveBeenCalledWith(expect.stringContaining('vừa thay đổi'), 'error');
  });
});
