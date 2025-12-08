import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BannerService, Banner } from '@kindergarten-warehouse/data-access';
import { Observable, Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-banner-slider',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './banner-slider.component.html',
  styles: [],
})
export class BannerSliderComponent implements OnInit, OnDestroy {
  bannerService = inject(BannerService);
  banners$: Observable<Banner[]> = this.bannerService.getBanners();

  currentSlide = 0;
  totalSlides = 0;
  slideSubscription?: Subscription;

  ngOnInit() {
    this.banners$.subscribe((banners) => {
      this.totalSlides = banners.length;
      this.startAutoPlay();
    });
  }

  ngOnDestroy() {
    this.stopAutoPlay();
  }

  startAutoPlay() {
    this.slideSubscription = interval(5000).subscribe(() => {
      this.nextSlide();
    });
  }

  stopAutoPlay() {
    if (this.slideSubscription) {
      this.slideSubscription.unsubscribe();
    }
  }

  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
  }

  prevSlide() {
    this.currentSlide =
      (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
  }

  goToSlide(index: number) {
    this.currentSlide = index;
    this.stopAutoPlay();
    this.startAutoPlay(); // Restart timer
  }
}
