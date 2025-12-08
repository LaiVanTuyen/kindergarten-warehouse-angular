import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Resource, Comment } from '../models/interfaces';

const generateComments = (count: number): Comment[] => {
  const comments: Comment[] = [];
  const users = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];
  const contents = [
    'Great resource! Thanks for sharing.',
    'My kids loved this.',
    'Very helpful for my class.',
    'Could be better, but still good.',
    'Excellent quality!',
  ];

  for (let i = 0; i < count; i++) {
    comments.push({
      id: Math.random().toString(36).substr(2, 9),
      user: users[Math.floor(Math.random() * users.length)],
      content: contents[Math.floor(Math.random() * contents.length)],
      date: new Date(),
      rating: Math.floor(Math.random() * 2) + 4, // 4 or 5 stars
    });
  }
  return comments;
};

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
    rating: 4.5,
    comments: generateComments(3),
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
    rating: 4.8,
    comments: generateComments(2),
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
    rating: 4.0,
    comments: generateComments(1),
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
    rating: 4.2,
    comments: generateComments(4),
  },
  {
    id: '5',
    title: 'Animal Sounds Song',
    description: 'Sing along to learn animal sounds.',
    type: 'VIDEO',
    url: 'https://example.com/song.mp4',
    viewsCount: 300,
    topicId: 't4', // Music
    createdAt: new Date(),
    rating: 5.0,
    comments: generateComments(5),
  },
  {
    id: '6',
    title: 'Alphabet Coloring Book',
    description: 'Color the letters from A to Z.',
    type: 'PDF',
    url: 'https://example.com/abc.pdf',
    viewsCount: 450,
    topicId: 't1',
    createdAt: new Date(),
    rating: 4.7,
    comments: generateComments(6),
  },
  {
    id: '7',
    title: 'Addition Flashcards',
    description: 'Printable flashcards for basic addition.',
    type: 'PDF',
    url: 'https://example.com/add.pdf',
    viewsCount: 150,
    topicId: 't3',
    createdAt: new Date(),
    rating: 4.3,
    comments: generateComments(2),
  },
  {
    id: '8',
    title: 'Dance Moves for Kids',
    description: 'Easy dance moves to get moving.',
    type: 'VIDEO',
    url: 'https://example.com/dance.mp4',
    viewsCount: 500,
    topicId: 't4',
    createdAt: new Date(),
    rating: 4.9,
    comments: generateComments(8),
  },
  {
    id: '9',
    title: 'Origami for Beginners',
    description: 'Simple paper folding projects.',
    type: 'PDF',
    url: 'https://example.com/origami.pdf',
    viewsCount: 210,
    topicId: 't1',
    createdAt: new Date(),
    rating: 4.6,
    comments: generateComments(3),
  },
  {
    id: '10',
    title: 'Rhyming Words Game',
    description: 'Interactive game to find rhyming words.',
    type: 'EXCEL',
    url: 'https://example.com/rhyme.xlsx',
    viewsCount: 180,
    topicId: 't2',
    createdAt: new Date(),
    rating: 4.1,
    comments: generateComments(1),
  },
  {
    id: '11',
    title: 'Solar System Poster',
    description: 'High-quality poster of the planets.',
    type: 'PDF',
    url: 'https://example.com/space.pdf',
    viewsCount: 320,
    topicId: 't2',
    createdAt: new Date(),
    rating: 4.8,
    comments: generateComments(4),
  },
  {
    id: '12',
    title: 'Subtraction Practice',
    description: 'Worksheet for subtraction problems.',
    type: 'WORD',
    url: 'https://example.com/sub.docx',
    viewsCount: 95,
    topicId: 't3',
    createdAt: new Date(),
    rating: 3.9,
    comments: generateComments(2),
  },
];

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
  getResource(id: string): Observable<Resource | undefined> {
    return of(MOCK_RESOURCES.find((r) => r.id === id));
  }
}


