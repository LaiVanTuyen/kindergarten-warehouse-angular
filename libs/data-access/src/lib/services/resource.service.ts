import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Resource } from '../models';

@Injectable({
  providedIn: 'root',
})
export class ResourceService {
  private mockResources: Resource[] = [
    {
      id: 1,
      title: 'Learn Alphabet',
      uploader: 'Jane Doe',
      date: '2023-10-25',
      thumbnail: '🅰️',
      status: 'pending',
      type: 'VIDEO',
      viewsCount: 120,
    },
    {
      id: 2,
      title: 'Number Counting',
      uploader: 'John Smith',
      date: '2023-10-24',
      thumbnail: '🔢',
      status: 'pending',
      type: 'DOCUMENT',
      viewsCount: 45,
    },
    {
      id: 3,
      title: 'Colors & Shapes',
      uploader: 'Emily R.',
      date: '2023-10-23',
      thumbnail: '🎨',
      status: 'approved',
      type: 'VIDEO',
      viewsCount: 300,
    },
    {
      id: 4,
      title: 'Science Basics',
      uploader: 'Mike T.',
      date: '2023-10-22',
      thumbnail: '🧪',
      status: 'rejected',
      type: 'DOCUMENT',
      viewsCount: 20,
    },
    {
      id: 5,
      title: 'Story Time',
      uploader: 'Sarah L.',
      date: '2023-10-21',
      thumbnail: '📖',
      status: 'approved',
      type: 'VIDEO',
      viewsCount: 150,
    },
  ];



  getResources(): Observable<Resource[]> {
    return of(this.mockResources);
  }

  /**
   * Approves a pending resource.
   * @param id The ID of the resource to approve.
   */
  approveResource(id: number): void {
    // TODO: Connect to Backend API
    console.log(`Resource ${id} approved.`);
  }

  incrementViewCount(id: number): void {
    // TODO: Connect to Backend API
    console.log(`Resource ${id} view count incremented.`);
  }

  deleteResource(id: number): Observable<boolean> {
    console.log(`Resource ${id} deleted.`);
    return of(true);
  }
}
