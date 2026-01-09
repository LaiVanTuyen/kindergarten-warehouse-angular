import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BannerService, Banner } from '@kindergarten-warehouse/data-access';

@Component({
  selector: 'app-banner-slider',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './banner-slider.component.html',
  styles: [],
})
export class BannerSliderComponent implements OnInit, OnDestroy {
  // Slider State
  activeSlideIndex = 0;
  private slideInterval: any;
  private isPaused = false;
  slides: Banner[] = [];
  private bannerService = inject(BannerService);
  private refreshInterval: any;

  ngOnInit() {
    this.loadBanners();
    // Auto-refresh data every 30 seconds to catch Admin updates
    this.refreshInterval = setInterval(() => {
      this.loadBanners();
    }, 30000);
  }

  loadBanners() {
    this.bannerService.getActiveBanners('WEB').subscribe({
      next: (response: any) => {
        if (response.result) {
          const data = response.result || [];
          this.slides = data;

          // Only start slider if not already running (first load)
          if (this.slides.length > 0 && !this.slideInterval) {
            this.startAutoSlide();
          }
        }
      },
      error: (err: any) => console.error('Failed to load portal banners', err),
    });
  }

  ngOnDestroy() {
    this.stopAutoSlide();
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  startAutoSlide() {
    this.stopAutoSlide(); // Clear existing if any
    this.slideInterval = setInterval(() => {
      if (!this.isPaused && this.slides.length > 0) {
        this.activeSlideIndex =
          (this.activeSlideIndex + 1) % this.slides.length;
      }
    }, 7000); // 7 seconds
  }

  stopAutoSlide() {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
      this.slideInterval = null;
    }
  }

  onMouseEnter() {
    this.isPaused = true;
  }

  onMouseLeave() {
    this.isPaused = false;
    this.isDragging = false; // Reset drag
  }

  // Swipe Logic
  private touchStartX = 0;
  private touchEndX = 0;
  private minSwipeDistance = 50;
  private isDragging = false;

  onTouchStart(e: TouchEvent) {
    this.touchStartX = e.changedTouches[0].screenX;
  }

  onTouchEnd(e: TouchEvent) {
    this.touchEndX = e.changedTouches[0].screenX;
    this.handleSwipe();
  }

  onMouseDown(e: MouseEvent) {
    this.isDragging = true;
    this.touchStartX = e.clientX;
  }

  onMouseUp(e: MouseEvent) {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.touchEndX = e.clientX;
    this.handleSwipe();
  }

  private handleSwipe() {
    const swipeDistance = this.touchEndX - this.touchStartX;
    if (Math.abs(swipeDistance) > this.minSwipeDistance) {
      if (swipeDistance < 0) {
        // Swipe Left -> Next Slide
        this.activeSlideIndex =
          (this.activeSlideIndex + 1) % this.slides.length;
      } else {
        // Swipe Right -> Prev Slide
        this.activeSlideIndex =
          (this.activeSlideIndex - 1 + this.slides.length) % this.slides.length;
      }
      // Reset timer on manual interaction
      this.startAutoSlide();
    }
  }
}
