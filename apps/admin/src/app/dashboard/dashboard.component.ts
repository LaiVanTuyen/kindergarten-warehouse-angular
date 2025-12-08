import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <!-- Stats Card -->
      <div
        class="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center"
      >
        <div class="p-3 rounded-full bg-blue-100 text-primary-blue mr-4">
          <span class="text-2xl">👀</span>
        </div>
        <div>
          <p class="text-sm text-gray-500 font-medium">Total Views</p>
          <p class="text-2xl font-bold text-gray-800">12,450</p>
        </div>
      </div>

      <div
        class="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center"
      >
        <div class="p-3 rounded-full bg-pink-100 text-primary-pink mr-4">
          <span class="text-2xl">📚</span>
        </div>
        <div>
          <p class="text-sm text-gray-500 font-medium">Total Resources</p>
          <p class="text-2xl font-bold text-gray-800">328</p>
        </div>
      </div>

      <div
        class="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center"
      >
        <div class="p-3 rounded-full bg-purple-100 text-purple-500 mr-4">
          <span class="text-2xl">👥</span>
        </div>
        <div>
          <p class="text-sm text-gray-500 font-medium">Active Users</p>
          <p class="text-2xl font-bold text-gray-800">1,205</p>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class DashboardComponent {}
