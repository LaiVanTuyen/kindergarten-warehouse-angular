import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Resource } from '../models/models';
import { AuthService } from './general.service';
import { inject } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ResourceService {
  authService = inject(AuthService);
  private mockResources: Resource[] = [
    {
      id: '1',
      title: 'Big Buck Bunny (Video)',
      uploader: 'Admin',
      date: '2023-10-25',
      thumbnail: '🎬',
      status: 'pending',
      type: 'VIDEO',
      viewsCount: 120,
      rating: 4.5,
      description: 'A fun way to learn animations.',
      createdAt: '2023-10-25T10:00:00Z',
      topicId: 't1',
      url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      fileSize: '500 MB',
    },
    {
      id: '2',
      title: 'Northern Lights (Image)',
      uploader: 'John Smith',
      date: '2023-10-24',
      thumbnail: '🖼️',
      status: 'pending',
      type: 'DOCUMENT', // Using DOCUMENT type but image URL for testing
      viewsCount: 45,
      rating: 4.0,
      description: 'Beautiful northern lights.',
      createdAt: '2023-10-24T12:00:00Z',
      topicId: 't3',
      url: 'https://www.w3schools.com/w3css/img_lights.jpg',
      fileSize: '2.4 MB',
    },
    {
      id: '3',
      title: 'Horse Neigh (Audio)',
      uploader: 'Emily R.',
      date: '2023-10-23',
      thumbnail: '🎵',
      status: 'approved',
      type: 'VIDEO', // Using VIDEO type broadly or could be added
      viewsCount: 300,
      rating: 4.8,
      description: 'Sound of a horse.',
      createdAt: '2023-10-23T09:00:00Z',
      topicId: 't4',
      url: 'https://www.w3schools.com/html/horse.mp3',
      fileSize: '4.1 MB',
    },
    {
      id: '4',
      title: 'Dummy PDF',
      uploader: 'Mike T.',
      date: '2023-10-22',
      thumbnail: '📄',
      status: 'approved',
      type: 'PDF',
      viewsCount: 20,
      rating: 3.5,
      description: 'Standard W3C Dummy PDF.',
      createdAt: '2023-10-22T14:00:00Z',
      topicId: 't2',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileSize: '150 KB',
    },
    {
      id: '5',
      title: 'Unsupported Zip',
      uploader: 'Sarah L.',
      date: '2023-10-21',
      thumbnail: '📦',
      status: 'pending',
      type: 'DOCUMENT',
      viewsCount: 150,
      rating: 4.7,
      description: 'A zip file example.',
      createdAt: '2023-10-21T20:00:00Z',
      topicId: 't2',
      url: 'https://example.com/file.zip',
      fileSize: '45 MB',
    },
  ];

  getResources(
    page = 1,
    limit = 10,
    filters?: {
      topicId?: string;
      search?: string;
      status?: 'pending' | 'approved' | 'rejected';
      type?: 'VIDEO' | 'DOCUMENT' | 'PDF' | 'EXCEL' | 'WORD';
    }
  ): Observable<{ data: Resource[]; total: number }> {
    let filtered = this.mockResources;

    if (filters?.topicId) {
      filtered = filtered.filter((r) => r.topicId === filters.topicId);
    }

    if (filters?.search) {
      const lowerSearch = filters.search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(lowerSearch) ||
          r.uploader.toLowerCase().includes(lowerSearch)
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

  getResource(id: string): Observable<Resource | undefined> {
    const resource = this.mockResources.find((r) => r.id === id);
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
