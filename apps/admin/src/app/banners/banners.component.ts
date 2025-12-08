import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BannerService } from '@kindergarten-warehouse/data-access';

@Component({
  selector: 'app-admin-banners',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './banners.component.html',
  styles: [],
})
export class BannersComponent {
  bannerService = inject(BannerService);
  banners$ = this.bannerService.getBanners();
}
