import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResourceService } from '@kindergarten-warehouse/data-access';

@Component({
  selector: 'app-admin-resources',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resources.component.html',
  styles: [],
})
export class ResourcesComponent {
  resourceService = inject(ResourceService);
  resources$ = this.resourceService.getResources();
}
