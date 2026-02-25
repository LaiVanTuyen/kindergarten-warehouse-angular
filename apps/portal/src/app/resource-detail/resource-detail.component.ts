import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ResourceService, Resource } from '@kindergarten-warehouse/data-access';
import { switchMap, map, of, combineLatest, tap } from 'rxjs';

import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../pipes/translate.pipe';
import { ResourceCardComponent } from '../resource-card/resource-card.component';
import {
  AuthService,
  CategoryService,
  TopicService,
  Comment,
  TranslationService,
} from '@kindergarten-warehouse/data-access';
import { FileHelper } from '../shared/utils/file-helper';
import { registerLocaleData } from '@angular/common';
import localeVi from '@angular/common/locales/vi';

registerLocaleData(localeVi);

@Component({
  selector: 'app-resource-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TranslatePipe,
    ResourceCardComponent,
  ],
  templateUrl: './resource-detail.component.html',
  styles: [],
})
export class ResourceDetailComponent {
  private route = inject(ActivatedRoute);
  private resourceService = inject(ResourceService);
  private categoryService = inject(CategoryService);
  private topicService = inject(TopicService);
  private sanitizer = inject(DomSanitizer);
  public authService = inject(AuthService);
  public translationService = inject(TranslationService);

  newCommentContent = '';
  newCommentRating = 5;

  resource$ = this.route.paramMap.pipe(
    switchMap((params) => {
      const slug = params.get('slug');
      return this.resourceService.getResource(slug || '').pipe(
        map((res) => res.data),
        tap((resource) => {
          if (resource && resource.id) {
            this.resourceService.incrementViewCount(resource.id).subscribe();
          }
        })
      );
    })
  );

  // Breadcrumb Logic: Resource -> Topic -> Category
  breadcrumbInfo$ = this.resource$.pipe(
    switchMap((resource) => {
      if (!resource || !resource.topicId) {
        return of({ category: null, topic: null });
      }

      const topicId = resource.topicId;

      return combineLatest([
        this.categoryService.getCategories(1, 100), // Fetch reasonable amount
        this.topicService.getTopics(undefined, 1, 1000), // Fetch all (bad practice but needed for client-side join without getTopicById)
      ]).pipe(
        map(([categoriesResp, topicsResp]) => {
          const topic = topicsResp.data.find((t: any) => t.id === topicId);
          const category = topic
            ? categoriesResp.data.find((c: any) => c.id === topic.categoryId)
            : null;
          return { category: category || null, topic: topic || null };
        })
      );
    })
  );

  // Re-implementing simplified version assuming we simply add a helper to `CategoryService`
  // OR we just use a quicker check if we can't change service.
  // I will add `getAllTopicsMock` to `general.service.ts` first.

  relatedResources$ = this.resourceService
    .getResources({ page: 1, size: 4 })
    .pipe(map((res) => res.data.content));

  isYouTube(url: string | undefined): boolean {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be');
  }

  getSafeVideoUrl(url: string | undefined): SafeResourceUrl {
    if (!url) return '';
    if (this.isYouTube(url)) {
      let videoId = '';
      if (url.includes('v=')) {
        videoId = url.split('v=')[1].split('&')[0];
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1];
      }
      const embedUrl = `https://www.youtube.com/embed/${videoId}`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  getSafeDocUrl(url: string | undefined): SafeResourceUrl {
    if (!url) return '';
    const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(
      url
    )}&embedded=true`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(viewerUrl);
  }

  canPreviewDoc(resource: Resource): boolean {
    if (!resource.fileUrl) return false;
    const type = resource.type || '';
    return [
      'PDF',
      'WORD',
      'DOC',
      'DOCX',
      'DOCUMENT',
      'EXCEL',
      'PPT',
      'PPTX',
      'POWERPOINT',
    ].includes(type);
  }

  // Pastel colors for avatars
  getAvatarColor(name: string): string {
    const colors = [
      'bg-red-100 text-red-600',
      'bg-orange-100 text-orange-600',
      'bg-amber-100 text-amber-600',
      'bg-green-100 text-green-600',
      'bg-emerald-100 text-emerald-600',
      'bg-teal-100 text-teal-600',
      'bg-cyan-100 text-cyan-600',
      'bg-sky-100 text-sky-600',
      'bg-blue-100 text-blue-600',
      'bg-indigo-100 text-indigo-600',
      'bg-violet-100 text-violet-600',
      'bg-purple-100 text-purple-600',
      'bg-fuchsia-100 text-fuchsia-600',
      'bg-pink-100 text-pink-600',
      'bg-rose-100 text-rose-600',
    ];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash % colors.length);
    return colors[index];
  }

  followAuthor(authorName: string) {
    if (!this.authService.isLoggedIn) {
      alert('Please login to follow authors.');
      return;
    }
    alert(`Followed ${authorName}!`);
  }

  getFileIcon(type: string | undefined): string {
    return FileHelper.getFileIcon(type);
  }

  isDownloading = false;

  downloadResource(resource: Resource) {
    if (!resource || !resource.id) return;
    this.isDownloading = true;

    this.resourceService.downloadFile(resource.id).subscribe({
      next: (response) => {
        const contentDisposition = response.headers.get('content-disposition');
        let filename = 'tai_lieu_mac_dinh.pdf';

        if (contentDisposition) {
          const regex = /filename\*=UTF-8''(.+)/;
          const matches = regex.exec(contentDisposition);
          if (matches != null && matches[1]) {
            filename = decodeURIComponent(matches[1]);
          } else {
            const fallbackRegex = /filename="?([^"]+)"?/;
            const fallbackMatches = fallbackRegex.exec(contentDisposition);
            if (fallbackMatches != null && fallbackMatches[1]) {
              filename = fallbackMatches[1];
            }
          }
        } else if (resource.title) {
          const ext = resource.fileUrl?.split('.').pop() || 'pdf';
          filename = `${resource.title}.${ext}`;
        }

        const blob = response.body;
        if (blob) {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }

        resource.downloadCount = (resource.downloadCount || 0) + 1;
        this.isDownloading = false;
      },
      error: (err) => {
        console.error('Download failed', err);
        this.isDownloading = false;
        // Fallback
        if (resource.fileUrl) {
          window.open(resource.fileUrl, '_blank');
        }
      },
    });
  }

  submitComment(resource: Resource) {
    if (!this.authService.isLoggedIn) {
      alert('You must be logged in to post a comment.');
      return;
    }

    if (!this.newCommentContent.trim()) {
      return;
    }

    const user = this.authService.currentUserValue;
    const newComment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user?.id || 0, // Mock userId if not available
      content: this.newCommentContent,
      createdAt: new Date().toISOString(),
      rating: this.newCommentRating,
      user: user || ({ username: 'Anonymous', avatarUrl: '' } as any), // Mock user object
      resourceId: resource.id,
    };

    // In a real app, call service to save comment.
    // Here we just push to the local resource object for demo.
    if (!resource.comments) {
      resource.comments = [];
    }
    resource.comments.unshift(newComment);

    // Reset form
    this.newCommentContent = '';
    this.newCommentRating = 5;
  }
}
