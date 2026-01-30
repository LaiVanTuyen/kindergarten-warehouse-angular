import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '@kindergarten-warehouse/data-access'; // Assuming AuthService holds current user state
import { map } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile.component.html',
})
export class ProfileComponent {
  private authService = inject(AuthService);
  currentUser$ = this.authService.currentUser$;
}
