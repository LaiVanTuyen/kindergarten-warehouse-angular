import { Route } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { BannersComponent } from './banners/banners.component';
import { CategoriesComponent } from './categories/categories.component';
import { ResourcesComponent } from './resources/resources.component';
import { UsersComponent } from './users/users.component';

export const appRoutes: Route[] = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'banners', component: BannersComponent },
      { path: 'categories', component: CategoriesComponent },
      { path: 'resources', component: ResourcesComponent },
      { path: 'users', component: UsersComponent },
      { 
        path: 'profile', 
        loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent) 
      },
    ],
  },
];
