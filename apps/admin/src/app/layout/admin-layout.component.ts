import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { AuthService } from '@kindergarten-warehouse/data-access';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  templateUrl: './admin-layout.component.html',
  styles: [],
})
export class AdminLayoutComponent {
  isProfileOpen = signal(false);
  isSidebarOpen = signal(false);

  constructor(private authService: AuthService) {}

  toggleProfile() {
    this.isProfileOpen.update((v) => !v);
  }

  toggleSidebar() {
    this.isSidebarOpen.update((v) => !v);
  }

  logout() {
    this.authService.logout();
  }
}
