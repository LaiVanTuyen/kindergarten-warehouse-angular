import { Route } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { BannersComponent } from './banners/banners.component';
import { CategoriesComponent } from './categories/categories.component';
import { authGuard } from '@kindergarten-warehouse/data-access';

export const appRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        component: DashboardComponent,
        data: { breadcrumb: 'Bảng điều khiển' },
      },
      {
        path: 'banners',
        component: BannersComponent,
        data: { breadcrumb: 'Banners' },
      },
      {
        path: 'categories',
        component: CategoriesComponent,
        data: { breadcrumb: 'Phân loại' },
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./users/users.component').then((m) => m.UsersComponent),
        data: { breadcrumb: 'Người dùng' },
      },
      {
        path: 'resources',
        loadComponent: () =>
          import('./resources/resources.component').then(
            (m) => m.ResourcesComponent
          ),
        data: { breadcrumb: 'Tài nguyên' },
      },
      {
        path: 'audit-logs',
        loadComponent: () =>
          import('./audit-logs/audit-logs.component').then(
            (m) => m.AuditLogsComponent
          ),
        data: { breadcrumb: 'Nhật ký' },
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./profile/profile.component').then((m) => m.ProfileComponent),
        data: { breadcrumb: 'Hồ sơ cá nhân' },
      },
    ],
  },
];
