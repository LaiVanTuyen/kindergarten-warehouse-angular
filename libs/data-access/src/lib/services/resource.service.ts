import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Resource } from '../models/models';
import { AuthService } from './auth.service';
import { inject } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ResourceService {
  authService = inject(AuthService);
  private mockResources: Resource[] = [
    // c1: Arts & Crafts (t1: Drawing, t2: Origami)
    {
      id: '1',
      title: 'Drawing Basics',
      uploader: 'Admin',
      date: '2023-11-01',
      thumbnail: '🎨',
      status: 'approved',
      type: 'VIDEO',
      viewsCount: 150,
      rating: 4.8,
      description: 'Learn the basics of drawing.',
      createdAt: '2023-11-01',
      topicId: 't1',
      url: 'https://example.com/video1',
      fileSize: '120 MB',
      downloadCount: 75,
    },
    {
      id: '2',
      title: 'Advanced Sketching',
      uploader: 'Artist Joe',
      date: '2023-11-02',
      thumbnail: '✏️',
      status: 'approved',
      type: 'PDF',
      viewsCount: 85,
      rating: 4.5,
      description: 'Techniques for shading and sketching.',
      createdAt: '2023-11-02',
      topicId: 't1',
      url: 'https://example.com/pdf1',
      fileSize: '5 MB',
      downloadCount: 40,
    },
    {
      id: '3',
      title: 'Coloring Book',
      uploader: 'Admin',
      date: '2023-11-03',
      thumbnail: '🖍️',
      status: 'approved',
      type: 'IMAGE',
      viewsCount: 300,
      rating: 4.2,
      description: 'Printable coloring pages.',
      createdAt: '2023-11-03',
      topicId: 't1',
      url: 'https://example.com/img1',
      fileSize: '2 MB',
      downloadCount: 120,
    },
    {
      id: '4',
      title: 'Crane Folding',
      uploader: 'Origami Master',
      date: '2023-11-04',
      thumbnail: '🦢',
      status: 'approved',
      type: 'VIDEO',
      viewsCount: 200,
      rating: 4.9,
      description: 'How to fold a paper crane.',
      createdAt: '2023-11-04',
      topicId: 't2',
      url: 'https://example.com/video2',
      fileSize: '80 MB',
    },
    {
      id: '5',
      title: 'Paper Boat',
      uploader: 'Admin',
      date: '2023-11-05',
      thumbnail: '⛵',
      status: 'approved',
      type: 'IMAGE',
      viewsCount: 120,
      rating: 4.0,
      description: 'Step by step paper boat instructions.',
      createdAt: '2023-11-05',
      topicId: 't2',
      url: 'https://example.com/img2',
      fileSize: '1.5 MB',
    },
    {
      id: '6',
      title: 'Origami Animals',
      uploader: 'Admin',
      date: '2023-11-06',
      thumbnail: '🐸',
      status: 'approved',
      type: 'PDF',
      viewsCount: 90,
      rating: 4.6,
      description: 'Collection of animal diagrams.',
      createdAt: '2023-11-06',
      topicId: 't2',
      url: 'https://example.com/pdf2',
      fileSize: '8 MB',
    },

    // c2: Story Time (t3: Fairy Tales, t4: Adventure)
    {
      id: '7',
      title: 'Cinderella',
      uploader: 'Storyteller',
      date: '2023-11-07',
      thumbnail: '👠',
      status: 'approved',
      type: 'AUDIO',
      viewsCount: 500,
      rating: 4.7,
      description: 'Classic fairy tale audio.',
      createdAt: '2023-11-07',
      topicId: 't3',
      url: 'https://example.com/audio1',
      fileSize: '15 MB',
    },
    {
      id: '8',
      title: 'Snow White',
      uploader: 'Admin',
      date: '2023-11-08',
      thumbnail: '🍎',
      status: 'approved',
      type: 'VIDEO',
      viewsCount: 600,
      rating: 4.8,
      description: 'Animated story of Snow White.',
      createdAt: '2023-11-08',
      topicId: 't3',
      url: 'https://example.com/video3',
      fileSize: '200 MB',
    },
    {
      id: '9',
      title: 'Hansel & Gretel',
      uploader: 'Admin',
      date: '2023-11-09',
      thumbnail: '🏠',
      status: 'approved',
      type: 'PDF',
      viewsCount: 250,
      rating: 4.3,
      description: 'Illustrated storybook.',
      createdAt: '2023-11-09',
      topicId: 't3',
      url: 'https://example.com/pdf3',
      fileSize: '12 MB',
    },
    {
      id: '10',
      title: 'Jungle Safari',
      uploader: 'Expedition Team',
      date: '2023-11-10',
      thumbnail: '🦁',
      status: 'approved',
      type: 'VIDEO',
      viewsCount: 300,
      rating: 4.6,
      description: 'Virtual tour of the jungle.',
      createdAt: '2023-11-10',
      topicId: 't4',
      url: 'https://example.com/video4',
      fileSize: '150 MB',
    },
    {
      id: '11',
      title: 'Treasure Map',
      uploader: 'Admin',
      date: '2023-11-11',
      thumbnail: '🗺️',
      status: 'approved',
      type: 'IMAGE',
      viewsCount: 180,
      rating: 4.1,
      description: 'A fun treasure map for kids.',
      createdAt: '2023-11-11',
      topicId: 't4',
      url: 'https://example.com/img3',
      fileSize: '3 MB',
    },
    {
      id: '12',
      title: 'Pirate Story',
      uploader: 'Captain Hook',
      date: '2023-11-12',
      thumbnail: '🏴‍☠️',
      status: 'approved',
      type: 'AUDIO',
      viewsCount: 220,
      rating: 4.5,
      description: 'Tales from the seven seas.',
      createdAt: '2023-11-12',
      topicId: 't4',
      url: 'https://example.com/audio2',
      fileSize: '20 MB',
    },

    // c3: Math Puzzles (t5: Counting, t6: Geometry)
    {
      id: '13',
      title: 'Count to 10',
      uploader: 'Math Whiz',
      date: '2023-11-13',
      thumbnail: '🔟',
      status: 'approved',
      type: 'VIDEO',
      viewsCount: 400,
      rating: 4.9,
      description: 'Fun song to learn counting.',
      createdAt: '2023-11-13',
      topicId: 't5',
      url: 'https://example.com/video5',
      fileSize: '50 MB',
    },
    {
      id: '14',
      title: 'Number Flashcards',
      uploader: 'Admin',
      date: '2023-11-14',
      thumbnail: '🃏',
      status: 'approved',
      type: 'PDF',
      viewsCount: 100,
      rating: 4.4,
      description: 'Printable flashcards.',
      createdAt: '2023-11-14',
      topicId: 't5',
      url: 'https://example.com/pdf4',
      fileSize: '2 MB',
    },
    {
      id: '15',
      title: '1-100 Chart',
      uploader: 'Admin',
      date: '2023-11-15',
      thumbnail: '📊',
      status: 'approved',
      type: 'IMAGE',
      viewsCount: 150,
      rating: 4.2,
      description: 'Poster for numbers 1 to 100.',
      createdAt: '2023-11-15',
      topicId: 't5',
      url: 'https://example.com/img4',
      fileSize: '1 MB',
    },
    {
      id: '16',
      title: 'Shapes Song',
      uploader: 'Music Teacher',
      date: '2023-11-16',
      thumbnail: '🔺',
      status: 'approved',
      type: 'AUDIO',
      viewsCount: 350,
      rating: 4.7,
      description: 'Learn shapes with music.',
      createdAt: '2023-11-16',
      topicId: 't6',
      url: 'https://example.com/audio3',
      fileSize: '8 MB',
    },
    {
      id: '17',
      title: '3D Shapes',
      uploader: 'Admin',
      date: '2023-11-17',
      thumbnail: '🧊',
      status: 'approved',
      type: 'VIDEO',
      viewsCount: 200,
      rating: 4.6,
      description: 'Introduction to 3D geometry.',
      createdAt: '2023-11-17',
      topicId: 't6',
      url: 'https://example.com/video6',
      fileSize: '90 MB',
    },
    {
      id: '18',
      title: 'Geometry Worksheet',
      uploader: 'Admin',
      date: '2023-11-18',
      thumbnail: '📝',
      status: 'approved',
      type: 'PDF',
      viewsCount: 80,
      rating: 4.0,
      description: 'Practice identifying shapes.',
      createdAt: '2023-11-18',
      topicId: 't6',
      url: 'https://example.com/pdf5',
      fileSize: '1 MB',
    },

    // c4: Music & Dance (t7: Sing-Along, t8: Dance Moves)
    {
      id: '19',
      title: 'Morning Song',
      uploader: 'Admin',
      date: '2023-11-19',
      thumbnail: '☀️',
      status: 'approved',
      type: 'AUDIO',
      viewsCount: 300,
      rating: 4.8,
      description: 'Start the day with a song.',
      createdAt: '2023-11-19',
      topicId: 't7',
      url: 'https://example.com/audio4',
      fileSize: '5 MB',
    },
    {
      id: '20',
      title: 'ABC Song',
      uploader: 'Admin',
      date: '2023-11-20',
      thumbnail: '🔤',
      status: 'approved',
      type: 'VIDEO',
      viewsCount: 800,
      rating: 5.0,
      description: 'The classic ABC song.',
      createdAt: '2023-11-20',
      topicId: 't7',
      url: 'https://example.com/video7',
      fileSize: '60 MB',
    },
    {
      id: '21',
      title: 'Nursery Rhymes',
      uploader: 'Admin',
      date: '2023-11-21',
      thumbnail: '👶',
      status: 'approved',
      type: 'AUDIO',
      viewsCount: 450,
      rating: 4.5,
      description: 'Collection of popular rhymes.',
      createdAt: '2023-11-21',
      topicId: 't7',
      url: 'https://example.com/audio5',
      fileSize: '40 MB',
    },
    {
      id: '22',
      title: 'Ballet Basics',
      uploader: 'Dance Instructor',
      date: '2023-11-22',
      thumbnail: '🩰',
      status: 'approved',
      type: 'VIDEO',
      viewsCount: 180,
      rating: 4.7,
      description: 'First steps in ballet.',
      createdAt: '2023-11-22',
      topicId: 't8',
      url: 'https://example.com/video8',
      fileSize: '110 MB',
    },
    {
      id: '23',
      title: 'Hip Hop for Kids',
      uploader: 'Cool Dancer',
      date: '2023-11-23',
      thumbnail: '🧢',
      status: 'approved',
      type: 'VIDEO',
      viewsCount: 220,
      rating: 4.9,
      description: 'Fun hip hop moves.',
      createdAt: '2023-11-23',
      topicId: 't8',
      url: 'https://example.com/video9',
      fileSize: '100 MB',
    },
    {
      id: '24',
      title: 'Dance Routine',
      uploader: 'Admin',
      date: '2023-11-24',
      thumbnail: '💃',
      status: 'approved',
      type: 'PDF',
      viewsCount: 60,
      rating: 4.2,
      description: 'Choreography notes.',
      createdAt: '2023-11-24',
      topicId: 't8',
      url: 'https://example.com/pdf6',
      fileSize: '3 MB',
    },
  ];

  getResources(
    page = 1,
    limit = 10,
    filters?: {
      topicId?: string;
      topicIds?: string[]; // New filter for multiple topics (e.g. Category selection)
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
