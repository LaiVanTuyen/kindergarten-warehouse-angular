import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AppNotification, NotificationService } from '@kindergarten-warehouse/data-access';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { ErrorStateComponent } from '../shared/error-state/error-state.component';
import { PaginatorComponent } from '../shared/paginator/paginator.component';
import { SpinnerComponent } from '../shared/spinner/spinner.component';
import { UnreadNotificationsStore } from './unread-notifications.store';

const ICONS: Record<AppNotification['type'], string> = {
  RESOURCE_APPROVED: 'ph-fill ph-check-circle text-success',
  RESOURCE_REJECTED: 'ph-fill ph-x-circle text-danger',
  REPORT_RESOLVED: 'ph-fill ph-shield-check text-primary',
  REPORT_DISMISSED: 'ph-fill ph-info text-ink-muted',
};

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule, EmptyStateComponent, ErrorStateComponent, PaginatorComponent, SpinnerComponent],
  templateUrl: './notifications.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsComponent implements OnInit {
  private readonly api = inject(NotificationService);
  private readonly store = inject(UnreadNotificationsStore);
  private readonly router = inject(Router);

  readonly pageSize = 15;
  readonly page = signal(1);
  readonly totalPages = signal(0);
  readonly items = signal<AppNotification[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly hasUnread = computed(() => this.store.unread() > 0);

  ngOnInit(): void {
    this.load();
  }

  icon(type: AppNotification['type']): string {
    return ICONS[type] ?? 'ph ph-bell';
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.load();
  }

  open(item: AppNotification): void {
    if (!item.isRead) {
      // Update the badge only once the server agrees; on failure keep it unread
      // and re-sync the count instead of drifting from the backend.
      this.api.markRead(item.id).subscribe({
        next: () => {
          this.items.update((list) => list.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
          this.store.set(this.store.unread() - 1);
        },
        error: () => this.store.refresh(),
      });
    }
    if (item.link) this.router.navigateByUrl(item.link);
  }

  markAllRead(): void {
    this.api.markAllRead().subscribe({
      next: () => {
        this.items.update((list) => list.map((n) => ({ ...n, isRead: true })));
        this.store.set(0);
      },
      error: () => this.store.refresh(),
    });
  }

  trackById = (_: number, n: AppNotification) => n.id;

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .list(this.page(), this.pageSize)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (page) => {
          this.items.set(page?.content ?? []);
          this.totalPages.set(page?.totalPages ?? 0);
        },
        error: () => this.error.set('Không tải được thông báo.'),
      });
  }
}
