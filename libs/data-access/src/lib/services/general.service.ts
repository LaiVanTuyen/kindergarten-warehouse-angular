import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { User, Category, Topic } from '../models';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  getUsers(): Observable<User[]> {
    return of([
      {
        id: '1',
        username: 'admin_user',
        role: 'ADMIN',
        status: 'ACTIVE',
        avatarUrl: 'https://ui-avatars.com/api/?name=Admin&background=random',
      },
      {
        id: '2',
        username: 'teacher_sarah',
        role: 'TEACHER',
        status: 'ACTIVE',
        avatarUrl: 'https://ui-avatars.com/api/?name=Sarah&background=random',
      },
      {
        id: '3',
        username: 'teacher_john',
        role: 'TEACHER',
        status: 'BLOCKED',
        avatarUrl: 'https://ui-avatars.com/api/?name=John&background=random',
      },
      {
        id: '4',
        username: 'parent_mike',
        role: 'USER',
        status: 'ACTIVE',
        avatarUrl: 'https://ui-avatars.com/api/?name=Mike&background=random',
      },
    ]);
  }
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Check local storage for persisted user (optional, for now just mock)
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  login(username: string): Observable<boolean> {
    // Mock login
    const user: User = {
      id: 'u1',
      username: username,
      role: 'USER',
      status: 'ACTIVE',
      avatarUrl: `https://ui-avatars.com/api/?name=${username}&background=random`,
    };
    this.currentUserSubject.next(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    return of(true);
  }

  logout() {
    this.currentUserSubject.next(null);
    localStorage.removeItem('currentUser');
  }

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }
}

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private mockCategories: Category[] = [
    { id: 'c1', name: 'Arts & Crafts', slug: 'arts-crafts', icon: '🎨' },
    { id: 'c2', name: 'Story Time', slug: 'story-time', icon: '📚' },
    { id: 'c3', name: 'Math Puzzles', slug: 'math-puzzles', icon: '🧩' },
    { id: 'c4', name: 'Music & Dance', slug: 'music-dance', icon: '🎵' },
  ];

  private mockTopics: Topic[] = [
    { id: 't1', title: 'Alphabet', categoryId: 'c1' },
    { id: 't2', title: 'Vocabulary', categoryId: 'c1' },
    { id: 't3', title: 'Numbers', categoryId: 'c2' },
    { id: 't4', title: 'Shapes', categoryId: 'c2' },
  ];

  // Categories CRUD
  getCategories(page = 1, limit = 10, search?: string): Observable<{ data: Category[]; total: number }> {
    let filtered = this.mockCategories;

    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(c => c.name.toLowerCase().includes(lowerSearch));
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
  getTopics(categoryId?: string, page = 1, limit = 10, search?: string): Observable<{ data: Topic[]; total: number }> {
    let filtered = this.mockTopics;
    
    if (categoryId) {
      filtered = filtered.filter((t) => t.categoryId === categoryId);
    }
    
    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(t => t.title.toLowerCase().includes(lowerSearch));
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
