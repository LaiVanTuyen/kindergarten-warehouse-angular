import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Banner } from '../models/models';

@Injectable({
  providedIn: 'root',
})
export class BannerService {
  private mockBanners: Banner[] = [
    {
      id: 1,
      imageUrl: 'assets/banners/banner1.jpg',
      link: '/resources',
      isActive: true,
      displayOrder: 1,
      createdAt: '2023-11-01T10:00:00Z',
      updatedAt: '2023-11-01T10:00:00Z',
    },
    {
      id: 2,
      imageUrl: 'assets/banners/banner2.jpg',
      link: '/events',
      isActive: true,
      displayOrder: 2,
      createdAt: '2023-11-05T14:30:00Z',
      updatedAt: '2023-11-05T14:30:00Z',
    },
  ];

  getBanners(): Observable<Banner[]> {
    return of(this.mockBanners);
  }

  createBanner(
    banner: Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>
  ): Observable<Banner> {
    const newBanner: Banner = {
      ...banner,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
        updatedAt: new Date().toISOString(),
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
  updateReorderedBanners(banners: Banner[]): Observable<boolean> {
    this.mockBanners = banners;
    return of(true);
  }
}
