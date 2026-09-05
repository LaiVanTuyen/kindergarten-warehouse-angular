import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_URL } from '../tokens';
import { Comment } from '../models/interaction.model';
import {
  PaginatedResponse,
  RestResponse,
} from '../models/resource.model';

export interface CreateCommentRequest {
  content: string;
  rating?: number;
}

interface BackendCommentResponse {
  id: string | number;
  content: string;
  rating: number;
  username?: string;
  userAvatar?: string | null;
  createdAt: string;
}

/**
 * Comment CRUD for resource threads.
 *
 * Backend contract (API Contract v1 §2.1 — flat endpoint, JSON body):
 *   GET    /comments?resourceId={id}&page&size&sort=createdAt,desc → Page<Comment>
 *   POST   /comments   body { resourceId, content, rating }        → Comment (auth)
 *   DELETE /comments/:id                                           → void (author/admin)
 */
@Injectable({ providedIn: 'root' })
export class CommentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  list(
    resourceId: string,
    page = 1,
    size = 20
  ): Observable<PaginatedResponse<Comment>> {
    const params = new HttpParams()
      .set('resourceId', resourceId)
      .set('page', Math.max(0, page - 1))
      .set('size', size)
      .set('sort', 'createdAt,desc'); // Contract v1 §1.2
    return this.http
      .get<RestResponse<PaginatedResponse<Comment>>>(
        `${this.apiUrl}/comments`,
        { params: params.set('resourceId', resourceId) }
      )
      .pipe(
        map(
          (res) => {
            const page =
              res.result ??
              res.data ?? {
              content: [],
              totalElements: 0,
              totalPages: 0,
              size,
              number: 0,
            };
            return {
              ...page,
              content: (page.content ?? []).map((comment) =>
                this.normalizeComment(comment as unknown as BackendCommentResponse)
              ),
            };
          }
        )
      );
  }

  create(
    resourceId: string,
    payload: CreateCommentRequest
  ): Observable<Comment> {
    const params = new HttpParams()
      .set('resourceId', resourceId)
      .set('content', payload.content)
      .set('rating', payload.rating ?? 5);

    return this.http
      .post<RestResponse<Comment>>(`${this.apiUrl}/comments`, {
        resourceId,
        ...payload,
      })
      .pipe(map((res) => res.result as Comment));
  }

  delete(commentId: string): Observable<void> {
    return this.http
      .delete<RestResponse<void>>(`${this.apiUrl}/comments/${commentId}`)
      .pipe(map(() => undefined));
  }

  private normalizeComment(comment: BackendCommentResponse | Comment): Comment {
    if ('user' in comment && comment.user) {
      return comment as Comment;
    }

    const backendComment = comment as BackendCommentResponse;

    return {
      id: String(backendComment.id),
      content: backendComment.content,
      rating: backendComment.rating,
      userId: 0,
      user: {
        username: backendComment.username ?? 'user',
        fullName: backendComment.username ?? 'Người dùng',
        avatarUrl: backendComment.userAvatar ?? undefined,
      },
      resourceId: '',
      createdAt: backendComment.createdAt,
    };
  }
}
