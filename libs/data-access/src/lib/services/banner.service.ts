import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Banner } from '../models';

@Injectable({
  providedIn: 'root',
})
export class BannerService {
  private mockBanners: Banner[] = [
    {
      id: 1,
      image_url: 'assets/banners/banner1.jpg',
      link: '/resources',
      is_active: true,
      display_order: 1,
      created_at: '2023-11-01T10:00:00Z',
      updated_at: '2023-11-01T10:00:00Z',
    },
    {
      id: 2,
      image_url: 'assets/banners/banner2.jpg',
      link: '/events',
      is_active: true,
      display_order: 2,
      created_at: '2023-11-05T14:30:00Z',
      updated_at: '2023-11-05T14:30:00Z',
    },
  ];

  constructor() {}

  getBanners(): Observable<Banner[]> {
    return of(this.mockBanners);
  }

  createBanner(
    banner: Omit<Banner, 'id' | 'created_at' | 'updated_at'>
  ): Observable<Banner> {
    const newBanner: Banner = {
      ...banner,
      id: Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.mockBanners = [...this.mockBanners, newBanner];
    return of(newBanner);
  }

  updateBanner(
    id: number,
    banner: Partial<Banner>
  ): Observable<Banner | undefined> {
    const index = this.mockBanners.findIndex((b) => b.id === id);
    if (index !== -1) {
      const updatedBanner = {
        ...this.mockBanners[index],
        ...banner,
        updated_at: new Date().toISOString(),
      };
      this.mockBanners[index] = updatedBanner;
      // Force array reference update for signal/observable detection if needed
      this.mockBanners = [...this.mockBanners];
      return of(updatedBanner);
    }
    return of(undefined);
  }

  deleteBanner(id: number): Observable<boolean> {
    const initialLength = this.mockBanners.length;
    this.mockBanners = this.mockBanners.filter((b) => b.id !== id);
    return of(this.mockBanners.length < initialLength);
  }
}
