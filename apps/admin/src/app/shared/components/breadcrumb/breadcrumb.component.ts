import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import {
  Router,
  NavigationEnd,
  ActivatedRoute,
  RouterModule,
} from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';

interface BreadcrumbItem {
  label: string;
  url: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav
      aria-label="Breadcrumb"
      class="flex text-sm text-kindy-ink-soft"
    >
      <ol class="inline-flex items-center gap-1 md:gap-2 flex-wrap">
        <li class="inline-flex items-center">
          <a
            routerLink="/"
            class="inline-flex items-center gap-1 hover:text-kindy-sidebar transition-colors focus:outline-none focus:ring-2 focus:ring-kindy-sky rounded-md px-1"
          >
            <svg
              class="w-4 h-4"
              aria-hidden="true"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"
              />
            </svg>
            <span>Trang chủ</span>
          </a>
        </li>

        @for (crumb of breadcrumbs(); track crumb.url; let last = $last) {
          <li class="inline-flex items-center">
            <svg
              class="w-4 h-4 text-gray-400 mx-1"
              aria-hidden="true"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clip-rule="evenodd"
              />
            </svg>
            @if (last) {
              <span
                class="font-semibold text-kindy-ink"
                aria-current="page"
              >{{ crumb.label }}</span>
            } @else {
              <a
                [routerLink]="crumb.url"
                class="font-medium hover:text-kindy-sidebar transition-colors focus:outline-none focus:ring-2 focus:ring-kindy-sky rounded-md px-1"
              >{{ crumb.label }}</a>
            }
          </li>
        }
      </ol>
    </nav>
  `,
})
export class BreadcrumbComponent {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  breadcrumbs = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.createBreadcrumbs(this.activatedRoute.root))
    ),
    { initialValue: [] as BreadcrumbItem[] }
  );

  private createBreadcrumbs(
    route: ActivatedRoute,
    url = '',
    breadcrumbs: BreadcrumbItem[] = []
  ): BreadcrumbItem[] {
    const children = route.children;
    if (!children || children.length === 0) {
      return breadcrumbs;
    }
    for (const child of children) {
      // Skip auxiliary routes and guard against uninitialized snapshots
      if (child.outlet !== 'primary' || !child.snapshot) {
        continue;
      }
      
      const routeURL = child.snapshot.url
        .map((segment) => segment.path)
        .join('/');
      
      const nextUrl = routeURL ? `${url}/${routeURL}` : url;
      const label = child.snapshot.data['breadcrumb'];
      
      if (label) {
        breadcrumbs.push({ label, url: nextUrl });
      }
      
      return this.createBreadcrumbs(child, nextUrl, breadcrumbs);
    }
    return breadcrumbs;
  }
}
