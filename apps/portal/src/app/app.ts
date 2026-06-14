import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';
import { ThemeService } from '@kindergarten-warehouse/data-access';

import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { ToastComponent } from './shared/toast/toast.component';
import { RouteProgressComponent } from './shared/route-progress/route-progress.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    FooterComponent,
    ToastComponent,
    RouteProgressComponent,
  ],
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly router = inject(Router);
  // Instantiate ThemeService so the saved light/dark preference is applied.
  private readonly theme = inject(ThemeService);

  /**
   * Reactively derive the "chromeless" state (login/register) from router
   * events. Using `toSignal` replaces a constructor-level subscription that
   * had no teardown path — Angular unsubscribes automatically when the
   * component is destroyed.
   */
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  readonly isChromeless = computed(() => {
    const url = this.currentUrl();
    return ['/login', '/register', '/forgot-password', '/reset-password'].some(
      (p) => url.startsWith(p)
    );
  });
}
