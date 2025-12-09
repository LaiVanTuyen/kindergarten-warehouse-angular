import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside
      class="w-64 bg-[#1E293B] text-white flex-shrink-0 flex flex-col h-full transition-all duration-300"
    >
      <!-- Branding -->
      <div class="h-16 flex items-center px-6 border-b border-white/10">
        <h1 class="text-2xl font-bold tracking-wider text-white">K-Admin</h1>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 mt-6 overflow-y-auto w-full">
        <ul class="space-y-1">
          <!-- Dashboard -->
          <li>
            <a
              routerLink="/dashboard"
              routerLinkActive="bg-white/10 border-l-4 border-primary-pink text-white"
              class="flex items-center px-6 py-3 text-gray-400 hover:bg-white/5 hover:text-white transition-colors group"
            >
              <i class="mr-3 text-lg" data-lucide="layout-grid">📊</i>
              <span class="font-medium">Dashboard</span>
            </a>
          </li>

          <!-- Banners -->
          <li>
            <a
              routerLink="/banners"
              routerLinkActive="bg-white/10 border-l-4 border-primary-pink text-white"
              class="flex items-center px-6 py-3 text-gray-400 hover:bg-white/5 hover:text-white transition-colors group"
            >
              <i class="mr-3 text-lg" data-lucide="image">🖼️</i>
              <span class="font-medium">Banners</span>
            </a>
          </li>

          <!-- Categories & Topics -->
          <li>
            <a
              routerLink="/categories"
              routerLinkActive="bg-white/10 border-l-4 border-primary-pink text-white"
              class="flex items-center px-6 py-3 text-gray-400 hover:bg-white/5 hover:text-white transition-colors group"
            >
              <i class="mr-3 text-lg" data-lucide="tag">🏷️</i>
              <span class="font-medium">Categories & Topics</span>
            </a>
          </li>

          <!-- Resources -->
          <li>
            <a
              routerLink="/resources"
              routerLinkActive="bg-white/10 border-l-4 border-primary-pink text-white"
              class="flex items-center px-6 py-3 text-gray-400 hover:bg-white/5 hover:text-white transition-colors group"
            >
              <i class="mr-3 text-lg" data-lucide="book-open">📚</i>
              <span class="font-medium">Resources</span>
            </a>
          </li>

          <!-- Users -->
          <li>
            <a
              routerLink="/users"
              routerLinkActive="bg-white/10 border-l-4 border-primary-pink text-white"
              class="flex items-center px-6 py-3 text-gray-400 hover:bg-white/5 hover:text-white transition-colors group"
            >
              <i class="mr-3 text-lg" data-lucide="users">👥</i>
              <span class="font-medium">Users</span>
            </a>
          </li>

          <!-- Profile -->
          <li>
            <a
              routerLink="/profile"
              routerLinkActive="bg-white/10 border-l-4 border-primary-pink text-white"
              class="flex items-center px-6 py-3 text-gray-400 hover:bg-white/5 hover:text-white transition-colors group"
            >
              <i class="mr-3 text-lg" data-lucide="settings">⚙️</i>
              <span class="font-medium">Profile</span>
            </a>
          </li>
        </ul>
      </nav>

      <!-- Footer / Version -->
      <div class="p-6 border-t border-white/10 text-xs text-gray-500">
        <p>v1.0.0</p>
      </div>
    </aside>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
    `,
  ],
})
export class SidebarComponent {}
