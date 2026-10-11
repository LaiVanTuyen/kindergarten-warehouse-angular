import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';

import {
  AuthService,
  AuthorProfile,
  DiscoveryService,
  Resource,
  ResourceDownloadService,
  ResourceService,
} from '@kindergarten-warehouse/data-access';
import { ResourceCardComponent } from '../resource-card/resource-card.component';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { ErrorStateComponent } from '../shared/error-state/error-state.component';
import { PaginatorComponent } from '../shared/paginator/paginator.component';
import { SpinnerComponent } from '../shared/spinner/spinner.component';

/** Trang công khai của giáo viên: thông tin, thống kê và tài liệu đã đăng. */
@Component({
  selector: 'app-author',
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
  templateUrl: './author.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthorComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly discovery = inject(DiscoveryService);
  private readonly resourceService = inject(ResourceService);
  private readonly downloadService = inject(ResourceDownloadService);
  readonly authService = inject(AuthService);

  readonly pageSize = 12;
  readonly authorId = signal<number | null>(null);
  readonly author = signal<AuthorProfile | null>(null);
  readonly authorError = signal<string | null>(null);
  readonly resources = signal<Resource[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(0);
  readonly loading = signal(false);
  readonly initial = computed(() => (this.author()?.fullName || 'A').charAt(0).toUpperCase());

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const id = Number(params.get('id'));
      if (!Number.isInteger(id) || id <= 0) {
        this.authorError.set('Không tìm thấy tác giả.');
        return;
      }
      this.authorId.set(id);
      this.page.set(1);
      this.loadAuthor(id);
      this.loadResources();
    });
  }

  retry(): void {
    const id = this.authorId();
    if (!id) return;
    this.loadAuthor(id);
    this.loadResources();
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.loadResources();
  }

  trackById = (_: number, r: Resource) => r.id;

  onView(resource: Resource): void {
    this.router.navigate(['/resources', resource.slug || resource.id]);
  }

  onDownload(resource: Resource): void {
    this.downloadService.download(resource).subscribe({ error: () => void 0 });
  }

  private loadAuthor(id: number): void {
    this.author.set(null);
    this.authorError.set(null);
    this.discovery.getAuthor(id).subscribe({
      next: (author) => this.author.set(author),
      error: (err: HttpErrorResponse) =>
        this.authorError.set(
          err.status === 404 ? 'Không tìm thấy tác giả.' : 'Không tải được thông tin tác giả.'
        ),
    });
  }

  private loadResources(): void {
    const id = this.authorId();
    if (!id) return;
    this.loading.set(true);
    this.resourceService
      .getPortalResources({ page: this.page(), size: this.pageSize, createdBy: id, sort: 'createdAt,desc' })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          const page = res.result ?? res.data;
          this.resources.set(page?.content ?? []);
          this.totalPages.set(page?.totalPages ?? 0);
        },
        error: () => {
          this.resources.set([]);
          this.totalPages.set(0);
        },
      });
  }
}
