import { Route } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { roleGuard } from '@kindergarten-warehouse/data-access';

export const appRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent
      ),
  },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [roleGuard('ADMIN')],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
        data: { breadcrumb: 'Bảng điều khiển' },
      },
      {
        path: 'banners',
        loadComponent: () =>
          import('./banners/banners.component').then((m) => m.BannersComponent),
        data: { breadcrumb: 'Banner' },
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./categories/categories.component').then(
            (m) => m.CategoriesComponent
          ),
        data: { breadcrumb: 'Phân loại & Chủ đề' },
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
        data: { breadcrumb: 'Nhật ký hệ thống' },
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./profile/profile.component').then((m) => m.ProfileComponent),
        data: { breadcrumb: 'Hồ sơ cá nhân' },
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
