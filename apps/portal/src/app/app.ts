import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { ToastComponent } from './shared/toast/toast.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, ToastComponent],
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent {
  title = 'portal';
  isLoginPage = false;

  private router = inject(Router);

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.isLoginPage =
          event.url.includes('/login') || event.url.includes('/register');
      }
    });
  }
}
