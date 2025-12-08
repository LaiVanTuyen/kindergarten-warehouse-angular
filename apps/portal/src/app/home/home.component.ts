import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ResourceService } from '@kindergarten-warehouse/data-access';
import { BannerSliderComponent } from '../banner-slider/banner-slider.component';
import { map } from 'rxjs';

import { TranslatePipe } from '../pipes/translate.pipe';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, BannerSliderComponent, TranslatePipe],
  templateUrl: './home.component.html',
  styles: [],
})
export class HomeComponent {
  private resourceService = inject(ResourceService);

  // Get latest 4 resources
  latestResources$ = this.resourceService
    .getResources()
    .pipe(map((resources) => resources.slice(0, 4)));

  downloadResource(event: Event, resource: any) {
    event.stopPropagation();
    if (resource.url) {
      window.open(resource.url, '_blank');
    }
  }
}
