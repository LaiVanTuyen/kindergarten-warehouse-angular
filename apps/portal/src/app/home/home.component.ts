import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { catchError, map, of, shareReplay } from 'rxjs';

import {
  Category,
  CategoryService,
  Resource,
  ResourceDownloadService,
  ResourceService,
} from '@kindergarten-warehouse/data-access';
import { ResourceCardComponent } from '../resource-card/resource-card.component';
import { BannerSliderComponent } from '../banner-slider/banner-slider.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ResourceCardComponent,
    BannerSliderComponent,
  ],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly resourceService = inject(ResourceService);
  private readonly categoryService = inject(CategoryService);
  private readonly downloadService = inject(ResourceDownloadService);

  @ViewChild('categoryScroll') categoryScroll?: ElementRef<HTMLElement>;

  readonly categories$ = this.categoryService
    .getCategories(1, 12, undefined, false)
    .pipe(
      map((res) => (res.data ?? []).filter((cat: Category) => cat.isActive)),
      catchError(() => of<Category[]>([])),
      shareReplay({ bufferSize: 1, refCount: true })
    );

  readonly latestResources$ = this.resourceService
    .getPortalResources({ page: 1, size: 4, status: 'APPROVED' })
    .pipe(
      map((res) => res.data?.content ?? []),
      catchError(() => of<Resource[]>([])),
      shareReplay({ bufferSize: 1, refCount: true })
    );

  trackByResourceId = (_: number, r: Resource) => r.id;
  trackByCategoryId = (_: number, c: Category) => c.id;

  scrollCategories(direction: 'left' | 'right'): void {
    const el = this.categoryScroll?.nativeElement;
    if (!el) return;
    const step = 264; // card width (240) + gap (24)
    el.scrollTo({
      left: el.scrollLeft + (direction === 'left' ? -step : step),
      behavior: 'smooth',
    });
  }

  downloadResource(resource: Resource): void {
    this.downloadService.download(resource).subscribe({ error: () => void 0 });
  }
}
