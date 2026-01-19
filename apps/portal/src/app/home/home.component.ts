import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ResourceService, Resource } from '@kindergarten-warehouse/data-access';
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
    .getResources({ page: 0, size: 4, status: 'APPROVED' })
    .pipe(
      map((res) => res.data.content),
      catchError((err) => {
        console.error('Error fetching latest resources:', err);
        return of([]);
      })
    );

  downloadResource(resource: Resource) {
    if (resource.fileUrl) {
      window.open(resource.fileUrl, '_blank');
    }
  }
}
