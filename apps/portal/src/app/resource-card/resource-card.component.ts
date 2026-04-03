import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { Resource, getResourceBadgeClass } from '@kindergarten-warehouse/data-access';
import { ToastService, AuthService } from '@kindergarten-warehouse/data-access';

@Component({
  selector: 'app-resource-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './resource-card.component.html',
  styles: [],
})
export class ResourceCardComponent implements OnInit {
  @Input({ required: true }) resource!: Resource;
  @Output() view = new EventEmitter<void>();
  @Output() download = new EventEmitter<void>();

  readonly starTemplate = [1, 2, 3, 4, 5];

  isFavorite = false;
  hasImageError = false;

  private toastService = inject(ToastService);
  private authService = inject(AuthService);

  ngOnInit() {
    this.checkFavorite();
  }

  /** Trả về loại tài nguyên chuẩn hóa để dùng trong template */
  get rType(): string {
    if (!this.resource) return '';
    if (this.resource.resourceType === 'YOUTUBE') return 'VIDEO';
    return this.resource.fileType || 'OTHER';
  }

  /** Label ngắn gọn hiển thị bên cạnh icon loại tài liệu */
  get displayType(): string {
    if (!this.resource) return '';
    if (this.resource.resourceType === 'YOUTUBE') return 'Video';
    switch (this.resource.fileType) {
      case 'VIDEO':     return 'Video';
      case 'PDF':       return 'PDF';
      case 'DOCUMENT':  return 'Word';
      case 'EXCEL':     return 'Excel';
      case 'POWERPOINT': return 'PPT';
      case 'IMAGE':     return 'Ảnh';
      case 'OTHER':     return 'File';
      default:          return this.resource.fileExtension || 'File';
    }
  }

  /** Badge color class — chỉ dùng cho loại tài nguyên không phải YOUTUBE */
  get badgeClass(): string {
    if (!this.resource) return 'bg-gray-50 text-gray-600 border-gray-200';
    const type = this.resource.fileType || 'OTHER';
    return getResourceBadgeClass(type);
  }

  /** Tự động lấy thumbnail: ưu tiên thumbnailUrl, nếu là youtube thì tự extract từ URL */
  get autoThumbnail(): string | null {
    if (!this.resource) return null;
    if (this.resource.thumbnailUrl) return this.resource.thumbnailUrl;
    if (this.resource.resourceType === 'YOUTUBE' && this.resource.fileUrl) {
      const match = this.resource.fileUrl.match(
        /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
      );
      if (match?.[1]) {
        return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
      }
    }
    return null;
  }

  onView() {
    this.view.emit();
  }

  onDownload(event: Event) {
    event.stopPropagation();
    this.download.emit();
  }

  onImageError() {
    this.hasImageError = true;
  }

  toggleFavorite(event: Event) {
    event.stopPropagation();

    if (!this.authService.isLoggedIn()) {
      this.toastService.show('Vui lòng đăng nhập để lưu yêu thích', 'info');
      return;
    }

    this.isFavorite = !this.isFavorite;

    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

    if (this.isFavorite) {
      if (!favorites.includes(this.resource.id)) {
        favorites.push(this.resource.id);
        this.toastService.show('Đã thêm vào danh sách yêu thích', 'success');
      }
    } else {
      const index = favorites.indexOf(this.resource.id);
      if (index > -1) {
        favorites.splice(index, 1);
        this.toastService.show('Đã xóa khỏi danh sách yêu thích', 'info');
      }
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }

  checkFavorite() {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    this.isFavorite = favorites.includes(this.resource.id);
  }
}
