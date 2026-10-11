import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener, ViewChild, computed, inject, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timeout } from 'rxjs';
import { LessonPlanDetail, LessonPlanService, Resource, environment, youtubeVideoId } from '@kindergarten-warehouse/data-access';
import { DocumentReaderComponent } from '@kindergarten-warehouse/ui';
import { ActivityClock } from './activity-clock';

type Check = { id: string; title: string; message: string; video: boolean; available: boolean };

@Component({
  selector: 'app-plan-presenter', standalone: true,
  imports: [CommonModule, RouterModule, DocumentReaderComponent],
  templateUrl: './plan-presenter.component.html', styleUrl: './plan-presenter.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanPresenterComponent {
  private readonly api = inject(LessonPlanService);
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroy = inject(DestroyRef);
  private readonly clock = new ActivityClock();
  @ViewChild('stage') stage?: ElementRef<HTMLElement>;
  readonly detail = signal<LessonPlanDetail | null>(null);
  readonly error = signal('');
  readonly busy = signal(false);
  readonly active = signal(false);
  readonly stepIndex = signal(0);
  readonly resourceIndex = signal(0);
  readonly notes = signal(false);
  readonly fullscreen = signal(false);
  readonly remaining = signal(0);
  readonly running = signal(false);
  readonly mediaError = signal('');
  readonly checks = signal<Check[]>([]);
  readonly videoChecked = signal<Record<string, boolean>>({});
  readonly trial = signal<Resource | null>(null);
  readonly step = computed(() => this.detail()?.steps[this.stepIndex()] ?? null);
  readonly resource = computed(() => {
    const ref = this.step()?.resources[this.resourceIndex()];
    return ref?.available ? ref.resource : null;
  });
  readonly youtubeUrl = computed(() => this.embed(this.resource()));
  readonly trialUrl = computed(() => this.embed(this.trial()));
  readonly timeLabel = computed(() => `${Math.floor(this.remaining() / 60).toString().padStart(2, '0')}:${(this.remaining() % 60).toString().padStart(2, '0')}`);
  readonly unchecked = computed(() => this.checks().filter(c => c.video && c.available && !this.videoChecked()[c.id]).length);
  private id = 0;

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(params => {
      this.id = Number(params.get('id'));
      this.active.set(false); this.detail.set(null); this.trial.set(null);
      this.pause(); this.load();
    });
    const tick = setInterval(() => this.tick(), 250);
    this.destroy.onDestroy(() => {
      clearInterval(tick);
      if (document.fullscreenElement === this.stage?.nativeElement) void document.exitFullscreen().catch(() => {});
    });
  }

  load(): void { this.fetch(false); }
  start(): void { this.fetch(true); }
  private fetch(start: boolean): void {
    if (this.busy()) return;
    if (!Number.isInteger(this.id) || this.id <= 0) { this.error.set('Không tìm thấy kế hoạch.'); return; }
    this.busy.set(true); this.error.set('');
    this.api.get(this.id).pipe(timeout(15000), takeUntilDestroyed(this.destroy)).subscribe({
      next: d => {
        this.detail.set(d); this.busy.set(false);
        if (start) {
          this.trial.set(null); this.active.set(true); this.notes.set(false); this.selectStep(0);
        } else this.prepareChecks(d);
      },
      error: () => { this.busy.set(false); this.error.set('Không mở được kế hoạch. Hãy kiểm tra kết nối và quyền truy cập rồi thử lại.'); },
    });
  }

  private prepareChecks(d: LessonPlanDetail): void {
    const refs = [...new Map(d.steps.flatMap(s => s.resources).map(r => [r.resourceId, r])).values()];
    this.checks.set(refs.map(ref => ({ id: ref.resourceId, title: ref.resource?.title || 'Học liệu không còn khả dụng',
      available: ref.available, video: ref.resource?.resourceType === 'YOUTUBE',
      message: !ref.available ? 'Không có quyền xem hoặc đã bị gỡ — sẽ bỏ qua khi trình chiếu.'
        : ref.resource?.resourceType === 'YOUTUBE' ? 'Cần internet. Hãy mở và phát thử trước buổi học.'
        : ['VIDEO', 'AUDIO', 'IMAGE'].includes(ref.resource?.fileType || '') ? 'Mở học liệu để kiểm tra âm thanh/hình ảnh.' : 'Đang kiểm tra bản xem trước…',
    })));
    for (const ref of refs) {
      const r = ref.resource;
      if (!ref.available || !r || r.resourceType === 'YOUTUBE' || ['VIDEO', 'AUDIO', 'IMAGE'].includes(r.fileType || '')) continue;
      this.http.get<{ result: { status: string; message: string } }>(`${environment.apiUrl}/resources/${encodeURIComponent(r.id)}/preview`)
        .pipe(timeout(15000), takeUntilDestroyed(this.destroy)).subscribe({
          next: res => this.checkMessage(r.id, res.result.status === 'READY' ? 'Bản xem trước sẵn sàng.'
            : res.result.status === 'PROCESSING' ? 'Đang tạo bản xem trước. Có thể cần chờ khi mở.' : res.result.message || 'Chưa có bản xem trước.'),
          error: () => this.checkMessage(r.id, 'Chưa kiểm tra được bản xem trước. Hãy mở thử hoặc kiểm tra lại kết nối.'),
        });
    }
  }
  private checkMessage(id: string, message: string): void {
    this.checks.update(list => list.map(c => c.id === id ? { ...c, message } : c));
  }
  preview(id: string): void {
    const ref = this.detail()?.steps.flatMap(s => s.resources).find(r => r.resourceId === id && r.available);
    this.trial.set(ref?.resource ?? null);
  }
  confirmTrial(): void {
    const r = this.trial(); if (!r) return;
    this.videoChecked.update(checked => ({ ...checked, [r.id]: true })); this.trial.set(null);
  }
  selectStep(index: number): void {
    if (!this.detail()?.steps[index]) return;
    this.stepIndex.set(index); this.resourceIndex.set(0); this.mediaError.set('');
    this.clock.reset(this.step()?.durationMinutes); this.tick();
  }
  next(delta: number): void { this.selectStep(this.stepIndex() + delta); }
  selectResource(index: number): void { this.resourceIndex.set(index); this.mediaError.set(''); }
  toggleTimer(): void {
    if (this.clock.running) this.clock.pause(Date.now()); else this.clock.start(Date.now());
    this.tick();
  }
  resetTimer(): void { this.clock.reset(this.step()?.durationMinutes); this.tick(); }
  pause(): void { this.clock.pause(Date.now()); this.tick(); }
  private tick(): void { this.remaining.set(this.clock.seconds(Date.now())); this.running.set(this.clock.running); }
  async toggleFullscreen(): Promise<void> {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (this.stage) await this.stage.nativeElement.requestFullscreen();
    } catch { this.error.set('Trình duyệt chưa cho phép toàn màn hình. Bạn vẫn có thể tiếp tục ở chế độ thường.'); }
  }
  @HostListener('document:fullscreenchange') fullscreenChanged(): void {
    this.fullscreen.set(document.fullscreenElement === this.stage?.nativeElement);
  }
  @HostListener('document:keydown', ['$event']) key(event: KeyboardEvent): void {
    if (!this.active() || event.ctrlKey || event.altKey || event.metaKey ||
      (event.target instanceof HTMLElement && (event.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(event.target.tagName)))) return;
    if (event.key === 'ArrowRight') this.next(1);
    else if (event.key === 'ArrowLeft') this.next(-1);
    else if (event.code === 'Space') this.toggleTimer();
    else if (event.key.toLowerCase() === 'n') this.notes.update(v => !v);
    else return;
    event.preventDefault();
  }
  /**
   * In-class playback goes through `/stream`, not `/file`: same access check, supports
   * Range (seeking), and does not count a download — a <video> issues many range requests.
   */
  fileUrl(r: Resource): string { return `${environment.apiUrl}/resources/${encodeURIComponent(r.id)}/stream`; }
  watchUrl(r: Resource): string { const id = youtubeVideoId(r.fileUrl); return id ? `https://www.youtube.com/watch?v=${id}` : ''; }
  private embed(r: Resource | null) {
    const id = r?.resourceType === 'YOUTUBE' ? youtubeVideoId(r.fileUrl) : null;
    return id ? this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${id}?rel=0&playsinline=1&origin=${encodeURIComponent(window.location.origin)}`) : null;
  }
}
