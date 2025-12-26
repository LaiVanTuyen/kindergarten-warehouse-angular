import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ResourceService, Resource } from '@kindergarten-warehouse/data-access';
import { switchMap, map, of, combineLatest } from 'rxjs';

import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../pipes/translate.pipe';
import { ResourceCardComponent } from '../resource-card/resource-card.component';
import {
  AuthService,
  Category,
  Topic,
  CategoryService,
  Comment,
  TranslationService,
} from '@kindergarten-warehouse/data-access';
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
  private sanitizer = inject(DomSanitizer);
  public authService = inject(AuthService);
  public translationService = inject(TranslationService);

  newCommentContent = '';
  newCommentRating = 5;

  resource$ = this.route.paramMap.pipe(
    switchMap((params) => {
      const slug = params.get('slug');
      return this.resourceService.getResource(slug || '');
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
        this.categoryService.getCategories(),
        this.categoryService.getAllTopicsMock(),
      ]).pipe(
        map(([categories, topics]) => {
          const topic = topics.find((t) => t.id === topicId);
          const category = topic
            ? categories.data.find((c) => c.id === topic.categoryId)
            : null;
          // Fallback if topic not found but resource has explicit category?
          // Usually resource only has topicId based on model.
          return { category: category || null, topic: topic || null };
        })
      );
    })
  );

  // Re-implementing simplified version assuming we simply add a helper to `CategoryService`
  // OR we just use a quicker check if we can't change service.
  // I will add `getAllTopicsMock` to `general.service.ts` first.

  relatedResources$ = this.resourceService
    .getResources(1, 4)
    .pipe(map((res) => res.data));

  isYouTube(url: string | undefined): boolean {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be');
  }

  getSafeVideoUrl(url: string | undefined): SafeResourceUrl {
    if (!url) return '';
    if (this.isYouTube(url)) {
      // Extract video ID and create embed URL
      let videoId = '';
      if (url.includes('v=')) {
        videoId = url.split('v=')[1].split('&')[0];
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1];
      }
      return this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://www.youtube.com/embed/${videoId}`
      );
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  getSafeDocUrl(url: string | undefined): SafeResourceUrl {
    if (!url) return '';
    const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
      url
    )}&embedded=true`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(viewerUrl);
  }

  downloadResource(resource: Resource) {
    if (resource.url) {
      window.open(resource.url, '_blank');
    }
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
      user: user?.username || 'Anonymous',
      content: this.newCommentContent,
      date: new Date(),
      rating: this.newCommentRating,
      avatarUrl: user?.avatarUrl,
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
