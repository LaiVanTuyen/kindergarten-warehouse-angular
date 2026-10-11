import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

import {
  DiscoveryService,
  DownloadHistoryItem,
  ResourceDownloadService,
} from '@kindergarten-warehouse/data-access';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { ErrorStateComponent } from '../shared/error-state/error-state.component';
import { PaginatorComponent } from '../shared/paginator/paginator.component';
import { SpinnerComponent } from '../shared/spinner/spinner.component';

/** Lịch sử tải về: mỗi tài liệu một dòng, kèm số lần tải và lần tải gần nhất. */
@Component({
  selector: 'app-downloads',
  standalone: true,
  imports: [CommonModule, RouterModule, EmptyStateComponent, ErrorStateComponent, PaginatorComponent, SpinnerComponent],
  templateUrl: './downloads.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DownloadsComponent implements OnInit {
  private readonly discovery = inject(DiscoveryService);
  private readonly downloadService = inject(ResourceDownloadService);

  readonly pageSize = 10;
  readonly page = signal(1);
  readonly totalPages = signal(0);
  readonly items = signal<DownloadHistoryItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.load();
  }

  downloadAgain(item: DownloadHistoryItem): void {
    // Re-downloading refreshes the history row; reload so order/count stay true.
    this.downloadService.download(item.resource).subscribe({
      complete: () => this.load(),
      error: () => void 0,
    });
  }

  trackById = (_: number, item: DownloadHistoryItem) => item.resource.id;

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.discovery
      .getMyDownloads(this.page(), this.pageSize)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (page) => {
          this.items.set(page?.content ?? []);
          this.totalPages.set(page?.totalPages ?? 0);
        },
        error: () => {
          this.items.set([]);
          this.error.set('Không tải được lịch sử tải về.');
        },
      });
  }
}
