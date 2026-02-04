import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { Resource } from '@kindergarten-warehouse/data-access';
import { ToastService, AuthService } from '@kindergarten-warehouse/data-access';
import { RouterModule } from '@angular/router';

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
  private authService = inject(AuthService); // Inject AuthService

  ngOnInit() {
    this.checkFavorite();
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

    // Check if user is logged in using AuthService
    if (!this.authService.isLoggedIn()) {
      this.toastService.show('Vui lòng đăng nhập để lưu yêu thích', 'info');
      return;
    }

    this.isFavorite = !this.isFavorite;

    // Save to localStorage (MVP)
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
