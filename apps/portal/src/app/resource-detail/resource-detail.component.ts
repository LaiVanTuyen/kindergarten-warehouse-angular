import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ResourceService } from '@kindergarten-warehouse/data-access';
import { switchMap } from 'rxjs';

import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../pipes/translate.pipe';
import {
  AuthService,
  Comment,
  TranslationService,
} from '@kindergarten-warehouse/data-access';
import { registerLocaleData } from '@angular/common';
import localeVi from '@angular/common/locales/vi';

registerLocaleData(localeVi);

@Component({
  selector: 'app-resource-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslatePipe],
  templateUrl: './resource-detail.component.html',
  styles: [],
})
export class ResourceDetailComponent {
  private route = inject(ActivatedRoute);
  private resourceService = inject(ResourceService);
  private sanitizer = inject(DomSanitizer);
  public authService = inject(AuthService);
  public translationService = inject(TranslationService);

  newCommentContent = '';
  newCommentRating = 5;

  resource$ = this.route.paramMap.pipe(
    switchMap((params) => {
      const id = params.get('id');
      return this.resourceService.getResource(id || '');
    })
  );

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

  downloadResource(url: string | undefined) {
    if (!url) return;
    window.open(url, '_blank');
  }

  submitComment(resource: any) {
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
