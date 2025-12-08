import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Banner } from '../models/interfaces';

@Injectable({
  providedIn: 'root',
})
export class BannerService {
  getBanners(): Observable<Banner[]> {
    return of(MOCK_BANNERS);
  }
}

const MOCK_BANNERS: Banner[] = [
  {
    id: '1',
    imageUrl:
      'https://placehold.co/1200x300/FF8FA3/white?text=Welcome+to+Kindergarten+Warehouse',
    active: true,
    order: 1,
  },
  {
    id: '2',
    imageUrl:
      'https://placehold.co/1200x300/8AC4FF/white?text=New+Learning+Resources',
    active: true,
    order: 2,
  },
];
