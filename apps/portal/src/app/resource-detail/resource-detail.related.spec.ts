import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { of, throwError, Subject } from 'rxjs';
import { convertToParamMap } from '@angular/router';

import {
  AuthService,
  CategoryService,
  CommentService,
  FavoritesService,
  ResourceDownloadService,
  ResourceService,
  ToastService,
  TopicService,
  TranslationService,
  environment,
} from '@kindergarten-warehouse/data-access';

import { ResourceDetailComponent } from './resource-detail.component';

/**
 * Hồi quy cho khối "Tài liệu liên quan".
 *
 * Lỗi gốc: khối này gọi `getResources()` — method hit `/api/v1/admin/resources`,
 * endpoint chỉ dành cho ADMIN. Khách nhận 401, `catchError` nuốt lỗi, nên khối
 * luôn trống với mọi người trừ admin mà không ai phát hiện.
 *
 * PHẠM VI: đây là test FE với service đã mock. Nó chứng minh **component gọi
 * đúng service và xử lý dữ liệu đúng**. Nó KHÔNG chứng minh backend lọc đúng
 * visibility — mock trả gì thì component nhận nấy. Phần "Guest không nhận
 * INTERNAL/PRIVATE" phải do integration test phía backend hoặc
 * `perf/check-query-count.sh` khẳng định.
 */
describe('ResourceDetailComponent — tài liệu liên quan', () => {
  const CURRENT_ID = 'res-current';
  const TOPIC_ID = 42;

  let resourceService: {
    getResource: jest.Mock;
    getPortalResources: jest.Mock;
    getResources: jest.Mock;
    incrementViewCount: jest.Mock;
  };
  let paramMap$: Subject<ReturnType<typeof convertToParamMap>>;

  const currentResource = {
    id: CURRENT_ID,
    slug: 'tai-lieu-dang-xem',
    title: 'Tài liệu đang xem',
    topicId: TOPIC_ID,
    comments: [{ id: 1 }],
  };

  function relatedPage(count: number, includeCurrent = false) {
    const content = Array.from({ length: count }, (_, i) => ({
      id: `res-${i}`,
      slug: `tai-lieu-${i}`,
      title: `Tài liệu ${i}`,
    }));
    if (includeCurrent) {
      content[0] = { ...currentResource } as never;
    }
    return of({ code: 1000, result: { content, totalElements: count } });
  }

  function createComponent(): ResourceDetailComponent {
    return TestBed.runInInjectionContext(() => new ResourceDetailComponent());
  }

  beforeEach(() => {
    paramMap$ = new Subject();

    resourceService = {
      getResource: jest.fn().mockReturnValue(of({ result: currentResource })),
      getPortalResources: jest.fn().mockReturnValue(relatedPage(7)),
      getResources: jest.fn().mockReturnValue(relatedPage(7)),
      incrementViewCount: jest.fn().mockReturnValue(of(void 0)),
    };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { paramMap: paramMap$.asObservable() },
        },
        { provide: ResourceService, useValue: resourceService },
        { provide: CategoryService, useValue: { getCategories: jest.fn(() => of({ data: [] })) } },
        { provide: TopicService, useValue: { getTopic: jest.fn(() => of({ result: null })) } },
        { provide: CommentService, useValue: { list: jest.fn(() => of({ content: [] })) } },
        // Merge tu 063bc2b them FavoritesService vao component; mock de test
        // van tap trung vao khoi "tai lieu lien quan".
        {
          provide: FavoritesService,
          useValue: { ids: () => new Set<string>(), isFavorited: () => false, toggle: jest.fn(() => of(false)) },
        },
        { provide: ResourceDownloadService, useValue: { download: jest.fn() } },
        { provide: DomSanitizer, useValue: { bypassSecurityTrustResourceUrl: (u: string) => u } },
        { provide: ToastService, useValue: { error: jest.fn(), success: jest.fn() } },
        { provide: AuthService, useValue: { isLoggedIn: () => false, formatAssetUrl: (u: string) => u } },
        { provide: TranslationService, useValue: { translate: (k: string) => k } },
      ],
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function emitRoute() {
    paramMap$.next(convertToParamMap({ slug: currentResource.slug }));
  }

  it('gọi service công khai, KHÔNG gọi service admin', (done) => {
    const component = createComponent();

    component.relatedResources$.subscribe(() => {
      expect(resourceService.getPortalResources).toHaveBeenCalledTimes(1);
      expect(resourceService.getResources).not.toHaveBeenCalled();
      done();
    });

    emitRoute();
  });

  it('truyền đúng topicId và size = 7', (done) => {
    const component = createComponent();

    component.relatedResources$.subscribe(() => {
      expect(resourceService.getPortalResources).toHaveBeenCalledWith(
        expect.objectContaining({ topicId: TOPIC_ID, size: 7 })
      );
      done();
    });

    emitRoute();
  });

  it('loại tài liệu đang xem khỏi kết quả', (done) => {
    resourceService.getPortalResources.mockReturnValue(relatedPage(7, true));
    const component = createComponent();

    component.relatedResources$.subscribe((list) => {
      expect(list.some((r) => r.id === CURRENT_ID)).toBe(false);
      done();
    });

    emitRoute();
  });

  it('sau khi loại vẫn hiển thị tối đa 6 — xin 7 nên không bị tụt xuống 5', (done) => {
    resourceService.getPortalResources.mockReturnValue(relatedPage(7, true));
    const component = createComponent();

    component.relatedResources$.subscribe((list) => {
      // 7 tra ve, 1 la chinh no -> 6 con lai
      expect(list).toHaveLength(6);
      done();
    });

    emitRoute();
  });

  it('cắt còn 6 khi API trả nhiều hơn', (done) => {
    resourceService.getPortalResources.mockReturnValue(relatedPage(7));
    const component = createComponent();

    component.relatedResources$.subscribe((list) => {
      expect(list).toHaveLength(6);
      done();
    });

    emitRoute();
  });

  it('API lỗi thì trả mảng rỗng, không làm hỏng luồng', (done) => {
    resourceService.getPortalResources.mockReturnValue(
      throwError(() => ({ status: 500 }))
    );
    const component = createComponent();

    component.relatedResources$.subscribe({
      next: (list) => {
        expect(list).toEqual([]);
        done();
      },
      error: () => done.fail('luồng không được vỡ khi API lỗi'),
    });

    emitRoute();
  });

  it('ghi console.error khi KHÔNG phải production', (done) => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => void 0);
    const original = environment.production;
    (environment as { production: boolean }).production = false;

    resourceService.getPortalResources.mockReturnValue(
      throwError(() => ({ status: 401 }))
    );
    const component = createComponent();

    component.relatedResources$.subscribe(() => {
      expect(spy).toHaveBeenCalled();
      (environment as { production: boolean }).production = original;
      done();
    });

    emitRoute();
  });

  it('KHÔNG ghi console.error ở production', (done) => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => void 0);
    const original = environment.production;
    (environment as { production: boolean }).production = true;

    resourceService.getPortalResources.mockReturnValue(
      throwError(() => ({ status: 401 }))
    );
    const component = createComponent();

    component.relatedResources$.subscribe(() => {
      expect(spy).not.toHaveBeenCalled();
      (environment as { production: boolean }).production = original;
      done();
    });

    emitRoute();
  });

  it('đổi route thì gọi lại và chỉ giữ kết quả mới nhất', (done) => {
    const component = createComponent();
    const seen: unknown[][] = [];

    const sub = component.relatedResources$.subscribe((list) => {
      seen.push(list);
      if (seen.length === 2) {
        // switchMap huy request cu; lan phat thu hai la cua route moi
        expect(resourceService.getPortalResources).toHaveBeenCalledTimes(2);
        sub.unsubscribe();
        done();
      }
    });

    emitRoute();
    paramMap$.next(convertToParamMap({ slug: 'tai-lieu-khac' }));
  });
});
