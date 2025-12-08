import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { User, Category, Topic } from '../models/interfaces';

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
  login(): Observable<boolean> {
    return of(true);
  }
}

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  getCategories(): Observable<Category[]> {
    return of([
      { id: 'c1', name: 'Arts & Crafts', slug: 'arts-crafts', icon: '🎨' },
      { id: 'c2', name: 'Story Time', slug: 'story-time', icon: '📚' },
      { id: 'c3', name: 'Math Puzzles', slug: 'math-puzzles', icon: '🧩' },
      { id: 'c4', name: 'Music & Dance', slug: 'music-dance', icon: '🎵' },
    ]);
  }

  getTopics(categoryId?: string): Observable<Topic[]> {
    const topics: Topic[] = [
      { id: 't1', title: 'Alphabet', categoryId: 'c1' },
      { id: 't2', title: 'Vocabulary', categoryId: 'c1' },
      { id: 't3', title: 'Numbers', categoryId: 'c2' },
      { id: 't4', title: 'Shapes', categoryId: 'c2' },
    ];

    if (categoryId) {
      return of(topics.filter((t) => t.categoryId === categoryId));
    }
    return of(topics);
  }
}
