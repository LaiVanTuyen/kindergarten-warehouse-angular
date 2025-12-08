import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Resource } from '../models/interfaces';

@Injectable({
  providedIn: 'root',
})
export class ResourceService {
  private http = inject(HttpClient);
  // Replace with actual API URL
  private apiUrl = 'https://your-render-backend-url.com/api/resources';

  getResources(filter?: {
    topicId?: string;
    categoryId?: string;
    search?: string;
  }): Observable<Resource[]> {
    let params = new HttpParams();
    if (filter?.topicId) params = params.set('topicId', filter.topicId);
    if (filter?.categoryId)
      params = params.set('categoryId', filter.categoryId);
    if (filter?.search) params = params.set('search', filter.search);

    // Mock data for initial dev if API not reachable
    // return this.http.get<Resource[]>(this.apiUrl, { params });
    return of(MOCK_RESOURCES);
  }

  incrementViewCount(id: string): Observable<void> {
    // In a real app, this would be an HTTP call.
    // For now, if using mock data, we can just return of(void).
    // But since the user asked for the API call code:
    return this.http.post<void>(`${this.apiUrl}/${id}/views`, {});
  }
}

const MOCK_RESOURCES: Resource[] = [
  {
    id: '1',
    title: 'The Three Little Pigs Video',
    description: 'Animated story of the three little pigs.',
    type: 'VIDEO',
    url: 'https://www.youtube.com/watch?v=example',
    thumbnailUrl: 'https://img.youtube.com/vi/example/0.jpg',
    viewsCount: 120,
    topicId: 't2', // Story Time
    createdAt: new Date(),
  },
  {
    id: '2',
    title: 'Colorful Handprints Guide',
    description: 'A fun guide to making handprint animals.',
    type: 'PDF',
    url: 'https://example.com/colors.pdf',
    viewsCount: 125,
    topicId: 't1', // Arts
    createdAt: new Date(),
  },
  {
    id: '3',
    title: 'Counting Apples Worksheet',
    description: 'A worksheet to practice counting up to 10.',
    type: 'EXCEL',
    url: 'https://example.com/math.xlsx',
    viewsCount: 89,
    topicId: 't3', // Math
    createdAt: new Date(),
  },
  {
    id: '4',
    title: 'Fun with Shapes',
    description: 'Learn about shapes with this interactive sheet.',
    type: 'WORD',
    url: 'https://example.com/story.docx',
    viewsCount: 230,
    topicId: 't3',
    createdAt: new Date(),
  },
];
