import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

import { Banner, BannerService } from '@kindergarten-warehouse/data-access';

/**
 * Carousel of promotional banners for the portal home page.
 *
 * Why this was rewritten: the previous version polled `/banners` every 30s
 * which generated 120 requests per user per hour for content that almost
 * never changes. Now we fetch once, and only re-fetch when the tab returns
 * to the foreground or the user explicitly asks to retry.
 */
@Component({
  selector: 'app-banner-slider',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './banner-slider.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BannerSliderComponent implements OnInit {
  private readonly bannerService = inject(BannerService);
  private readonly destroyRef = inject(DestroyRef);

  readonly slides = signal<Banner[]>([]);
  readonly activeIndex = signal(0);
  readonly error = signal(false);

  private readonly isPaused = signal(false);
  readonly hasSlides = computed(() => this.slides().length > 0);

  /** Autoplay cadence — in ms. */
  private static readonly AUTOPLAY_MS = 7000;

  ngOnInit(): void {
    this.loadBanners();

    interval(BannerSliderComponent.AUTOPLAY_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.isPaused() || !this.hasSlides()) return;
        this.activeIndex.update(
          (i) => (i + 1) % Math.max(this.slides().length, 1)
        );
      });
  }

  /** Re-fetch when the user switches back to this tab. */
  @HostListener('document:visibilitychange')
  onVisibilityChange(): void {
    if (document.visibilityState === 'visible' && !this.hasSlides()) {
      this.loadBanners();
    }
  }

  loadBanners(): void {
    this.error.set(false);
    this.bannerService
      .getActiveBanners('WEB')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.slides.set(response.result ?? []);
          // Reset to the first slide if the previous index is now out-of-bounds.
          if (this.activeIndex() >= this.slides().length) {
            this.activeIndex.set(0);
          }
        },
        error: () => this.error.set(true),
      });
  }

  goTo(index: number): void {
    const count = this.slides().length;
    if (count === 0) return;
    this.activeIndex.set(((index % count) + count) % count);
  }

  next(): void {
    this.goTo(this.activeIndex() + 1);
  }

  prev(): void {
    this.goTo(this.activeIndex() - 1);
  }

  onMouseEnter(): void {
    this.isPaused.set(true);
  }

  onMouseLeave(): void {
    this.isPaused.set(false);
    this.isDragging = false;
  }

  // Touch / drag handling -------------------------------------------------
  private touchStartX = 0;
  private touchEndX = 0;
  private readonly MIN_SWIPE = 50;
  private isDragging = false;

  onTouchStart(e: TouchEvent): void {
    this.touchStartX = e.changedTouches[0].screenX;
  }

  onTouchEnd(e: TouchEvent): void {
    this.touchEndX = e.changedTouches[0].screenX;
    this.handleSwipe();
  }

  onMouseDown(e: MouseEvent): void {
    this.isDragging = true;
    this.touchStartX = e.clientX;
  }

  onMouseUp(e: MouseEvent): void {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.touchEndX = e.clientX;
    this.handleSwipe();
  }

  private handleSwipe(): void {
    const distance = this.touchEndX - this.touchStartX;
    if (Math.abs(distance) < this.MIN_SWIPE) return;
    distance < 0 ? this.next() : this.prev();
  }

  trackBySlideId = (_: number, banner: Banner) => banner.id;
}
