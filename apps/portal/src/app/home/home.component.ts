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
    .getResources({ page: 1, size: 4, status: 'APPROVED' })
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
    if (!resource || !resource.id) return;

    this.resourceService.downloadFile(resource.id).subscribe({
      next: (response) => {
        const contentDisposition = response.headers.get('content-disposition');
        let filename = 'tai_lieu_mac_dinh.pdf';

        if (contentDisposition) {
          const regex = /filename\*=UTF-8''(.+)/;
          const matches = regex.exec(contentDisposition);
          if (matches != null && matches[1]) {
            filename = decodeURIComponent(matches[1]);
          } else {
            const fallbackRegex = /filename="?([^"]+)"?/;
            const fallbackMatches = fallbackRegex.exec(contentDisposition);
            if (fallbackMatches != null && fallbackMatches[1]) {
              filename = fallbackMatches[1];
            }
          }
        } else if (resource.title) {
          const ext = resource.fileUrl?.split('.').pop() || 'pdf';
          filename = `${resource.title}.${ext}`;
        }

        const blob = response.body;
        if (blob) {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }

        resource.downloadCount = (resource.downloadCount || 0) + 1;
      },
      error: (err) => {
        console.error('Download failed', err);
        // Fallback
        if (resource.fileUrl) {
          this.openInNewTab(resource.fileUrl);
        }
      },
    });
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
