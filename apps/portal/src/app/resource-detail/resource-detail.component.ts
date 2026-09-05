import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import localeVi from '@angular/common/locales/vi';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map, shareReplay, switchMap, tap } from 'rxjs/operators';

import {
  AuthService,
  CategoryService,
  Comment,
  CommentService,
  CreateCommentRequest,
  Resource,
  ResourceDownloadService,
  ResourceService,
  ToastService,
  TopicService,
  TranslationService,
  environment,
} from '@kindergarten-warehouse/data-access';
import { FileHelper } from '../shared/utils/file-helper';
import { ResourceCardComponent } from '../resource-card/resource-card.component';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { RatingStarsComponent } from '../shared/rating-stars/rating-stars.component';
import { SpinnerComponent } from '../shared/spinner/spinner.component';
import { TranslatePipe } from '../pipes/translate.pipe';

registerLocaleData(localeVi);

/**
 * Xin dư một bản ghi rồi cắt: tài liệu đang xem có thể nằm trong kết quả cùng
 * chủ đề. Lọc bỏ nó mà chỉ xin đúng 6 thì có lúc chỉ hiển thị được 5.
 */
const RELATED_FETCH_SIZE = 7;
const RELATED_DISPLAY_SIZE = 6;

interface BreadcrumbInfo {
  category: { id: string; name: string; slug: string } | null;
  topic: { id: string; name: string; slug: string } | null;
}

@Component({
  selector: 'app-resource-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TranslatePipe,
    ResourceCardComponent,
    EmptyStateComponent,
    RatingStarsComponent,
    SpinnerComponent,
  ],
  templateUrl: './resource-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly resourceService = inject(ResourceService);
  private readonly categoryService = inject(CategoryService);
  private readonly topicService = inject(TopicService);
  private readonly commentService = inject(CommentService);
  private readonly downloadService = inject(ResourceDownloadService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly toast = inject(ToastService);
  readonly authService = inject(AuthService);
  readonly translationService = inject(TranslationService);

  /** Comment form state (signal-based, template calls are reactive). */
  readonly newCommentContent = signal('');
  readonly newCommentRating = signal(5);
  readonly isSubmittingComment = signal(false);
  readonly isDownloading = signal(false);

  readonly resource$: Observable<Resource | null> = this.route.paramMap.pipe(
    switchMap((params) => {
      const slug = params.get('slug');
      if (!slug) return of(null);
      return this.resourceService.getResource(slug).pipe(
        map((res) => res.data ?? res.result ?? null),
        tap((resource) => {
          if (resource?.id) {
            // Fire and forget — a failed view-count should never block the page.
            this.resourceService.incrementViewCount(resource.id).subscribe({
              error: () => void 0,
            });
            this.loadComments(resource);
          }
        }),
        catchError(() => of(null))
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  /**
   * Breadcrumb = Category → Topic → Resource. The previous version fetched
   * *all* topics (size 1000) to resolve one id; now we call `/topics/:id`.
   */
  readonly breadcrumbInfo$: Observable<BreadcrumbInfo> = this.resource$.pipe(
    switchMap((resource) => {
      if (!resource?.topicId) {
        return of({ category: null, topic: null });
      }
      // Prefer the embedded topic + category the backend ships (avoids 2 round-trips).
      if (resource.topic?.categoryName) {
        return of({
          topic: {
            id: String(resource.topic.id),
            name: resource.topic.name,
            slug: resource.topic.slug,
          },
          category: {
            id: String(resource.topic.categoryId),
            name: resource.topic.categoryName,
            slug: '',
          },
        });
      }
      // Fallback: one call per level.
      return this.topicService.getTopic(resource.topicId).pipe(
        map((res) => res.result),
        switchMap((topic) => {
          if (!topic) return of({ category: null, topic: null });
          const topicSummary = {
            id: String(topic.id),
            name: topic.name,
            slug: topic.slug,
          };
          if (!topic.categoryId) {
            return of({ topic: topicSummary, category: null });
          }
          return this.categoryService.getCategories(1, 100).pipe(
            map((res) => {
              const category =
                (res.data ?? []).find(
                  (c) => String(c.id) === String(topic.categoryId)
                ) ?? null;
              return {
                topic: topicSummary,
                category: category
                  ? {
                      id: category.id,
                      name: category.name,
                      slug: category.slug,
                    }
                  : null,
              };
            })
          );
        }),
        catchError(() => of({ category: null, topic: null }))
      );
    })
  );

  /**
   * Tài liệu liên quan.
   *
   * Trước đây gọi `getResources()`, mà method đó hit `/api/v1/admin/resources`
   * — endpoint chỉ dành cho ADMIN. Khách và người dùng thường nhận 401, lỗi bị
   * `catchError` nuốt, nên khối này **luôn trống với mọi người trừ admin** mà
   * không ai phát hiện.
   *
   * Nay dùng `getPublicResources()` → `/api/v1/resources`, đi qua đúng
   * visibility policy của Portal: khách chỉ thấy PUBLIC đã duyệt, người đăng
   * nhập thấy thêm INTERNAL. Cookie phiên được gửi kèm nên USER nhận đúng phần
   * của mình.
   *
   * Xin `size: RELATED_FETCH_SIZE` (7) rồi cắt còn 6: tài liệu đang xem có thể
   * nằm trong kết quả, lọc bỏ nó mà chỉ xin 6 thì có lúc chỉ còn 5.
   * Về lâu dài nên có `GET /resources/{id}/related?size=6` để backend loại
   * chính nó TRƯỚC khi phân trang.
   */
  readonly relatedResources$ = this.resource$.pipe(
    switchMap((current) =>
      this.resourceService
        .getPublicResources({
          page: 1,
          size: RELATED_FETCH_SIZE,
          topicId: current?.topicId,
        })
        .pipe(
          map((res) =>
            (res.result?.content ?? res.data?.content ?? [])
              .filter((r) => r.id !== current?.id)
              .slice(0, RELATED_DISPLAY_SIZE)
          ),
          catchError((err) => {
            // Không im lặng hoàn toàn: khối bị ẩn nhưng lỗi phải thấy được
            // khi phát triển, nếu không một endpoint hỏng sẽ lại đi qua mà
            // không ai biết — đúng cách bug này đã tồn tại.
            if (!environment.production) {
              console.error('[resource-detail] Không tải được tài liệu liên quan', err);
            }
            return of<Resource[]>([]);
          })
        )
    )
  );

  ngOnInit(): void {
    // no-op; all streams are cold and bound via async pipe in template.
  }

  // trackBy helpers for *ngFor inside the template
  trackByCommentId = (_: number, c: Comment) => c.id;
  trackByResourceId = (_: number, r: Resource) => r.id;

  // -----------------------------------------------------------------------
  // Media / preview helpers (kept for template compatibility)
  // -----------------------------------------------------------------------
  isYouTube(url: string | undefined): boolean {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be');
  }

  getSafeVideoUrl(url: string | undefined): SafeResourceUrl {
    if (!url) return '';
    if (this.isYouTube(url)) {
      let videoId = '';
      if (url.includes('v=')) {
        videoId = url.split('v=')[1].split('&')[0];
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split(/[?&]/)[0];
      }
      return this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://www.youtube.com/embed/${videoId}`
      );
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  getSafeDocUrl(url: string | undefined): SafeResourceUrl {
    if (!url) return '';
    const viewer = `https://docs.google.com/gview?url=${encodeURIComponent(
      url
    )}&embedded=true`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(viewer);
  }

  canPreviewDoc(resource: Resource): boolean {
    if (!resource.fileUrl) return false;
    const type = (resource.type || resource.fileType || '').toUpperCase();
    return [
      'PDF',
      'WORD',
      'DOC',
      'DOCX',
      'DOCUMENT',
      'EXCEL',
      'PPT',
      'PPTX',
      'POWERPOINT',
    ].includes(type);
  }

  getFileIcon(type: string | undefined): string {
    return FileHelper.getFileIcon(type);
  }

  // -----------------------------------------------------------------------
  // Avatar color (stable hash → tailwind palette)
  // -----------------------------------------------------------------------
  private static readonly AVATAR_PALETTE = [
    'bg-red-100 text-red-600',
    'bg-orange-100 text-orange-600',
    'bg-amber-100 text-amber-600',
    'bg-green-100 text-green-600',
    'bg-emerald-100 text-emerald-600',
    'bg-teal-100 text-teal-600',
    'bg-cyan-100 text-cyan-600',
    'bg-sky-100 text-sky-600',
    'bg-blue-100 text-blue-600',
    'bg-indigo-100 text-indigo-600',
    'bg-violet-100 text-violet-600',
    'bg-purple-100 text-purple-600',
    'bg-fuchsia-100 text-fuchsia-600',
    'bg-pink-100 text-pink-600',
    'bg-rose-100 text-rose-600',
  ];

  getAvatarColor(name: string): string {
    const palette = ResourceDetailComponent.AVATAR_PALETTE;
    const source = (name || 'A').toString();
    let hash = 0;
    for (let i = 0; i < source.length; i++) {
      hash = source.charCodeAt(i) + ((hash << 5) - hash);
    }
    return palette[Math.abs(hash) % palette.length];
  }

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------
  followAuthor(authorName: string): void {
    if (!this.authService.isLoggedIn()) {
      this.toast.show('Vui lòng đăng nhập để theo dõi tác giả.', 'info');
      return;
    }
    this.toast.show(
      `Tính năng theo dõi "${authorName}" sẽ sớm có mặt.`,
      'info'
    );
  }

  downloadResource(resource: Resource | null | undefined): void {
    if (!resource?.id || this.isDownloading()) return;
    this.isDownloading.set(true);
    this.downloadService
      .download(resource)
      .pipe(finalize(() => this.isDownloading.set(false)))
      .subscribe({
        next: () => {
          resource.downloadCount = (resource.downloadCount ?? 0) + 1;
        },
        error: () => void 0,
      });
  }

  setCommentRating(value: number): void {
    this.newCommentRating.set(value);
  }

  submitComment(resource: Resource): void {
    if (!this.authService.isLoggedIn()) {
      this.toast.show('Vui lòng đăng nhập để bình luận.', 'info');
      return;
    }

    const content = this.newCommentContent().trim();
    if (!content || this.isSubmittingComment()) return;

    const payload: CreateCommentRequest = {
      content,
      rating: this.newCommentRating(),
    };

    this.isSubmittingComment.set(true);
    this.commentService
      .create(resource.id, payload)
      .pipe(finalize(() => this.isSubmittingComment.set(false)))
      .subscribe({
        next: (created) => {
          resource.comments = [created, ...(resource.comments ?? [])];
          this.newCommentContent.set('');
          this.newCommentRating.set(5);
          this.toast.show('Đã đăng bình luận của bạn.', 'success');
        },
        error: (err: HttpErrorResponse) => {
          const msg =
            err.status === 401
              ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
              : 'Không thể đăng bình luận. Vui lòng thử lại.';
          this.toast.show(msg, 'error');
        },
      });
  }

  private loadComments(resource: Resource): void {
    // Only call the API if the resource payload didn't already include comments.
    if (resource.comments && resource.comments.length > 0) return;
    this.commentService.list(resource.id, 1, 20).subscribe({
      next: (page) => {
        resource.comments = page.content ?? [];
      },
      error: () => void 0,
    });
  }
}
