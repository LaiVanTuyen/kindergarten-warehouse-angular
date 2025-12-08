import { Route } from '@angular/router';
import { ResourceListComponent } from './resource-list/resource-list.component';

export const appRoutes: Route[] = [
  { path: '', component: ResourceListComponent },
];
