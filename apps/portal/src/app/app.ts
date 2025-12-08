import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from './header/header.component';

@Component({
  standalone: true,
  imports: [RouterModule, HeaderComponent],
  selector: 'app-root',
  template: `
    <div class="min-h-screen bg-gray-50 font-sans text-gray-900">
      <app-header></app-header>
      <main>
        <router-outlet></router-outlet>
      </main>
      <footer class="bg-white border-t border-gray-100 py-8 mt-12">
        <div class="container mx-auto px-4 text-center text-gray-400 text-sm">
          &copy; 2024 Kindergarten Digital Resource Warehouse. All rights
          reserved.
        </div>
      </footer>
    </div>
  `,
})
export class AppComponent {
  title = 'portal';
}
