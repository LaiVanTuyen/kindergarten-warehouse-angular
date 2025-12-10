import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Resource } from '@kindergarten-warehouse/data-access';

@Component({
  selector: 'app-resource-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resource-detail-modal.component.html',
  styles: [],
})
export class ResourceDetailModalComponent {
  @Input() isOpen = false;
  @Input() resource: Resource | null = null;
  @Output() closeModal = new EventEmitter<void>();

  constructor(private sanitizer: DomSanitizer) {}

  close() {
    this.closeModal.emit();
  }

  download() {
    if (this.resource?.url) {
      window.open(this.resource.url, '_blank');
    }
  }

  getSafeUrl(url: string | undefined): SafeResourceUrl | null {
    if (!url) return null;
    // Basic YouTube embed handling for demo
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://www.youtube.com/embed/${videoId}`
      );
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  getGoogleDocsUrl(url: string | undefined): SafeResourceUrl | null {
    if (!url) return null;
    const googleDocsBase = 'https://docs.google.com/viewer?url=';
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `${googleDocsBase}${encodeURIComponent(url)}&embedded=true`
    );
  }
}
