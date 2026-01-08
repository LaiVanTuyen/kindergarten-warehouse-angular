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

  ngOnInit() {
    this.loadBanners();
  }

  loadBanners() {
    this.bannerService.getBanners().subscribe((data) => {
      // Simulate Backend Logic: Filter active and Sort by displayOrder
      this.slides = data
        .filter((slide) => slide.isActive)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

      if (this.slides.length > 0) {
        this.startAutoSlide();
      }
    });
  }

  ngOnDestroy() {
    this.stopAutoSlide();
  }

  startAutoSlide() {
    this.stopAutoSlide(); // Clear existing if any
    this.slideInterval = setInterval(() => {
      if (!this.isPaused) {
        this.activeSlideIndex =
          (this.activeSlideIndex + 1) % this.slides.length;
      }
    }, 7000); // 7 seconds
  }

  stopAutoSlide() {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
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
