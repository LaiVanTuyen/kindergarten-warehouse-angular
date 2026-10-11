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
  FavoritesService,
  Resource,
  REPORT_REASON_LABELS,
  ReportReason,
  ReportService,
  ResourceDownloadService,
  ResourceService,
  ToastService,
  TopicService,
  TranslationService,
  environment,
  youtubeVideoId,
} from '@kindergarten-warehouse/data-access';
import { FileHelper } from '../shared/utils/file-helper';
import { ResourceCardComponent } from '../resource-card/resource-card.component';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { RatingStarsComponent } from '../shared/rating-stars/rating-stars.component';
import { SpinnerComponent } from '../shared/spinner/spinner.component';
import { TranslatePipe } from '../pipes/translate.pipe';
import { DocumentReaderComponent } from './document-reader.component';
import { AddToCollectionDialogComponent } from '../collections/add-to-collection-dialog.component';

registerLocaleData(localeVi);

/**
 * Xin dư một bản ghi rồi cắt: tài liệu đang xem có thể nằm trong kết quả cùng
 * chủ đề. Lọc bỏ nó mà chỉ xin đúng 6 thì có lúc chỉ hiển thị được 5.
 */
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
    DocumentReaderComponent,
    AddToCollectionDialogComponent,
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
  private readonly favorites = inject(FavoritesService);
  private readonly downloadService = inject(ResourceDownloadService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly toast = inject(ToastService);
  private readonly reportService = inject(ReportService);
  readonly authService = inject(AuthService);
  readonly translationService = inject(TranslationService);

  /** Comment form state (signal-based, template calls are reactive). */
  readonly newCommentContent = signal('');
  readonly newCommentRating = signal(5);
  readonly isSubmittingComment = signal(false);
  readonly isDownloading = signal(false);
  readonly isLoadingResource = signal(true);
  readonly resourceError = signal('');

  readonly resource$: Observable<Resource | null> = this.route.paramMap.pipe(
    switchMap((params) => {
      this.isLoadingResource.set(true);
      this.resourceError.set('');
      const slug = params.get('slug');
      if (!slug) {
        this.isLoadingResource.set(false);
        this.resourceError.set('Không tìm thấy tài liệu.');
        return of(null);
      }
      return this.resourceService.getResource(slug).pipe(
        map((res) => {
          const value = res.data ?? res.result;
          return value ? { ...value, type: value.type ?? value.fileType,
            topicId: value.topicId ?? String(value.topic?.id ?? '') } : null;
        }),
        tap((resource) => {
          if (resource?.id) {
            // Fire and forget — a failed view-count should never block the page.
            this.resourceService.incrementViewCount(resource.id).subscribe({
              error: () => void 0,
            });
            this.loadComments(resource);
          }
        }),
        catchError((error: HttpErrorResponse) => {
          this.resourceError.set(error.status === 410 ? 'Tài liệu này đã được gỡ khỏi kho học liệu.'
            : error.status === 404 ? 'Không tìm thấy tài liệu hoặc bạn không có quyền xem.'
            : 'Không tải được tài liệu. Vui lòng kiểm tra kết nối và thử lại.');
          return of(null);
        }),
        finalize(() => this.isLoadingResource.set(false))
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
   * Tài liệu liên quan: `GET /resources/{slug}/related`.
   *
   * Backend ưu tiên cùng chủ đề rồi cùng danh mục, loại tài liệu đang xem
   * TRƯỚC khi phân trang và áp đúng visibility của Portal — FE không còn phải
   * xin dư 1 bản ghi rồi tự lọc.
   */
  readonly relatedResources$ = this.resource$.pipe(
    switchMap((current) => {
      if (!current?.slug) return of<Resource[]>([]);
      return this.resourceService.getRelatedResources(current.slug, RELATED_DISPLAY_SIZE).pipe(
        catchError((err) => {
          // Khối bị ẩn nhưng lỗi vẫn phải thấy được khi phát triển, nếu không
          // một endpoint hỏng sẽ lại đi qua mà không ai biết.
          if (!environment.production) {
            console.error('[resource-detail] Không tải được tài liệu liên quan', err);
          }
          return of<Resource[]>([]);
        })
      );
    })
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
    return youtubeVideoId(url) !== null;
  }

  getSafeVideoUrl(url: string | undefined): SafeResourceUrl {
    const id = youtubeVideoId(url);
    if (!id) return '';
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${id}?rel=0&playsinline=1&origin=${encodeURIComponent(window.location.origin)}`
    );
  }

  youtubeWatchUrl(url: string | undefined): string {
    const id = youtubeVideoId(url);
    return id ? `https://www.youtube.com/watch?v=${id}` : '';
  }

  getFileIcon(type: string | undefined): string {
    return FileHelper.getFileIcon(type);
  }

  formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return '—';
    return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB`
      : `${(bytes / (1024 * 1024)).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} MB`;
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
  async shareResource(resource: Resource): Promise<void> {
    const url = new URL(`/resources/${encodeURIComponent(resource.slug)}`, window.location.origin).href;
    try {
      await navigator.clipboard.writeText(url);
      this.toast.show('Đã sao chép liên kết. Người nhận vẫn cần quyền truy cập tài liệu.', 'success');
    } catch {
      this.toast.show('Không thể sao chép tự động. Bạn có thể sao chép địa chỉ trên trình duyệt.', 'info');
    }
  }

  // -----------------------------------------------------------------------
  // Báo cáo vi phạm
  // -----------------------------------------------------------------------
  readonly reportReasons = (Object.keys(REPORT_REASON_LABELS) as ReportReason[]).map((value) => ({
    value,
    label: REPORT_REASON_LABELS[value],
  }));
  readonly reportOpen = signal(false);
  /** "Thêm vào bộ" dialog — teachers/admins only (collections are a teacher tool). */
  readonly collectionDialogOpen = signal(false);
  readonly canCollect = computed(() => {
    const roles = this.authService.currentUser()?.roles ?? [];
    return roles.includes('TEACHER') || roles.includes('ADMIN');
  });
  readonly isReporting = signal(false);
  reportReason: ReportReason | null = null;
  reportDetails = '';

  openReport(): void {
    if (!this.authService.isLoggedIn()) {
      this.toast.show('Vui lòng đăng nhập để báo cáo vi phạm.', 'info');
      return;
    }
    this.reportReason = null;
    this.reportDetails = '';
    this.reportOpen.set(true);
  }

  closeReport(): void {
    if (!this.isReporting()) this.reportOpen.set(false);
  }

  submitReport(resource: Resource): void {
    if (!this.reportReason || this.isReporting()) return;
    this.isReporting.set(true);
    this.reportService
      .create(resource.id, this.reportReason, this.reportDetails.trim() || undefined)
      .pipe(finalize(() => this.isReporting.set(false)))
      .subscribe({
        next: () => {
          this.reportOpen.set(false);
          this.toast.show('Đã gửi báo cáo. Cảm ơn bạn đã giúp kho học liệu an toàn hơn.', 'success');
        },
        error: (err: HttpErrorResponse) => {
          this.toast.show(
            err.error?.code === 6602
              ? 'Bạn đã báo cáo tài liệu này, báo cáo đang được xem xét.'
              : 'Không gửi được báo cáo. Vui lòng thử lại.',
            'error'
          );
        },
      });
  }

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

  isFavorited(resource: Resource): boolean {
    return this.favorites.isFavorited(resource.id) || !!resource.isFavorited;
  }

  toggleFavorite(resource: Resource): void {
    if (!this.authService.isLoggedIn()) {
      this.toast.show('Vui lòng đăng nhập để lưu tài liệu yêu thích.', 'info');
      return;
    }

    const willFavorite = !this.favorites.isFavorited(resource.id);
    this.favorites.toggle(resource.id).subscribe({
      next: (favorited) => {
        resource.isFavorited = favorited;
        this.toast.show(
          favorited
            ? 'Đã thêm vào danh sách yêu thích.'
            : 'Đã bỏ khỏi danh sách yêu thích.',
          'success'
        );
      },
      error: () => {
        this.toast.show('Không thể cập nhật yêu thích. Vui lòng thử lại.', 'error');
        resource.isFavorited = !willFavorite;
      },
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
