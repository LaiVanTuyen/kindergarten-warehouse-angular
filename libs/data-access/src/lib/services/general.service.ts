import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Category, Topic } from '../models/models';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private mockCategories: Category[] = [
    {
      id: 'c1',
      name: 'Thủ công & Mỹ thuật',
      slug: 'arts-crafts',
      icon: '🎨',
      description: 'Các hoạt động cắt dán, vẽ tranh, và sáng tạo nghệ thuật.',
      createdAt: new Date('2025-01-01').toISOString(),
      updatedAt: new Date('2025-01-05').toISOString(),
      createdBy: 'System Admin',
      updatedBy: 'System Admin',
      platform: 'WEB',
      isActive: true,
    },
    {
      id: 'c2',
      name: 'Giờ kể chuyện',
      slug: 'story-time',
      icon: '📚',
      createdAt: new Date('2025-01-02').toISOString(),
      platform: 'BOTH',
      isActive: true,
    },
    {
      id: 'c3',
      name: 'Câu đố toán học',
      slug: 'math-puzzles',
      icon: '🧩',
      createdAt: new Date('2025-01-03').toISOString(),
      platform: 'WEB',
      isActive: true,
    },
    {
      id: 'c4',
      name: 'Âm nhạc & Bước nhảy',
      slug: 'music-dance',
      icon: '🎵',
      createdAt: new Date('2025-01-04').toISOString(),
      platform: 'MOBILE',
      isActive: true,
    },
    {
      id: 'c5',
      name: 'Khoa học vui',
      slug: 'science-fun',
      icon: '🔬',
      createdAt: new Date('2025-01-05').toISOString(),
      platform: 'BOTH',
      isActive: true,
    },
    {
      id: 'c6',
      name: 'Ngôn ngữ & Chữ cái',
      slug: 'language-abc',
      icon: '🅰️',
      createdAt: new Date('2025-01-06').toISOString(),
      platform: 'WEB',
      isActive: true,
    },
    {
      id: 'c7',
      name: 'Thiên nhiên & Động vật',
      slug: 'nature-animals',
      icon: '🌿',
      createdAt: new Date('2025-01-07').toISOString(),
      platform: 'MOBILE',
      isActive: true,
    },
    {
      id: 'c8',
      name: 'Kỹ năng sống',
      slug: 'life-skills',
      icon: '💡',
      createdAt: new Date('2025-01-08').toISOString(),
      platform: 'BOTH',
      isActive: true,
    },
    {
      id: 'c9',
      name: 'Vận động thể chất',
      slug: 'physical-activities',
      icon: '⚽',
      createdAt: new Date('2025-01-09').toISOString(),
      platform: 'WEB',
      isActive: true,
    },
    {
      id: 'c10',
      name: 'Lịch sử & Văn hóa',
      slug: 'history-culture',
      icon: '🏛️',
      createdAt: new Date('2025-01-10').toISOString(),
      platform: 'BOTH',
      isActive: true,
    },
    {
      id: 'c11',
      name: 'Công nghệ & Coding',
      slug: 'tech-coding',
      icon: '💻',
      createdAt: new Date('2025-01-11').toISOString(),
      platform: 'WEB',
      isActive: true,
    },
    {
      id: 'c12',
      name: 'Trò chơi tư duy',
      slug: 'logic-games',
      icon: '🧠',
      createdAt: new Date('2025-01-12').toISOString(),
      platform: 'MOBILE',
      isActive: true,
    },
    {
      id: 'c13',
      name: 'Nấu ăn cho bé',
      slug: 'kids-cooking',
      icon: '🍳',
      createdAt: new Date('2025-01-13').toISOString(),
      platform: 'BOTH',
      isActive: true,
    },
    {
      id: 'c14',
      name: 'Cảm xúc xã hội',
      slug: 'social-emotional',
      icon: '❤️',
      createdAt: new Date('2025-01-14').toISOString(),
      platform: 'WEB',
      isActive: true,
    },
    {
      id: 'c15',
      name: 'Lễ hội & Sự kiện',
      slug: 'festivals-events',
      icon: '🎉',
      createdAt: new Date('2025-01-15').toISOString(),
      platform: 'BOTH',
      isActive: true,
    },
  ];

  private mockTopics: Topic[] = [
    { id: 't1', name: 'Vẽ tranh', slug: 've-tranh', description: 'Các bài học vẽ màu nước, sáp màu', categoryId: 'c1', isActive: true, createdAt: '2026-01-12 17:00:00', updatedAt: '2026-01-12 17:00:00' },
    { id: 't2', name: 'Gấp giấy (Origami)', slug: 'gap-giay-origami', description: 'Nghệ thuật gấp giấy Nhật Bản', categoryId: 'c1', isActive: false, createdAt: '2026-01-12 17:00:00', updatedAt: '2026-01-12 17:00:00' },
    {
      id: 't3',
      name: 'Truyện cổ tích',
      categoryId: 'c2',
      slug: 'truyen-co-tich',
      description: 'Cổ tích Việt Nam và thế giới',
      isActive: true,
      createdAt: '2026-01-12 17:00:00',
      updatedAt: '2026-01-12 17:00:00'
    },
    {
      id: 't4',
      name: 'Kể chuyện sáng tạo',
      categoryId: 'c2',
      slug: 'ke-chuyen-sang-tao',
      description: 'Phát triển tư duy ngôn ngữ',
      isActive: true,
      createdAt: '2026-01-12 17:00:00',
      updatedAt: '2026-01-12 17:00:00'
    },
    { id: 't5', name: 'Đếm số cơ bản', categoryId: 'c3', slug: 'dem-so-co-ban', isActive: true },
    { id: 't6', name: 'Hình học vui', categoryId: 'c3', slug: 'hinh-hoc-vui', isActive: true },
    {
      id: 't7',
      name: 'Nhảy hiện đại',
      categoryId: 'c4',
      slug: 'nhay-hien-dai',
      isActive: true
    },
    {
      id: 't8',
      name: 'Nhạc cụ đơn giản',
      categoryId: 'c4',
      slug: 'nhac-cu-don-gian',
      isActive: true
    },
    {
      id: 't9',
      name: 'Thí nghiệm nhỏ',
      categoryId: 'c5',
      slug: 'thi-nghiem-nho',
      isActive: true
    },
    {
      id: 't10',
      name: 'Khám phá tự nhiên',
      categoryId: 'c5',
      slug: 'kham-pha-tu-nhien',
      isActive: true
    },
    {
      id: 't11',
      name: 'Tiếng Anh mầm non',
      categoryId: 'c6',
      slug: 'tieng-anh-mam-non',
      isActive: true
    },
    {
      id: 't12',
      name: 'Chữ cái vui nhộn',
      categoryId: 'c6',
      slug: 'chu-cai-vui-nhon',
      isActive: true
    },
    {
      id: 't13',
      name: 'Kỹ năng giao tiếp',
      categoryId: 'c7',
      slug: 'ky-nang-giao-tiep',
      isActive: true
    },
    {
      id: 't14',
      name: 'Tự phục vụ',
      categoryId: 'c7',
      slug: 'tu-phuc-vu',
      isActive: true
    },
    {
      id: 't15',
      name: 'Vận động thô',
      categoryId: 'c8',
      slug: 'van-dong-tho',
      isActive: true
    },
    {
      id: 't16',
      name: 'Vận động tinh',
      categoryId: 'c8',
      slug: 'van-dong-tinh',
      isActive: true
    },
    {
      id: 't17',
      name: 'Trò chơi dân gian',
      categoryId: 'c9',
      slug: 'tro-choi-dan-gian',
      isActive: true
    },
    {
      id: 't18',
      name: 'Team building nhỏ',
      categoryId: 'c9',
      slug: 'team-building-nho',
      isActive: true
    },
    {
      id: 't19',
      name: 'Cảm xúc của bé',
      categoryId: 'c10',
      slug: 'cam-xuc-cua-be',
      isActive: true
    },
    {
      id: 't20',
      name: 'Yêu thương gia đình',
      categoryId: 'c10',
      slug: 'yeu-thuong-gia-dinh',
      isActive: true
    },
    {
      id: 't21',
      name: 'Làm quen máy tính',
      categoryId: 'c11',
      slug: 'lam-quen-may-tinh',
    },
    { id: 't22', name: 'Robot', categoryId: 'c11', slug: 'robot' },
    { id: 't23', name: 'Mê cung', categoryId: 'c12', slug: 'me-cung' },
    { id: 't24', name: 'Sudoku nhí', categoryId: 'c12', slug: 'sudoku-nhi' },
    { id: 't25', name: 'Làm bánh', categoryId: 'c13', slug: 'lam-banh' },
    {
      id: 't26',
      name: 'Pha chế đồ uống',
      categoryId: 'c13',
      slug: 'pha-che-do-uong',
    },
    { id: 't27', name: 'Kết bạn', categoryId: 'c14', slug: 'ket-ban' },
    {
      id: 't28',
      name: 'Chia sẻ cảm xúc',
      categoryId: 'c14',
      slug: 'chia-se-cam-xuc',
    },
    { id: 't29', name: 'Giáng sinh', categoryId: 'c15', slug: 'giang-sinh' },
    {
      id: 't30',
      name: 'Tết Nguyên Đán',
      categoryId: 'c15',
      slug: 'tet-nguyen-dan',
    },
  ];

  // Categories CRUD
  getCategories(
    page = 1,
    limit = 10,
    search?: string
  ): Observable<{ data: Category[]; total: number }> {
    let filtered = this.mockCategories;

    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter((c) =>
        c.name.toLowerCase().includes(lowerSearch)
      );
    }

    const start = (page - 1) * limit;
    const end = start + limit;
    const paginated = filtered.slice(start, end);
    return of({
      data: paginated,
      total: filtered.length,
    });
  }

  createCategory(category: Partial<Category>): Observable<Category> {
    const newCategory: Category = {
      id: `c${Date.now()}`,
      name: category.name || '',
      slug:
        category.slug ||
        category.name?.toLowerCase().replace(/\s+/g, '-') ||
        '',
      description: category.description || '',
      icon: category.icon || '📁',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'Super Admin',
      updatedBy: 'Super Admin',
      platform: category.platform || 'WEB',
      isActive: true,
    };
    this.mockCategories = [...this.mockCategories, newCategory];
    return of(newCategory);
  }

  updateCategory(id: string, updates: Partial<Category>): Observable<Category> {
    this.mockCategories = this.mockCategories.map((c) =>
      c.id === id
        ? {
            ...c,
            ...updates,
            updatedAt: new Date().toISOString(),
            updatedBy: 'Super Admin',
          }
        : c
    );
    const updated = this.mockCategories.find((c) => c.id === id)!;
    return of(updated);
  }

  deleteCategory(id: string): Observable<boolean> {
    this.mockCategories = this.mockCategories.filter((c) => c.id !== id);
    // Also cleanup related topics
    this.mockTopics = this.mockTopics.filter((t) => t.categoryId !== id);
    return of(true);
  }

  // Topics CRUD
  getTopics(
    categoryId?: string,
    page = 1,
    limit = 10,
    search?: string
  ): Observable<{ data: Topic[]; total: number }> {
    let filtered = this.mockTopics;

    if (categoryId) {
      filtered = filtered.filter((t) => t.categoryId === categoryId);
    }

    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(lowerSearch) ||
          t.slug.includes(lowerSearch)
      );
    }

    const start = (page - 1) * limit;
    const end = start + limit;
    const paginated = filtered.slice(start, end);

    return of({
      data: paginated,
      total: filtered.length,
    });
  }

  createTopic(topic: Partial<Topic>): Observable<Topic> {
    const newTopic: Topic = {
      id: Math.random().toString(36).substring(7),
      name: topic.name || '', // Assuming 'name' is the intended field based on original code
      slug: topic.name?.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') || '',
      description: topic.description || '',
      categoryId: topic.categoryId || '',
      createdAt: new Date().toISOString(),
      createdBy: 'Super Admin',
    };
    this.mockTopics = [...this.mockTopics, newTopic];
    return of(newTopic);
  }

  updateTopic(id: string, updates: Partial<Topic>): Observable<Topic> {
    this.mockTopics = this.mockTopics.map((t) =>
      t.id === id
        ? {
            ...t,
            ...updates,
            updatedAt: new Date().toISOString(),
            updatedBy: 'Super Admin',
          }
        : t
    );
    const updated = this.mockTopics.find((t) => t.id === id)!;
    return of(updated);
  }

  deleteTopic(id: string): Observable<boolean> {
    this.mockTopics = this.mockTopics.filter((t) => t.id !== id);
    return of(true);
  }

  getAllTopicsMock(): Observable<Topic[]> {
    return of(this.mockTopics);
  }
}
