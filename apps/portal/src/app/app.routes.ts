import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'resources/:slug',
    loadComponent: () =>
      import('./resource-detail/resource-detail.component').then(
        (m) => m.ResourceDetailComponent
      ),
  },
  {
    path: 'resources',
    loadComponent: () =>
      import('./resource-list/resource-list.component').then(
        (m) => m.ResourceListComponent
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'about',
    loadComponent: () =>
      import('./about/about.component').then((m) => m.AboutComponent),
  },
];
