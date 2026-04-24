import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  Resource,
  ResourceDownloadService,
} from '@kindergarten-warehouse/data-access';

@Component({
  selector: 'app-resource-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resource-detail-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceDetailModalComponent {
  @Input() isOpen = false;
  @Input() resource: Resource | null = null;
  @Output() closeModal = new EventEmitter<void>();

  private readonly sanitizer = inject(DomSanitizer);
  private readonly downloadService = inject(ResourceDownloadService);

  close(): void {
    this.closeModal.emit();
  }

  download(): void {
    if (!this.resource) return;
    this.downloadService.download(this.resource).subscribe({ error: () => void 0 });
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
