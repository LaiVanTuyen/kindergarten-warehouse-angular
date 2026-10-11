import { DestroyRef, Injectable, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';

import { AuthService, NotificationService } from '@kindergarten-warehouse/data-access';

/**
 * Unread badge for the header bell.
 *
 * Refreshes when the user logs in and after each navigation — cheap (one COUNT
 * query) and enough for moderation results that arrive minutes later. No
 * polling timer, so idle tabs do not hit the API.
 */
@Injectable({ providedIn: 'root' })
export class UnreadNotificationsStore {
  private readonly auth = inject(AuthService);
  private readonly api = inject(NotificationService);

  private readonly _unread = signal(0);
  readonly unread = this._unread.asReadonly();

  constructor() {
    effect(() => {
      if (this.auth.currentUser()) {
        this.refresh();
      } else {
        this._unread.set(0);
      }
    });
    inject(Router)
      .events.pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(inject(DestroyRef))
      )
      .subscribe(() => this.refresh());
  }

  refresh(): void {
    if (!this.auth.currentUser()) return;
    this.api.unreadCount().subscribe({
      next: (count) => this._unread.set(count),
      error: () => void 0,
    });
  }

  set(count: number): void {
    this._unread.set(Math.max(0, count));
  }
}
