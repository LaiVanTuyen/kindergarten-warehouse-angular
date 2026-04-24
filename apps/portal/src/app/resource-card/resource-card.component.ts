import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import {
  AuthService,
  FavoritesService,
  Resource,
  ToastService,
  getResourceBadgeClass,
} from '@kindergarten-warehouse/data-access';
import { RatingStarsComponent } from '../shared/rating-stars/rating-stars.component';

@Component({
  selector: 'app-resource-card',
  standalone: true,
  imports: [CommonModule, RouterModule, RatingStarsComponent],
  templateUrl: './resource-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceCardComponent {
  private readonly favorites = inject(FavoritesService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  private readonly resourceSignal = signal<Resource | null>(null);

  @Input({ required: true })
  set resource(value: Resource) {
    this.resourceSignal.set(value);
  }
  get resource(): Resource {
    return this.resourceSignal()!;
  }

  @Output() view = new EventEmitter<void>();
  @Output() download = new EventEmitter<void>();

  protected readonly imageError = signal(false);

  /** Local heart state derives from the shared FavoritesService signal. */
  protected readonly isFavorited = computed(() => {
    const r = this.resourceSignal();
    return r ? this.favorites.isFavorited(r.id) : false;
  });

  /**
   * Normalized display type (merges YouTube + raw fileType). Typed as `string`
   * so the template can compare against legacy values like 'AUDIO' that the
   * backend historically returned before the fileType enum was narrowed.
   */
  protected readonly rType = computed<string>(() => {
    const r = this.resourceSignal();
    if (!r) return '';
    if (r.resourceType === 'YOUTUBE') return 'VIDEO';
    return r.fileType || 'OTHER';
  });

  protected readonly displayType = computed(() => {
    const r = this.resourceSignal();
    if (!r) return '';
    if (r.resourceType === 'YOUTUBE') return 'Video';
    switch (r.fileType) {
      case 'VIDEO':
        return 'Video';
      case 'PDF':
        return 'PDF';
      case 'DOCUMENT':
        return 'Word';
      case 'EXCEL':
        return 'Excel';
      case 'POWERPOINT':
        return 'PPT';
      case 'IMAGE':
        return 'Ảnh';
      case 'OTHER':
        return 'File';
      default:
        return r.fileExtension || 'File';
    }
  });

  protected readonly badgeClass = computed(() =>
    getResourceBadgeClass(this.resourceSignal()?.fileType || 'OTHER')
  );

  protected readonly autoThumbnail = computed<string | null>(() => {
    const r = this.resourceSignal();
    if (!r) return null;
    if (r.thumbnailUrl) return this.auth.formatAssetUrl(r.thumbnailUrl);
    if (r.resourceType === 'YOUTUBE' && r.fileUrl) {
      const match = r.fileUrl.match(
        /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
      );
      if (match?.[1]) {
        return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
      }
    }
    return null;
  });

  protected readonly ratingValue = computed(() => {
    const r = this.resourceSignal();
    return Number(r?.averageRating ?? r?.rating ?? 0);
  });

  protected onView(): void {
    this.view.emit();
  }

  protected onDownload(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.download.emit();
  }

  protected onImageError(): void {
    this.imageError.set(true);
  }

  protected toggleFavorite(event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    const r = this.resourceSignal();
    if (!r) return;

    if (!this.auth.isLoggedIn()) {
      this.toast.show('Vui lòng đăng nhập để lưu yêu thích', 'info');
      return;
    }

    const willFavorite = !this.favorites.isFavorited(r.id);
    this.favorites.toggle(r.id).subscribe({
      next: (favorited) => {
        this.toast.show(
          favorited
            ? 'Đã thêm vào danh sách yêu thích'
            : 'Đã xoá khỏi danh sách yêu thích',
          favorited ? 'success' : 'info'
        );
      },
      error: () => {
        this.toast.show(
          willFavorite
            ? 'Không thể lưu yêu thích. Vui lòng thử lại.'
            : 'Không thể xoá yêu thích. Vui lòng thử lại.',
          'error'
        );
      },
    });
  }
}
