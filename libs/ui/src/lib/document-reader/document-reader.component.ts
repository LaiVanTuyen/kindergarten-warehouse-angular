import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  Input,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  BehaviorSubject,
  EMPTY,
  catchError,
  exhaustMap,
  map,
  switchMap,
  takeWhile,
  timeout,
  timer,
} from 'rxjs';
import { Resource, environment } from '@kindergarten-warehouse/data-access';

export interface PreviewManifest {
  status: 'PROCESSING' | 'READY' | 'FAILED' | 'UNSUPPORTED' | 'BUSY';
  pageCount: number;
  totalPages: number;
  truncated: boolean;
  message: string;
}

@Component({
  selector: 'app-document-reader',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './document-reader.component.html',
  styleUrl: './document-reader.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentReaderComponent {
  @Input() presentation = false;
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly requests = new BehaviorSubject<Resource | null>(null);
  private current: Resource | null = null;
  readonly manifest = signal<PreviewManifest | null>(null);
  readonly error = signal('');
  readonly page = signal(1);
  readonly zoom = signal(100);
  readonly imageLoading = signal(true);
  readonly imageFailed = signal(false);
  readonly isFullscreen = signal(false);
  @ViewChild('reader') reader?: ElementRef<HTMLElement>;

  @Input({ required: true }) set resource(value: Resource) {
    this.current = value;
    this.reset();
    this.requests.next(value);
  }

  constructor() {
    this.requests
      .pipe(
        switchMap((resource) => {
          if (!resource?.id) return EMPTY;
          const deadline = Date.now() + 5 * 60 * 1000;
          return timer(0, 2500).pipe(
            // Do not cancel an in-flight response merely because the next poll tick arrives.
            exhaustMap(() =>
              this.http
                .get<{ result: PreviewManifest }>(
                  `${environment.apiUrl}/resources/${encodeURIComponent(
                    resource.id
                  )}/preview`,
                  { withCredentials: true }
                )
                .pipe(timeout(10000))
            ),
            map((response, index) =>
              (index >= 120 || Date.now() >= deadline) &&
              response.result.status === 'PROCESSING'
                ? {
                    result: {
                      ...response.result,
                      status: 'BUSY' as const,
                      message:
                        'Xử lý đang mất nhiều thời gian hơn dự kiến. Vui lòng kiểm tra lại sau.',
                    },
                  }
                : response
            ),
            // Complete on terminal states; after five minutes stop rather than poll forever.
            takeWhile(
              (response) => response.result.status === 'PROCESSING',
              true
            ),
            catchError((error) => {
              this.error.set(
                error.status === 404
                  ? 'Tài liệu không tồn tại hoặc bạn không có quyền xem.'
                  : error.status === 410
                  ? 'Tài liệu này đã được gỡ.'
                  : 'Chưa kết nối được bản xem trước. Vui lòng thử lại.'
              );
              return EMPTY;
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((response) => {
        this.manifest.set(response.result);
      });
  }

  get imageUrl(): string {
    if (!this.current) return '';
    return `${environment.apiUrl}/resources/${encodeURIComponent(
      this.current.id
    )}/preview/pages/${this.page()}`;
  }

  get title(): string {
    return this.current?.title ?? 'Tài liệu';
  }

  goTo(value: number | string): void {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    const maximum = this.manifest()?.pageCount ?? 1;
    const next = Math.min(maximum, Math.max(1, Math.trunc(parsed)));
    if (next === this.page()) return;
    this.page.set(next);
    this.imageFailed.set(false);
    this.imageLoading.set(true);
  }

  changeZoom(delta: number): void {
    this.zoom.update((value) => Math.min(300, Math.max(60, value + delta)));
  }

  retry(): void {
    this.reset();
    this.requests.next(this.current);
  }

  async fullscreen(): Promise<void> {
    const element = this.reader?.nativeElement;
    if (!element) return;
    const owner = element.ownerDocument;
    try {
      if (owner.fullscreenElement || this.isFullscreen()) {
        await owner.exitFullscreen();
        this.isFullscreen.set(false);
      } else {
        await element.requestFullscreen();
        this.isFullscreen.set(true);
      }
    } catch {
      this.error.set(
        'Trình duyệt chưa hỗ trợ toàn màn hình. Bạn vẫn có thể phóng to để đọc.'
      );
    }
  }

  @HostListener('document:fullscreenchange')
  onFullscreenChange(): void {
    // Escape/native browser exit must not leave the next button click in stale state.
    this.isFullscreen.set(!!this.reader?.nativeElement.matches(':fullscreen'));
  }

  private reset(): void {
    this.manifest.set(null);
    this.error.set('');
    this.page.set(1);
    this.zoom.set(100);
    this.imageLoading.set(true);
    this.imageFailed.set(false);
  }
}
