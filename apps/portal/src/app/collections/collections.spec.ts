import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import {
  CollectionDetail,
  CollectionService,
  LessonPlanService,
  ResourceService,
  ToastService,
} from '@kindergarten-warehouse/data-access';
import { CollectionDetailComponent } from './collection-detail.component';
import { AddToCollectionDialogComponent } from './add-to-collection-dialog.component';

function detail(): CollectionDetail {
  return {
    collection: {
      id: 7, title: 'Động vật quanh bé', visibility: 'PRIVATE', ownerId: 1, ownerName: 'Cô An',
      isOwner: true, itemCount: 3, version: 0, createdAt: '', updatedAt: '',
    },
    items: [11, 12, 13].map((id, position) => ({
      id, position, resourceId: `r${id}`, available: true, note: null, resource: null,
    })),
  };
}

const conflict = new HttpErrorResponse({ status: 409, error: { code: 6806 } });

describe('Bộ học liệu (FE)', () => {
  let api: Record<string, jest.Mock>;
  let toast: { show: jest.Mock };

  beforeEach(() => {
    api = {
      get: jest.fn(() => of(detail())),
      reorder: jest.fn(() => of({})),
      membership: jest.fn(() => of([])),
      create: jest.fn(() => of({ id: 99, title: 'Bộ mới' })),
      addItem: jest.fn(() => of({})),
    };
    toast = { show: jest.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: CollectionService, useValue: api },
        { provide: ToastService, useValue: toast },
        { provide: ResourceService, useValue: {} },
        { provide: LessonPlanService, useValue: { create: jest.fn() } },
        { provide: Router, useValue: { navigate: jest.fn() } },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: '7' })) } },
      ],
    });
  });

  it('đổi thứ tự hiển thị ngay và gửi đủ danh sách id theo thứ tự mới', () => {
    const c = TestBed.runInInjectionContext(() => new CollectionDetailComponent());

    c.move(2, -1);

    expect(c.detail()!.items.map((i) => i.id)).toEqual([11, 13, 12]);
    expect(c.detail()!.items.map((i) => i.position)).toEqual([0, 1, 2]);
    expect(api['reorder']).toHaveBeenCalledWith(7, [11, 13, 12]);
  });

  it('server từ chối vì dữ liệu cũ thì báo và tải lại bản mới nhất', () => {
    api['reorder'].mockReturnValue(throwError(() => conflict));
    const c = TestBed.runInInjectionContext(() => new CollectionDetailComponent());
    api['get'].mockClear();

    c.move(0, 1);

    expect(toast.show).toHaveBeenCalledWith(expect.stringContaining('thay đổi ở nơi khác'), 'info');
    expect(api['get']).toHaveBeenCalledTimes(1);
    expect(c.detail()!.items.map((i) => i.id)).toEqual([11, 12, 13]);
  });

  it('không di chuyển ra ngoài biên', () => {
    const c = TestBed.runInInjectionContext(() => new CollectionDetailComponent());
    c.move(0, -1);
    expect(api['reorder']).not.toHaveBeenCalled();
  });

  it('"Tạo và thêm": tạo được bộ nhưng thêm tài liệu lỗi thì KHÔNG đánh dấu "Đã có"', () => {
    api['addItem'].mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    const d = TestBed.runInInjectionContext(() => new AddToCollectionDialogComponent());
    d.resourceId = 'r1';
    d.ngOnInit();
    d.newTitle = 'Bộ mới';

    d.createAndAdd();

    expect(d.collections()).toEqual([{ id: 99, title: 'Bộ mới', itemCount: 0, containsResource: false }]);
    expect(toast.show).toHaveBeenCalledWith('Không thêm được vào bộ học liệu.', 'error');
  });

  it('thêm trùng (6803) thì coi như đã có, không báo lỗi', () => {
    api['membership'].mockReturnValue(of([{ id: 5, title: 'Bộ A', itemCount: 1, containsResource: false }]));
    api['addItem'].mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { code: 6803 } })));
    const d = TestBed.runInInjectionContext(() => new AddToCollectionDialogComponent());
    d.resourceId = 'r1';
    d.ngOnInit();

    d.add(d.collections()[0]);

    expect(d.collections()[0].containsResource).toBe(true);
    expect(toast.show).toHaveBeenCalledWith('Tài liệu đã có trong bộ này.', 'info');
  });
});
