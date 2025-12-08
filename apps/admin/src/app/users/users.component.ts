import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '@kindergarten-warehouse/data-access';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users.component.html',
  styles: [],
})
export class UsersComponent {
  userService = inject(UserService);
}
