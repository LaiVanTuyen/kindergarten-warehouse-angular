import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../pipes/translate.pipe';
import { Resource } from '@kindergarten-warehouse/data-access';
import { ToastService } from '@kindergarten-warehouse/data-access';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-resource-card',
  standalone: true,
  imports: [CommonModule, TranslatePipe, RouterModule],
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
    // Optional: set a default src if needed, but we used *ngIf in HTML
  }

  toggleFavorite(event: Event) {
    event.stopPropagation();

    // Check if user is logged in (mock)
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'; // simple mock

    if (!isLoggedIn) {
      this.toastService.show('Please login to save favorites', 'info');
      return;
    }

    this.isFavorite = !this.isFavorite;

    // Save to localStorage (MVP)
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (this.isFavorite) {
      favorites.push(this.resource.id);
      this.toastService.show('Added to favorites', 'success');
    } else {
      // alert('Added to favorites!');
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }

  checkFavorite() {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    this.isFavorite = favorites.includes(this.resource.id);
  }
}
