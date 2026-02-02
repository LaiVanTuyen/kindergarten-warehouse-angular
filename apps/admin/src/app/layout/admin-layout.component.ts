import { Component, signal, inject } from '@angular/core';
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
  private authService = inject(AuthService);

  isProfileOpen = signal(false);
  isSidebarOpen = signal(false);

  // Expose currentUser for the template
  currentUser$ = this.authService.currentUser$;

  // Computed initials (or use a pipe/method in template if simpler)
  // Since we use async pipe in template, we can just use a helper method or *ngIf

  // constructor(private authService: AuthService) {} // Removed constructor injection

  toggleProfile() {
    this.isProfileOpen.update((v) => !v);
  }

  toggleSidebar() {
    this.isSidebarOpen.update((v) => !v);
  }

  logout() {
    this.authService.logout('Hẹn gặp lại bạn! 👋');
  }

  getUserInitials(name: string | undefined): string {
    if (!name) return 'A';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getAvatarUrl(url: string | undefined): string {
    return this.authService.formatAvatarUrl(url);
  }
}
