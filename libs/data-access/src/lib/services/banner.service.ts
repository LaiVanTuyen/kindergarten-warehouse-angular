import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Banner } from '../models/models';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class BannerService {
  private http = inject(HttpClient);
  private readonly API_URL = '/api/v1/banners';

  getAllBanners(page = 0, size = 10): Observable<ApiResponse<any>> {
    const params = new HttpParams()
      .set('page', (page - 1).toString())
      .set('size', size.toString())
      .set('sortBy', 'displayOrder')
      .set('sortDir', 'asc');
    return this.http
      .get<ApiResponse<any>>(`${this.API_URL}/all`, { params })
      .pipe(
        map((response) => {
          if (response.result?.content) {
            response.result.content = response.result.content.map(
              this.normalizeBanner
            );
          }
          return response;
        })
      );
  }

  getBanners(): Observable<Banner[]> {
    // Legacy support or fetching active banners for portal
    return this.getActiveBanners('WEB').pipe(
      map((response) => response.result || [])
    );
  }

  getActiveBanners(
    platform: 'WEB' | 'MOBILE'
  ): Observable<ApiResponse<Banner[]>> {
    const params = new HttpParams().set('platform', platform);
    return this.http.get<ApiResponse<any[]>>(this.API_URL, { params }).pipe(
      map((response) => {
        if (response.result) {
          response.result = response.result.map(this.normalizeBanner);
        }
        return response as ApiResponse<Banner[]>;
      })
    );
  }

  private normalizeBanner(b: any): Banner {
    return {
      ...b,
      imageUrl: b.imageUrl ? b.imageUrl.split('?')[0] : '',
      displayOrder: b.displayOrder ?? b.display_order ?? b.order ?? 0,
      platform: b.platform,
      createdAt: b.createdAt ?? b.created_at,
      updatedAt: b.updatedAt ?? b.updated_at,
      createdBy: b.createdBy,
      updatedBy: b.updatedBy,
    } as Banner;
  }

  createBanner(bannerData: FormData): Observable<ApiResponse<Banner>> {
    return this.http.post<ApiResponse<Banner>>(this.API_URL, bannerData);
  }

  updateBanner(
    id: number,
    bannerData: FormData
  ): Observable<ApiResponse<Banner>> {
    return this.http.put<ApiResponse<Banner>>(
      `${this.API_URL}/${id}`,
      bannerData
    );
  }

  deleteBanner(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.API_URL}/${id}`);
  }

  updateReorderedBanners(banners: Banner[]): Observable<ApiResponse<void>> {
    const orderedIds = banners.map((b) => b.id);
    return this.http.patch<ApiResponse<void>>(
      `${this.API_URL}/reorder`,
      orderedIds
    );
  }

  // Helper type guard or method if needed
}
