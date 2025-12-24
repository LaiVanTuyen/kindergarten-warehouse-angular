import { Component, inject, OnInit, OnDestroy } from '@angular/core'; // Added OnInit, OnDestroy
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ResourceService, Resource } from '@kindergarten-warehouse/data-access';
import { map } from 'rxjs';

import { TranslatePipe } from '../pipes/translate.pipe';
import { ResourceCardComponent } from '../resource-card/resource-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe, ResourceCardComponent],
  templateUrl: './home.component.html',
  styles: [],
})
export class HomeComponent implements OnInit {
  // Implements OnInit
  private resourceService = inject(ResourceService);

  // Slider State
  activeSlideIndex = 0;
  private slideInterval: any;
  private isPaused = false;
  slides = [
    {
      title:
        'Discover a World of <br> <span class="text-primary-500">Fun</span> & <span class="text-secondary-600">Learning</span>',
      subtitle:
        'Explore thousands of engaging resources, songs, and stories perfect for early childhood education.',
      image: '/assets/images/banner_fun_learning.png',
      bgFrom: 'from-primary-50',
      bgTo: 'to-secondary-50',
    },
    {
      title:
        'Empower <span class="text-purple-500">Teachers</span> & <span class="text-yellow-500">Parents</span>',
      subtitle:
        'Curated lesson plans and activities to spark creativity in every child.',
      image: '/assets/images/banner_teachers_parents.png',
      bgFrom: 'from-purple-50',
      bgTo: 'to-yellow-50',
    },
    {
      title:
        'Learning Made <span class="text-green-500">Fun</span> and <span class="text-blue-500">Easy</span>',
      subtitle:
        'Interactive games and educational videos that kids love to play.',
      image: '/assets/images/banner_games.png',
      bgFrom: 'from-green-50',
      bgTo: 'to-blue-50',
    },
    {
      title:
        'Unlock <span class="text-pink-500">Creativity</span> with <span class="text-orange-500">Art</span>',
      subtitle: 'Printable coloring pages and crafts for artistic expression.',
      image: '/assets/images/banner_art.png',
      bgFrom: 'from-pink-50',
      bgTo: 'to-orange-50',
    },
  ];

  ngOnInit() {
    this.startAutoSlide();
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

  // Categories for Icon Grid
  categories = [
    {
      id: 'music',
      name: 'Music',
      icon: 'ph-music-note',
      color: 'bg-teal-100 text-teal-600',
    },
    {
      id: 'stories',
      name: 'Stories',
      icon: 'ph-book-open',
      color: 'bg-blue-100 text-blue-500',
    },
    {
      id: 'art',
      name: 'Art',
      icon: 'ph-paint-brush',
      color: 'bg-purple-100 text-purple-500',
    },
    {
      id: 'math',
      name: 'Math',
      icon: 'ph-calculator',
      color: 'bg-green-100 text-green-500',
    },
    {
      id: 'science',
      name: 'Science',
      icon: 'ph-atom',
      color: 'bg-yellow-100 text-yellow-500',
    },
    {
      id: 'games',
      name: 'Games',
      icon: 'ph-game-controller',
      color: 'bg-pink-100 text-pink-500',
    },
  ];

  // Get latest 4 resources
  latestResources$ = this.resourceService
    .getResources(1, 4)
    .pipe(map((res) => res.data));

  downloadResource(resource: Resource) {
    if (resource.url) {
      window.open(resource.url, '_blank');
    }
  }
}
