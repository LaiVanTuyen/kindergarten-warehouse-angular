import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';

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

  constructor(private router: Router) {}

  toggleProfile() {
    this.isProfileOpen.update((v) => !v);
  }

  toggleSidebar() {
    this.isSidebarOpen.update((v) => !v);
  }

  logout() {
    console.log('Logging out...');
    // In a real app, clear tokens here
    this.router.navigate(['/portal']);
  }
}
