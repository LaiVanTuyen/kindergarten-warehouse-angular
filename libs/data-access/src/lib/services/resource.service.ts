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

  /* Cleaned and Standardized Mock Data */
  private mockResources: (Resource & { ageGroupId?: string })[] = [
    // PPT Example
    {
      id: '1',
      title: 'Báo cáo Tổng kết năm học 2023-2024 dành cho Hiệu trưởng',
      slug: 'bao-cao-tong-ket-nam-hoc',
      uploader: 'Cô Hiệu Trưởng',
      uploaderAvatar:
        'https://ui-avatars.com/api/?name=Co+Hieu+Truong&background=fdf2f8&color=db2777',
      date: '2023-12-01',
      thumbnail: '', // Use fallback icon (Orange PPT)
      status: 'approved',
      type: 'POWERPOINT',
      highlights: [
        'Phù hợp cho trẻ 3-5 tuổi',
        'Giúp phát triển tư duy ngôn ngữ',
        'File PowerPoint dễ dàng chỉnh sửa',
      ],
      viewsCount: 1250,
      rating: 4.8,
      description:
        'Mẫu báo cáo tổng kết chi tiết, bao gồm các biểu đồ, số liệu thống kê và định hướng phát triển cho năm học tới. File PowerPoint dễ dàng chỉnh sửa.',
      createdAt: '2023-12-01',
      topicId: 't1',
      ageGroupId: 'age-5-6',
      url: 'https://example.com/ppt-report',
      fileSize: '15 MB',
      downloadCount: 340,
      comments: [
        {
          id: 'c1',
          user: 'Cô Mai (Lớp Lá)',
          content:
            'Mẫu báo cáo rất chuyên nghiệp, màu sắc đẹp. Cảm ơn cô đã chia sẻ!',
          date: new Date('2023-12-02'),
          rating: 5,
          avatarUrl:
            'https://ui-avatars.com/api/?name=Co+Mai&background=A7F3D0&color=065F46',
        },
        {
          id: 'c2',
          user: 'Thầy Tuấn',
          content:
            'Phần biểu đồ hơi khó chỉnh sửa số liệu một chút, nhưng bố cục chung rất ổn.',
          date: new Date('2023-12-03'),
          rating: 4,
          avatarUrl:
            'https://ui-avatars.com/api/?name=Thay+Tuan&background=BFDBFE&color=1E40AF',
        },
        {
          id: 'c3',
          user: 'Mẹ Bé Na',
          content: 'Tuyệt vời! Slide đẹp lung linh.',
          date: new Date('2023-12-05'),
          rating: 5,
        },
      ],
    },
    // Word Example
    {
      id: '2',
      title: 'Giáo án Mầm non: Chủ đề Thế giới động vật',
      slug: 'giao-an-mam-non-dong-vat',
      uploader: 'Cô Lan Anh',
      date: '2023-11-15',
      thumbnail: '',
      status: 'approved',
      type: 'WORD',
      viewsCount: 890,
      rating: 4.5,
      description:
        'Giáo án trọn bộ chủ đề Động vật, bao gồm hoạt động góc, hoạt động ngoài trời và bài tập tư duy.',
      createdAt: '2023-11-15',
      topicId: 't1',
      ageGroupId: 'age-3-4',
      url: 'https://example.com/word-lesson',
      fileSize: '2.5 MB',
      downloadCount: 156,
      comments: [
        {
          id: 'c4',
          user: 'Phụ huynh A',
          content: 'Rất chi tiết, cảm ơn cô.',
          date: new Date('2023-11-16'),
          rating: 5,
        },
      ],
    },
    // Excel Example
    {
      id: '3',
      title: 'Bảng theo dõi sức khỏe định kỳ',
      slug: 'bang-theo-doi-suc-khoe',
      uploader: 'Y tế Học đường',
      date: '2023-10-20',
      thumbnail: '',
      status: 'approved',
      type: 'EXCEL',
      viewsCount: 450,
      rating: 4.2,
      description:
        'File Excel tính chỉ số BMI tự động, theo dõi chiều cao cân nặng của trẻ theo từng tháng.',
      createdAt: '2023-10-20',
      topicId: 't5',
      ageGroupId: 'age-0-12',
      url: 'https://example.com/excel-health',
      fileSize: '1.2 MB',
      downloadCount: 88,
    },
    // Video Example
    {
      id: '4',
      title: 'Video hướng dẫn: Gấp hạc giấy Origami',
      slug: 'video-gap-hac-giay',
      uploader: 'CLB Khéo tay',
      date: '2023-11-05',
      thumbnail: '',
      status: 'approved',
      type: 'VIDEO',
      viewsCount: 2200,
      rating: 4.9,
      description:
        'Video 4K hướng dẫn chi tiết từng bước gấp hạc giấy trang trí lớp học.',
      createdAt: '2023-11-05',
      topicId: 't2',
      url: 'https://www.youtube.com/embed/ScMzIvxBSi4', // Real Youtube ID for testing
      fileSize: 'N/A',
      downloadCount: 0,
    },
    // Image Collection
    {
      id: '5',
      title: 'Bộ sưu tập Poster tuyên truyền Vệ sinh tay',
      slug: 'poster-ve-sinh-tay',
      uploader: 'Admin',
      date: '2023-09-10',
      thumbnail: '',
      status: 'approved',
      type: 'IMAGE',
      viewsCount: 670,
      rating: 4.6,
      description:
        'Bộ 10 hình ảnh chất lượng cao về 6 bước rửa tay thường quy của Bộ Y tế, in được khổ A3.',
      createdAt: '2023-09-10',
      topicId: 't4',
      url: 'https://example.com/poster-set',
      fileSize: '18 MB',
      downloadCount: 412,
    },
    // PDF Example
    {
      id: '6',
      title: 'Ebook: Phương pháp Montessori tại nhà',
      slug: 'ebook-montessori',
      uploader: 'Chuyên gia GD',
      date: '2023-08-15',
      thumbnail: '',
      status: 'approved',
      type: 'PDF',
      viewsCount: 3100,
      rating: 5.0,
      description:
        'Sách hướng dẫn chi tiết cho phụ huynh muốn áp dụng Montessori tại nhà.',
      createdAt: '2023-08-15',
      topicId: 't3',
      url: 'https://example.com/ebook',
      fileSize: '45 MB',
      downloadCount: 1205,
      comments: [
        {
          id: 'c5',
          user: 'Mẹ Sóc',
          content: 'Sách rất hay, cám ơn ad!',
          rating: 5,
          date: new Date(),
        },
      ],
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
