import { Component, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  ResourceService,
  Resource,
  CategoryService,
  Category,
} from '@kindergarten-warehouse/data-access';
import { map, catchError, of } from 'rxjs';

import { TranslatePipe } from '../pipes/translate.pipe';
import { ResourceCardComponent } from '../resource-card/resource-card.component';
import { BannerSliderComponent } from '../banner-slider/banner-slider.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslatePipe,
    ResourceCardComponent,
    BannerSliderComponent,
  ],
  templateUrl: './home.component.html',
  styles: [],
})
export class HomeComponent {
  private resourceService = inject(ResourceService);
  private categoryService = inject(CategoryService);

  @ViewChild('categoryScroll') categoryScroll!: ElementRef;

  // Fetch categories dynamically from API
  categories$ = this.categoryService
    .getCategories(1, 12, undefined, false)
    .pipe(
      map((res) => res.data.filter((cat: Category) => cat.isActive)),
      catchError((err) => {
        console.error('Error fetching categories:', err);
        return of([]);
      })
    );

  // Get latest 4 resources
  latestResources$ = this.resourceService
    .getResources({ page: 0, size: 4, status: 'APPROVED' })
    .pipe(
      map((res) => res.data.content),
      catchError((err) => {
        console.error('Error fetching latest resources:', err);
        return of([]);
      })
    );

  scrollCategories(direction: 'left' | 'right') {
    const container = this.categoryScroll?.nativeElement;
    if (!container) return;

    const scrollAmount = 264; // Card 240px + Gap 24px
    const currentScroll = container.scrollLeft;
    const targetScroll =
      direction === 'left'
        ? currentScroll - scrollAmount
        : currentScroll + scrollAmount;

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    });
  }

  downloadResource(resource: Resource) {
    if (resource.fileUrl) {
      this.openInNewTab(resource.fileUrl);
    }
  }

  // Wrapper for testing safety
  private openInNewTab(url: string) {
    const win = window.open(url, '_blank');
    if (win) {
      win.focus();
    } else {
      console.warn('Popup blocked');
    }
  }
}
