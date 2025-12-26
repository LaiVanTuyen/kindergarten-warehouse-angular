import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Category, Topic } from '../models/models';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private mockCategories: Category[] = [
    { id: 'c1', name: 'Thủ công & Mỹ thuật', slug: 'arts-crafts', icon: '🎨' },
    { id: 'c2', name: 'Giờ kể chuyện', slug: 'story-time', icon: '📚' },
    { id: 'c3', name: 'Câu đố toán học', slug: 'math-puzzles', icon: '🧩' },
    { id: 'c4', name: 'Âm nhạc & Bước nhảy', slug: 'music-dance', icon: '🎵' },
    { id: 'c5', name: 'Khoa học vui', slug: 'science-fun', icon: '🔬' },
    { id: 'c6', name: 'Ngôn ngữ & Chữ cái', slug: 'language-abc', icon: '🅰️' },
    {
      id: 'c7',
      name: 'Thiên nhiên & Động vật',
      slug: 'nature-animals',
      icon: '🌿',
    },
    { id: 'c8', name: 'Kỹ năng sống', slug: 'life-skills', icon: '💡' },
    {
      id: 'c9',
      name: 'Vận động thể chất',
      slug: 'physical-activities',
      icon: '⚽',
    },
    {
      id: 'c10',
      name: 'Lịch sử & Văn hóa',
      slug: 'history-culture',
      icon: '🏛️',
    },
    { id: 'c11', name: 'Công nghệ & Coding', slug: 'tech-coding', icon: '💻' },
    { id: 'c12', name: 'Trò chơi tư duy', slug: 'logic-games', icon: '🧠' },
    { id: 'c13', name: 'Nấu ăn cho bé', slug: 'kids-cooking', icon: '🍳' },
    { id: 'c14', name: 'Cảm xúc xã hội', slug: 'social-emotional', icon: '❤️' },
    {
      id: 'c15',
      name: 'Lễ hội & Sự kiện',
      slug: 'festivals-events',
      icon: '🎉',
    },
  ];

  private mockTopics: Topic[] = [
    { id: 't1', title: 'Vẽ tranh', categoryId: 'c1', slug: 've-tranh' },
    {
      id: 't2',
      title: 'Gấp giấy (Origami)',
      categoryId: 'c1',
      slug: 'gap-giay-origami',
    },
    {
      id: 't3',
      title: 'Truyện cổ tích',
      categoryId: 'c2',
      slug: 'truyen-co-tich',
    },
    { id: 't4', title: 'Phiêu lưu', categoryId: 'c2', slug: 'phieu-luu' },
    { id: 't5', title: 'Tập đếm', categoryId: 'c3', slug: 'tap-dem' },
    { id: 't6', title: 'Hình học', categoryId: 'c3', slug: 'hinh-hoc' },
    { id: 't7', title: 'Hát theo', categoryId: 'c4', slug: 'hat-theo' },
    { id: 't8', title: 'Điệu nhảy', categoryId: 'c4', slug: 'dieu-nhay' },
    {
      id: 't9',
      title: 'Thí nghiệm nhỏ',
      categoryId: 'c5',
      slug: 'thi-nghiem-nho',
    },
    { id: 't10', title: 'Vũ trụ', categoryId: 'c5', slug: 'vu-tru' },
    { id: 't11', title: 'Học chữ cái', categoryId: 'c6', slug: 'hoc-chu-cai' },
    {
      id: 't12',
      title: 'Từ vựng tiếng Anh',
      categoryId: 'c6',
      slug: 'tu-vung-tieng-anh',
    },
    {
      id: 't13',
      title: 'Động vật hoang dã',
      categoryId: 'c7',
      slug: 'dong-vat-hoang-da',
    },
    { id: 't14', title: 'Cây cối', categoryId: 'c7', slug: 'cay-coi' },
    {
      id: 't15',
      title: 'An toàn giao thông',
      categoryId: 'c8',
      slug: 'an-toan-giao-thong',
    },
    { id: 't16', title: 'Tự phục vụ', categoryId: 'c8', slug: 'tu-phuc-vu' },
    {
      id: 't17',
      title: 'Bài tập buổi sáng',
      categoryId: 'c9',
      slug: 'bai-tap-buoi-sang',
    },
    {
      id: 't18',
      title: 'Trò chơi vận động',
      categoryId: 'c9',
      slug: 'tro-choi-van-dong',
    },
    {
      id: 't19',
      title: 'Danh nhân thế giới',
      categoryId: 'c10',
      slug: 'danh-nhan-the-gioi',
    },
    {
      id: 't20',
      title: 'Lễ hội Việt Nam',
      categoryId: 'c10',
      slug: 'le-hoi-viet-nam',
    },
    {
      id: 't21',
      title: 'Làm quen máy tính',
      categoryId: 'c11',
      slug: 'lam-quen-may-tinh',
    },
    { id: 't22', title: 'Robot', categoryId: 'c11', slug: 'robot' },
    { id: 't23', title: 'Mê cung', categoryId: 'c12', slug: 'me-cung' },
    { id: 't24', title: 'Sudoku nhí', categoryId: 'c12', slug: 'sudoku-nhi' },
    { id: 't25', title: 'Làm bánh', categoryId: 'c13', slug: 'lam-banh' },
    {
      id: 't26',
      title: 'Pha chế đồ uống',
      categoryId: 'c13',
      slug: 'pha-che-do-uong',
    },
    { id: 't27', title: 'Kết bạn', categoryId: 'c14', slug: 'ket-ban' },
    {
      id: 't28',
      title: 'Chia sẻ cảm xúc',
      categoryId: 'c14',
      slug: 'chia-se-cam-xuc',
    },
    { id: 't29', title: 'Giáng sinh', categoryId: 'c15', slug: 'giang-sinh' },
    {
      id: 't30',
      title: 'Tết Nguyên Đán',
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
      icon: category.icon || '📁',
    };
    this.mockCategories = [...this.mockCategories, newCategory];
    return of(newCategory);
  }

  updateCategory(id: string, updates: Partial<Category>): Observable<Category> {
    this.mockCategories = this.mockCategories.map((c) =>
      c.id === id ? { ...c, ...updates } : c
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
      filtered = filtered.filter((t) =>
        t.title.toLowerCase().includes(lowerSearch)
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
      id: `t${Date.now()}`,
      title: topic.title || '',
      categoryId: topic.categoryId || '',
      slug: topic.slug || topic.title?.toLowerCase().replace(/\s+/g, '-') || '',
    };
    this.mockTopics = [...this.mockTopics, newTopic];
    return of(newTopic);
  }

  updateTopic(id: string, updates: Partial<Topic>): Observable<Topic> {
    this.mockTopics = this.mockTopics.map((t) =>
      t.id === id ? { ...t, ...updates } : t
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
