import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';

/**
 * Thin pink progress bar at the top of the viewport while lazy-loaded routes
 * are resolving. Uses CSS transitions rather than a timer so the bar always
 * finishes cleanly when navigation ends — no leaked intervals.
 */
@Component({
  selector: 'app-route-progress',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="fixed top-0 left-0 right-0 z-[60] h-0.5 pointer-events-none"
      aria-hidden="true"
    >
      <div
        class="h-full bg-gradient-to-r from-pink-400 via-pink-500 to-fuchsia-500 transition-all duration-300 ease-out"
        [style.width.%]="navigating() ? 90 : 0"
        [style.opacity]="navigating() ? 1 : 0"
      ></div>
    </div>
  `,
})
export class RouteProgressComponent {
  private readonly router = inject(Router);

  protected readonly navigating = toSignal(
    this.router.events.pipe(
      filter(
        (e) =>
          e instanceof NavigationStart ||
          e instanceof NavigationEnd ||
          e instanceof NavigationCancel ||
          e instanceof NavigationError
      ),
      map((e) => e instanceof NavigationStart),
      startWith(false)
    ),
    { initialValue: false }
  );
}
