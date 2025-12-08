import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header
      class="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 font-sans sticky top-0 z-50"
    >
      <div
        class="container mx-auto px-4 py-3 flex items-center justify-between"
      >
        <!-- Left Section: Logo + Nav -->
        <div class="flex items-center gap-12">
          <!-- Logo -->
          <div
            class="flex items-center cursor-pointer select-none transistion-transform hover:scale-105 active:scale-95"
            routerLink="/"
          >
            <span class="text-2xl font-black text-primary-pink tracking-tight"
              >Kinder</span
            >
            <span class="text-2xl font-black text-primary-blue tracking-tight"
              >World</span
            >
          </div>

          <!-- Navigation -->
          <nav
            class="hidden md:flex items-center gap-8 text-sm font-bold text-gray-500"
          >
            <a
              routerLink="/"
              class="text-gray-900 hover:text-primary-pink transition-colors"
              >Home</a
            >
            <a
              routerLink="/"
              fragment="categories"
              class="hover:text-primary-pink transition-colors"
              >Categories</a
            >
            <a href="#" class="hover:text-primary-pink transition-colors"
              >About</a
            >
          </nav>
        </div>

        <!-- Right Section: Search -->
        <div class="hidden md:block w-80">
          <div class="relative group">
            <span
              class="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-primary-blue transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
            <input
              type="text"
              #searchInput
              (input)="onSearch(searchInput.value)"
              placeholder="Search resources..."
              class="w-full pl-11 pr-4 py-2.5 rounded-full border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-primary-blue focus:ring-4 focus:ring-primary-blue/10 transition-all text-sm font-medium text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [],
})
export class HeaderComponent {
  private router = inject(Router);

  onSearch(term: string) {
    this.router.navigate([], {
      queryParams: { search: term || null },
      queryParamsHandling: 'merge',
    });
  }
}
