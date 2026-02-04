import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Resource, ResourceService } from '@kindergarten-warehouse/data-access';
import { ResourceCardComponent } from '../resource-card/resource-card.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, ResourceCardComponent, RouterModule],
  templateUrl: './favorites.component.html',
  styles: [],
})
export class FavoritesComponent implements OnInit {
  private resourceService = inject(ResourceService);

  favoriteResources: Resource[] = [];
  loading = true;
  isEmpty = false;

  ngOnInit() {
    this.loadFavorites();
  }

  loadFavorites() {
    const favoriteIds: string[] = JSON.parse(
      localStorage.getItem('favorites') || '[]'
    );

    if (favoriteIds.length === 0) {
      this.isEmpty = true;
      this.loading = false;
      return;
    }

    this.loading = true;

    // NOTE: This is a suboptimal way to fetch favorites (Get All then Filter)
    // Ideally, backend should support GET /resources?ids=1,2,3 or GET /favorites
    this.resourceService.getResources({ size: 1000 }).subscribe({
      next: (response) => {
        const allResources = response.data.content;
        this.favoriteResources = allResources.filter((r) =>
          favoriteIds.includes(r.id)
        );
        this.isEmpty = this.favoriteResources.length === 0;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        // Handle error quietly or show toast
      },
    });
  }

  onRemoveFavorite() {
    // Re-load list after removal (Resource Card handles the interaction)
    setTimeout(() => {
      this.loadFavorites();
    }, 100);
  }
}
