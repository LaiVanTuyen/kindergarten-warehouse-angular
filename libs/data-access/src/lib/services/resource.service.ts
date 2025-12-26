import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Resource, AgeGroup } from '../models/models';
import { AuthService } from './auth.service';
import { inject } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ResourceService {
  authService = inject(AuthService);

  private mockAgeGroups: AgeGroup[] = [
    {
      id: 'age-0-12',
      name: 'Nhà trẻ (0-12 tháng)',
      slug: 'nha-tre-0-12-thang',
    },
    { id: 'age-1-3', name: 'Nhà trẻ (1-3 tuổi)', slug: 'nha-tre-1-3-tuoi' },
    { id: 'age-3-4', name: 'Mẫu giáo (3-4 tuổi)', slug: 'mau-giao-3-4-tuoi' },
    { id: 'age-4-5', name: 'Mẫu giáo (4-5 tuổi)', slug: 'mau-giao-4-5-tuoi' },
    {
      id: 'age-5-6',
      name: 'Tiền tiểu học (5-6 tuổi)',
      slug: 'tien-tieu-hoc-5-6-tuoi',
    },
  ];

  /* Assigned random ageGroupIds to existing mocks for demo purposes */
  private mockResources: (Resource & { ageGroupId?: string })[] = [
    // c1: Arts & Crafts (t1: Drawing, t2: Origami)
    {
      id: '1',
      title: 'Cơ bản về vẽ',
      slug: 'co-ban-ve-ve',
      uploader: 'Admin',
      date: '2023-11-01',
      thumbnail: '🎨',
      status: 'approved',
      type: 'VIDEO',
      viewsCount: 150,
      rating: 4.8,
      description: 'Học những bước cơ bản để vẽ tranh.',
      createdAt: '2023-11-01',
      topicId: 't1',
      ageGroupId: 'age-3-4',
      url: 'https://example.com/video1',
      fileSize: '120 MB',
      downloadCount: 75,
    },
    {
      id: '2',
      title: 'Phác thảo nâng cao',
      slug: 'phac-thao-nang-cao',
      uploader: 'Họa sĩ Joe',
      date: '2023-11-02',
      thumbnail: '✏️',
      status: 'approved',
      type: 'PDF',
      viewsCount: 85,
      rating: 4.5,
      description: 'Các kỹ thuật đánh bóng và phác thảo.',
      createdAt: '2023-11-02',
      topicId: 't1',
      ageGroupId: 'age-5-6',
      url: 'https://example.com/pdf1',
      fileSize: '5 MB',
      downloadCount: 40,
    },
    {
      id: '3',
      title: 'Sách tô màu',
      slug: 'sach-to-mau',
      uploader: 'Admin',
      date: '2023-11-03',
      thumbnail: '🖍️',
      status: 'approved',
      type: 'IMAGE',
      viewsCount: 300,
      rating: 4.2,
      description: 'Trang tô màu có thể in được.',
      createdAt: '2023-11-03',
      topicId: 't1',
      ageGroupId: 'age-1-3',
      url: 'https://example.com/img1',
      fileSize: '2 MB',
      downloadCount: 120,
    },
    {
      id: '4',
      title: 'Gấp hạc giấy',
      slug: 'gap-hac-giay',
      uploader: 'Origami Master',
      date: '2023-11-04',
      thumbnail: '🦢',
      status: 'approved',
      type: 'VIDEO',
      viewsCount: 200,
      rating: 4.9,
      description: 'Cách gấp hạc giấy đơn giản.',
      createdAt: '2023-11-04',
      topicId: 't2',
      ageGroupId: 'age-4-5',
      url: 'https://example.com/video2',
      fileSize: '80 MB',
    },
    {
      id: '5',
      title: 'Gấp thuyền giấy',
      slug: 'gap-thuyen-giay',
      uploader: 'Admin',
      date: '2023-11-05',
      thumbnail: '⛵',
      status: 'approved',
      type: 'IMAGE',
      viewsCount: 120,
      rating: 4.0,
      description: 'Hướng dẫn từng bước gấp thuyền giấy.',
      createdAt: '2023-11-05',
      topicId: 't2',
      ageGroupId: 'age-3-4',
      url: 'https://example.com/img2',
      fileSize: '1.5 MB',
    },
    {
      id: '6',
      title: 'Động vật Origami',
      slug: 'dong-vat-origami',
      uploader: 'Admin',
      date: '2023-11-06',
      thumbnail: '🐸',
      status: 'approved',
      type: 'PDF',
      viewsCount: 90,
      rating: 4.6,
      description: 'Bộ sưu tập các mẫu gấp động vật.',
      createdAt: '2023-11-06',
      topicId: 't2',
      ageGroupId: 'age-5-6',
      url: 'https://example.com/pdf2',
      fileSize: '8 MB',
    },

    // c2: Story Time (t3: Fairy Tales, t4: Adventure)
    {
      id: '7',
      title: 'Cô bé Lọ Lem',
      slug: 'co-be-lo-lem',
      uploader: 'Người kể chuyện',
      date: '2023-11-07',
      thumbnail: '👠',
      status: 'approved',
      type: 'AUDIO',
      viewsCount: 500,
      rating: 4.7,
      description: 'Truyện cổ tích kinh điển dạng kể chuyện.',
      createdAt: '2023-11-07',
      topicId: 't3',
      url: 'https://example.com/audio1',
      fileSize: '15 MB',
    },
    {
      id: '8',
      title: 'Bạch Tuyết',
      slug: 'bach-tuyet',
      uploader: 'Admin',
      date: '2023-11-08',
      thumbnail: '🍎',
      status: 'approved',
      type: 'VIDEO',
      viewsCount: 600,
      rating: 4.8,
      description: 'Phim hoạt hình Bạch Tuyết và bảy chú lùn.',
      createdAt: '2023-11-08',
      topicId: 't3',
      url: 'https://example.com/video3',
      fileSize: '200 MB',
    },
    {
      id: '9',
      title: 'Hansel & Gretel',
      slug: 'hansel-and-gretel',
      uploader: 'Admin',
      date: '2023-11-09',
      thumbnail: '🏠',
      status: 'approved',
      type: 'PDF',
      viewsCount: 250,
      rating: 4.3,
      description: 'Truyện tranh minh họa.',
      createdAt: '2023-11-09',
      topicId: 't3',
      url: 'https://example.com/pdf3',
      fileSize: '12 MB',
    },
    {
      id: '10',
      title: 'Khám phá rừng xanh',
      slug: 'kham-pha-rung-xanh',
      uploader: 'Đội thám hiểm',
      date: '2023-11-10',
      thumbnail: '🦁',
      status: 'approved',
      type: 'VIDEO',
      viewsCount: 300,
      rating: 4.6,
      description: 'Tour du lịch ảo khám phá rừng rậm.',
      createdAt: '2023-11-10',
      topicId: 't4',
      url: 'https://example.com/video4',
      fileSize: '150 MB',
    },
    {
      id: '11',
      title: 'Bản đồ kho báu',
      slug: 'ban-do-kho-bau',
      uploader: 'Admin',
      date: '2023-11-11',
      thumbnail: '🗺️',
      status: 'approved',
      type: 'IMAGE',
      viewsCount: 180,
      rating: 4.1,
      description: 'Bản đồ kho báu vui nhộn cho bé.',
      createdAt: '2023-11-11',
      topicId: 't4',
      url: 'https://example.com/img3',
      fileSize: '3 MB',
    },
    {
      id: '12',
      title: 'Chuyện cướp biển',
      slug: 'chuyen-cuop-bien',
      uploader: 'Thuyền trưởng Hook',
      date: '2023-11-12',
      thumbnail: '🏴‍☠️',
      status: 'approved',
      type: 'AUDIO',
      viewsCount: 220,
      rating: 4.5,
      description: 'Những câu chuyện từ bảy vùng biển.',
      createdAt: '2023-11-12',
      topicId: 't4',
      url: 'https://example.com/audio2',
      fileSize: '20 MB',
    },

    // c3: Math Puzzles (t5: Counting, t6: Geometry)
    {
      id: '13',
      title: 'Đếm đến 10',
      slug: 'dem-den-10',
      uploader: 'Math Whiz',
      date: '2023-11-13',
      thumbnail: '🔟',
      status: 'approved',
      type: 'VIDEO',
      viewsCount: 400,
      rating: 4.9,
      description: 'Bài hát vui nhộn học đếm số.',
      createdAt: '2023-11-13',
      topicId: 't5',
      url: 'https://example.com/video5',
      fileSize: '50 MB',
    },
    {
      id: '14',
      title: 'Thẻ số Flashcards',
      slug: 'the-so-flashcards',
      uploader: 'Admin',
      date: '2023-11-14',
      thumbnail: '🃏',
      status: 'approved',
      type: 'PDF',
      viewsCount: 100,
      rating: 4.4,
      description: 'Thẻ học in được.',
      createdAt: '2023-11-14',
      topicId: 't5',
      url: 'https://example.com/pdf4',
      fileSize: '2 MB',
    },
    {
      id: '15',
      title: 'Bảng số 1-100',
      slug: 'bang-so-1-100',
      uploader: 'Admin',
      date: '2023-11-15',
      thumbnail: '📊',
      status: 'approved',
      type: 'IMAGE',
      viewsCount: 150,
      rating: 4.2,
      description: 'Poster số từ 1 đến 100.',
      createdAt: '2023-11-15',
      topicId: 't5',
      url: 'https://example.com/img4',
      fileSize: '1 MB',
    },
    {
      id: '16',
      title: 'Bài hát hình khối',
      slug: 'bai-hat-hinh-khoi',
      uploader: 'Giáo viên nhạc',
      date: '2023-11-16',
      thumbnail: '🔺',
      status: 'approved',
      type: 'AUDIO',
      viewsCount: 350,
      rating: 4.7,
      description: 'Học hình khối qua bài hát.',
      createdAt: '2023-11-16',
      topicId: 't6',
      url: 'https://example.com/audio3',
      fileSize: '8 MB',
    },
    {
      id: '17',
      title: 'Hình khối 3D',
      slug: 'hinh-khoi-3d',
      uploader: 'Admin',
      date: '2023-11-17',
      thumbnail: '🧊',
      status: 'approved',
      type: 'VIDEO',
      viewsCount: 200,
      rating: 4.6,
      description: 'Giới thiệu về hình học không gian.',
      createdAt: '2023-11-17',
      topicId: 't6',
      url: 'https://example.com/video6',
      fileSize: '90 MB',
    },
    {
      id: '18',
      title: 'Bài tập hình học',
      slug: 'bai-tap-hinh-hoc',
      uploader: 'Admin',
      date: '2023-11-18',
      thumbnail: '📝',
      status: 'approved',
      type: 'PDF',
      viewsCount: 80,
      rating: 4.0,
      description: 'Luyện tập nhận biết hình dạng.',
      createdAt: '2023-11-18',
      topicId: 't6',
      url: 'https://example.com/pdf5',
      fileSize: '1 MB',
    },

    // c4: Music & Dance (t7: Sing-Along, t8: Dance Moves)
    {
      id: '19',
      title: 'Bài hát buổi sáng',
      slug: 'bai-hat-buoi-sang',
      uploader: 'Admin',
      date: '2023-11-19',
      thumbnail: '☀️',
      status: 'approved',
      type: 'AUDIO',
      viewsCount: 300,
      rating: 4.8,
      description: 'Bắt đầu ngày ngày mới với âm nhạc.',
      createdAt: '2023-11-19',
      topicId: 't7',
      url: 'https://example.com/audio4',
      fileSize: '5 MB',
    },
    {
      id: '20',
      title: 'Bài hát ABC',
      slug: 'bai-hat-abc',
      uploader: 'Admin',
      date: '2023-11-20',
      thumbnail: '🔤',
      status: 'approved',
      type: 'VIDEO',
      viewsCount: 800,
      rating: 5.0,
      description: 'Bài hát chữ cái ABC kinh điển.',
      createdAt: '2023-11-20',
      topicId: 't7',
      url: 'https://example.com/video7',
      fileSize: '60 MB',
    },
    {
      id: '21',
      title: 'Bài hát mẫu giáo',
      slug: 'bai-hat-mau-giao',
      uploader: 'Admin',
      date: '2023-11-21',
      thumbnail: '👶',
      status: 'approved',
      type: 'AUDIO',
      viewsCount: 450,
      rating: 4.5,
      description: 'Tuyển tập giai điệu quen thuộc.',
      createdAt: '2023-11-21',
      topicId: 't7',
      url: 'https://example.com/audio5',
      fileSize: '40 MB',
    },
    {
      id: '22',
      title: 'Cơ bản múa Ballet',
      slug: 'co-ban-mua-ballet',
      uploader: 'Giáo viên múa',
      date: '2023-11-22',
      thumbnail: '🩰',
      status: 'approved',
      type: 'VIDEO',
      viewsCount: 180,
      rating: 4.7,
      description: 'Những bước đầu tiên trong Ballet.',
      createdAt: '2023-11-22',
      topicId: 't8',
      url: 'https://example.com/video8',
      fileSize: '110 MB',
    },
    {
      id: '23',
      title: 'Hip Hop cho bé',
      slug: 'hip-hop-cho-be',
      uploader: 'Cool Dancer',
      date: '2023-11-23',
      thumbnail: '🧢',
      status: 'approved',
      type: 'VIDEO',
      viewsCount: 220,
      rating: 4.9,
      description: 'Các động tác Hip Hop vui nhộn.',
      createdAt: '2023-11-23',
      topicId: 't8',
      url: 'https://example.com/video9',
      fileSize: '100 MB',
    },
    {
      id: '24',
      title: 'Bài nhảy',
      slug: 'bai-nhay',
      uploader: 'Admin',
      date: '2023-11-24',
      thumbnail: '💃',
      status: 'approved',
      type: 'PDF',
      viewsCount: 60,
      rating: 4.2,
      description: 'Ghi chú biên đạo múa.',
      createdAt: '2023-11-24',
      topicId: 't8',
      url: 'https://example.com/pdf6',
      fileSize: '3 MB',
    },
  ];

  getAgeGroups(): Observable<AgeGroup[]> {
    return of(this.mockAgeGroups);
  }

  getResources(
    page = 1,
    limit = 10,
    filters?: {
      topicId?: string;
      topicIds?: string[];
      ageGroupId?: string; // New filter
      ageGroupIds?: string[]; // New filter multiple
      search?: string;
      status?: 'pending' | 'approved' | 'rejected';
      type?: 'VIDEO' | 'DOCUMENT' | 'PDF' | 'EXCEL' | 'WORD';
    }
  ): Observable<{ data: Resource[]; total: number }> {
    let filtered = this.mockResources;

    if (filters?.topicId) {
      filtered = filtered.filter((r) => r.topicId === filters.topicId);
    }

    if (filters?.topicIds && filters.topicIds.length > 0) {
      filtered = filtered.filter(
        (r) => r.topicId && filters.topicIds?.includes(r.topicId)
      );
    }

    if (filters?.ageGroupId) {
      filtered = filtered.filter((r) => r.ageGroupId === filters.ageGroupId);
    }

    if (filters?.ageGroupIds && filters.ageGroupIds.length > 0) {
      filtered = filtered.filter(
        (r) => r.ageGroupId && filters.ageGroupIds?.includes(r.ageGroupId)
      );
    }

    if (filters?.search) {
      const lowerSearch = filters.search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(lowerSearch) ||
          (r.uploader && r.uploader.toLowerCase().includes(lowerSearch))
      );
    }

    if (filters?.status) {
      filtered = filtered.filter((r) => r.status === filters.status);
    }

    if (filters?.type) {
      filtered = filtered.filter((r) => r.type === filters.type);
    }

    // Sort by date desc
    filtered.sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime()
    );

    const start = (page - 1) * limit;
    const end = start + limit;
    const paginated = filtered.slice(start, end);

    return of({
      data: paginated,
      total: filtered.length,
    });
  }

  getResource(slugOrId: string): Observable<Resource | undefined> {
    // Try finding by slug first (since slugs are unique-ish user facing IDs)
    let resource = this.mockResources.find((r) => r.slug === slugOrId);

    // Fallback to finding by ID if not found (for backwards compatibility)
    if (!resource) {
      resource = this.mockResources.find((r) => r.id === slugOrId);
    }
    return of(resource);
  }

  uploadResource(resource: Partial<Resource>): Observable<Resource> {
    const currentUser = this.authService.currentUserValue;
    const isAdmin = currentUser?.role === 'ADMIN';
    const status = isAdmin ? 'approved' : 'pending';

    const newResource: Resource = {
      id: this.generateId(),
      title: resource.title || '',
      uploader: currentUser?.fullName || 'Anonymous',
      date: new Date().toISOString().split('T')[0],
      thumbnail: resource.thumbnail || '📁',
      status: status, // Auto-approve if Admin
      type: resource.type || 'DOCUMENT',
      viewsCount: 0,
      description: resource.description || '',
      createdAt: new Date().toISOString(),
      topicId: resource.topicId,
      url: resource.url,
      fileSize: '0 MB', // Default for uploads
      downloadCount: 0,
      ...resource,
    };
    this.mockResources = [newResource, ...this.mockResources];
    return of(newResource);
  }

  // kept for backward compatibility if needed, but uploadResource is preferred
  createResource(resource: Partial<Resource>): Observable<Resource> {
    return this.uploadResource(resource);
  }

  updateResource(id: string, updates: Partial<Resource>): Observable<Resource> {
    this.mockResources = this.mockResources.map((r) =>
      r.id === id ? { ...r, ...updates } : r
    );
    const updated = this.mockResources.find((r) => r.id === id);
    if (!updated) {
      throw new Error(`Resource with id ${id} not found`);
    }
    return of(updated);
  }

  updateStatus(
    id: string,
    status: 'approved' | 'rejected'
  ): Observable<boolean> {
    this.mockResources = this.mockResources.map((r) =>
      r.id === id ? { ...r, status } : r
    );
    return of(true);
  }

  approveResource(id: string): Observable<boolean> {
    return this.updateStatus(id, 'approved');
  }

  rejectResource(id: string): Observable<boolean> {
    return this.updateStatus(id, 'rejected');
  }

  moveResources(ids: string[], topicId: string): Observable<boolean> {
    this.mockResources = this.mockResources.map((r) =>
      ids.includes(r.id) ? { ...r, topicId } : r
    );
    return of(true);
  }

  incrementViewCount(id: string): Observable<void> {
    const res = this.mockResources.find((r) => r.id === id);
    if (res) {
      res.viewsCount++;
    }
    return of(void 0);
  }

  deleteResource(id: string): Observable<boolean> {
    this.mockResources = this.mockResources.filter((r) => r.id !== id);
    return of(true);
  }

  private generateId(): string {
    return 'res-' + Math.random().toString(36).substr(2, 9);
  }
}
