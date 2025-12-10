import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { User } from '../models';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private mockUsers: User[] = [
    {
      id: 1,
      username: 'admin_user',
      email: 'admin@school.com',
      fullName: 'Admin User',
      role: 'ADMIN',
      isActive: true,
      avatarUrl: '',
      createdAt: '2023-10-24T10:00:00Z',
    },
    {
      id: 2,
      username: 'teacher_sarah',
      email: 'sarah@school.com',
      fullName: 'Sarah Johnson',
      role: 'TEACHER',
      isActive: true,
      avatarUrl:
        'https://ui-avatars.com/api/?name=Sarah+Johnson&background=random',
      createdAt: '2023-10-25T11:30:00Z',
    },
    {
      id: 3,
      username: 'teacher_john',
      email: 'john@school.com',
      fullName: 'John Smith',
      role: 'TEACHER',
      isActive: false,
      avatarUrl: '',
      createdAt: '2023-10-20T09:15:00Z',
    },
    {
      id: 4,
      username: 'parent_mike',
      email: 'mike@parents.com',
      fullName: 'Mike Davis',
      role: 'USER',
      isActive: true,
      avatarUrl:
        'https://ui-avatars.com/api/?name=Mike+Davis&background=random',
      createdAt: '2023-10-22T14:20:00Z',
    },
  ];

  getUsers(
    page = 1,
    limit = 10,
    filters?: {
      role?: 'ADMIN' | 'TEACHER' | 'USER';
      search?: string;
      status?: 'ACTIVE' | 'BLOCKED';
    }
  ): Observable<{ data: User[]; total: number }> {
    let filtered = this.mockUsers;

    if (filters?.role) {
      filtered = filtered.filter((u) => u.role === filters.role);
    }

    if (filters?.search) {
      const lowerSearch = filters.search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.username.toLowerCase().includes(lowerSearch) ||
          u.fullName.toLowerCase().includes(lowerSearch) ||
          u.email.toLowerCase().includes(lowerSearch)
      );
    }

    if (filters?.status) {
      const isActive = filters.status === 'ACTIVE';
      filtered = filtered.filter((u) => u.isActive === isActive);
    }

    const start = (page - 1) * limit;
    const end = start + limit;
    return of({
      data: filtered.slice(start, end),
      total: filtered.length,
    });
  }

  createUser(user: Partial<User>): Observable<User> {
    const exists = this.mockUsers.find((u) => u.username === user.username);
    if (exists) {
      return throwError(() => ({
        status: 409,
        message: 'Username already exists',
      }));
    }

    const newUser: User = {
      id: Math.floor(Date.now() + Math.random() * 1000),
      username: user.username || '',
      email: user.email || '',
      fullName: user.fullName || '',
      role: user.role || 'TEACHER',
      isActive: true,
      avatarUrl:
        user.avatarUrl ||
        `https://ui-avatars.com/api/?name=${user.fullName}&background=random`,
      createdAt: new Date().toISOString(),
    };

    this.mockUsers = [newUser, ...this.mockUsers];
    return of(newUser);
  }

  updateUserStatus(id: number, isActive: boolean): Observable<User> {
    this.mockUsers = this.mockUsers.map((u) =>
      u.id === id ? { ...u, isActive } : u
    );
    const updated = this.mockUsers.find((u) => u.id === id)!;
    return of(updated);
  }

  resetPassword(id: number): Observable<boolean> {
    // Mock success
    return of(true);
  }
}
