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
  ];

  private mockTopics: Topic[] = [
    { id: 't1', title: 'Vẽ tranh', categoryId: 'c1' },
    { id: 't2', title: 'Gấp giấy (Origami)', categoryId: 'c1' },
    { id: 't3', title: 'Truyện cổ tích', categoryId: 'c2' },
    { id: 't4', title: 'Phiêu lưu', categoryId: 'c2' },
    { id: 't5', title: 'Tập đếm', categoryId: 'c3' },
    { id: 't6', title: 'Hình học', categoryId: 'c3' },
    { id: 't7', title: 'Hát theo', categoryId: 'c4' },
    { id: 't8', title: 'Điệu nhảy', categoryId: 'c4' },
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
}
