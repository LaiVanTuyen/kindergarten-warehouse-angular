import { Route } from '@angular/router';
import { authGuard, roleGuard } from '@kindergarten-warehouse/data-access';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./home/home.component').then((m) => m.HomeComponent),
    title: 'KinderWorld — Kho học liệu mầm non',
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
    title: 'Kho học liệu',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login.component').then((m) => m.LoginComponent),
    title: 'Đăng nhập',
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./register/register.component').then((m) => m.RegisterComponent),
    title: 'Đăng ký tài khoản',
  },
  {
    path: 'about',
    loadComponent: () =>
      import('./about/about.component').then((m) => m.AboutComponent),
    title: 'Về chúng tôi',
  },

  // --- Authenticated ----------------------------------------------------
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./profile/profile.component').then((m) => m.ProfileComponent),
    title: 'Hồ sơ của tôi',
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./settings/settings.component').then((m) => m.SettingsComponent),
    title: 'Cài đặt',
  },
  {
    path: 'favorites',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./favorites/favorites.component').then(
        (m) => m.FavoritesComponent
      ),
    title: 'Tài liệu yêu thích',
  },

  // --- Teacher-only -----------------------------------------------------
  {
    path: 'teacher/upload',
    canActivate: [roleGuard('TEACHER', 'ADMIN')],
    loadComponent: () =>
      import('./teacher/create-resource/create-resource.component').then(
        (m) => m.CreateResourceComponent
      ),
    title: 'Đăng tài liệu mới',
  },
  {
    path: 'teacher/my-resources',
    canActivate: [roleGuard('TEACHER', 'ADMIN')],
    loadComponent: () =>
      import('./teacher/my-resources/my-resources.component').then(
        (m) => m.MyResourcesComponent
      ),
    title: 'Tài liệu của tôi',
  },

  // --- Fallback ---------------------------------------------------------
  {
    path: '**',
    loadComponent: () =>
      import('./not-found/not-found.component').then(
        (m) => m.NotFoundComponent
      ),
    title: 'Không tìm thấy trang',
  },
];
