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
      title:
        'Thế giới <span class="text-primary-500">Vui chơi</span> & <span class="text-secondary-600">Học tập</span>',
      subtitle: 'Kho tài liệu phong phú, bài hát và câu chuyện hấp dẫn cho bé.',
      imageUrl: '/assets/images/banner_fun_learning.png',
      // bgFrom: '',
      // bgTo: '',
      bgFrom: 'from-primary-50',
      bgTo: 'to-secondary-50',
      link: '/resources',
      isActive: true,
      displayOrder: 1,
      platform: 'desktop',
      startDate: '2024-01-01',
      createdAt: '2023-11-01T10:00:00Z',
      updatedAt: '2023-11-01T10:00:00Z',
    },
    {
      id: 2,
      title:
        'Đồng hành cùng <span class="text-purple-500">Giáo viên</span> & <span class="text-yellow-500">Phụ huynh</span>',
      subtitle:
        'Giáo án và hoạt động sáng tạo giúp khơi dậy tiềm năng của trẻ.',
      imageUrl: '/assets/images/banner_teachers_parents.png',
      bgFrom: 'from-purple-50',
      bgTo: 'to-yellow-50',
      link: '/teachers',
      isActive: true,
      displayOrder: 2,
      platform: 'desktop',
      createdAt: '2023-11-05T14:30:00Z',
      updatedAt: '2023-11-05T14:30:00Z',
    },
    {
      id: 3,
      title:
        'Học mà <span class="text-green-500">Chơi</span>, Chơi mà <span class="text-blue-500">Học</span>',
      subtitle: 'Trò chơi tương tác và video giáo dục thú vị.',
      imageUrl: '/assets/images/banner_games.png',
      bgFrom: 'from-green-50',
      bgTo: 'to-blue-50',
      link: '/games',
      isActive: true,
      displayOrder: 3,
      platform: 'desktop',
      createdAt: '2023-11-05T14:30:00Z',
      updatedAt: '2023-11-05T14:30:00Z',
    },
    {
      id: 4,
      title:
        'Khơi nguồn <span class="text-pink-500">Sáng tạo</span> với <span class="text-orange-500">Nghệ thuật</span>',
      subtitle: 'Tranh tô màu và thủ công giúp bé thỏa sức sáng tạo.',
      imageUrl: '/assets/images/banner_art.png',
      bgFrom: 'from-pink-50',
      bgTo: 'to-orange-50',
      link: '/art',
      isActive: true,
      displayOrder: 4,
      platform: 'desktop',
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
