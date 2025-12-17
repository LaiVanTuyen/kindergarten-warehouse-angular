import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Router,
  NavigationEnd,
  ActivatedRoute,
  RouterModule,
} from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';

interface Breadcrumb {
  label: string;
  url: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="flex text-sm text-slate-400 mb-2" aria-label="Breadcrumb">
      <ol class="inline-flex items-center space-x-1 md:space-x-2">
        <!-- Home Icon -->
        <li class="inline-flex items-center">
          <a
            routerLink="/"
            class="inline-flex items-center hover:text-white transition-colors"
          >
            <svg
              class="w-4 h-4 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"
              ></path>
            </svg>
            Home
          </a>
        </li>

        <!-- Dynamic Breadcrumbs -->
        <li *ngFor="let crumb of breadcrumbs$ | async; let last = last">
          <div class="flex items-center">
            <svg
              class="w-6 h-6 text-slate-600"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clip-rule="evenodd"
              ></path>
            </svg>
            <span *ngIf="last" class="ml-1 text-white font-medium md:ml-2">{{
              crumb.label
            }}</span>
            <a
              *ngIf="!last"
              [routerLink]="crumb.url"
              class="ml-1 font-medium hover:text-white md:ml-2"
              >{{ crumb.label }}</a
            >
          </div>
        </li>
      </ol>
    </nav>
  `,
  styles: [],
})
export class BreadcrumbComponent {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  breadcrumbs$ = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    startWith(this.router), // Emit initial state
    map(() => this.createBreadcrumbs(this.activatedRoute.root))
  );

  private createBreadcrumbs(
    route: ActivatedRoute,
    url = '',
    breadcrumbs: Breadcrumb[] = []
  ): Breadcrumb[] {
    const children: ActivatedRoute[] = route.children;

    if (children.length === 0) {
      return breadcrumbs;
    }

    for (const child of children) {
      const routeURL = child.snapshot.url
        .map((segment) => segment.path)
        .join('/');
      if (routeURL !== '') {
        url += `/${routeURL}`;
      }

      // Verify if route has data 'breadcrumb'
      const label = child.snapshot.data['breadcrumb'];
      if (label) {
        breadcrumbs.push({ label, url });
      }

      return this.createBreadcrumbs(child, url, breadcrumbs);
    }

    return breadcrumbs;
  }
}
