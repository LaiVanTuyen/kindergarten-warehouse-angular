import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';

import {
  FavoritesService,
  Resource,
  ResourceDownloadService,
} from '@kindergarten-warehouse/data-access';
import { ResourceCardComponent } from '../resource-card/resource-card.component';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { ErrorStateComponent } from '../shared/error-state/error-state.component';
import { PaginatorComponent } from '../shared/paginator/paginator.component';
import { SpinnerComponent } from '../shared/spinner/spinner.component';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ResourceCardComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    PaginatorComponent,
    SpinnerComponent,
  ],
  templateUrl: './favorites.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoritesComponent implements OnInit {
  private readonly favoritesService = inject(FavoritesService);
  private readonly downloadService = inject(ResourceDownloadService);
  private readonly router = inject(Router);

  readonly pageSize = 12;

  readonly page = signal(1);
  readonly totalPages = signal(0);
  readonly totalElements = signal(0);
  readonly resources = signal<Resource[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly isEmpty = computed(
    () => !this.loading() && this.resources().length === 0 && !this.error()
  );

  constructor() {
    // When the user removes a favourite, FavoritesService.ids() shrinks.
    // If the currently loaded page would become empty, step back.
    effect(() => {
      const ids = this.favoritesService.ids();
      const onPage = this.resources();
      if (onPage.length > 0 && onPage.every((r) => !ids.has(r.id))) {
        const target = Math.max(1, this.page() - 1);
        if (target !== this.page()) {
          this.goToPage(target);
        } else {
          this.load();
        }
      }
    });
  }

  ngOnInit(): void {
    this.load();
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.load();
  }

  trackById = (_: number, r: Resource) => r.id;

  onDownload(resource: Resource): void {
    this.downloadService.download(resource).subscribe({ error: () => void 0 });
  }

  onView(resource: Resource): void {
    this.router.navigate(['/resources', resource.slug || resource.id]);
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.favoritesService
      .list(this.page(), this.pageSize)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          const page = res.result ?? res.data;
          this.resources.set(page?.content ?? []);
          this.totalPages.set(page?.totalPages ?? 0);
          this.totalElements.set(page?.totalElements ?? 0);
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(
            err.status === 0
              ? 'Không thể kết nối đến máy chủ.'
              : 'Không tải được danh sách yêu thích.'
          );
          this.resources.set([]);
          this.totalPages.set(0);
        },
      });
  }
}
