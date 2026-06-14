import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="flex flex-col items-center justify-center py-12 text-center animate-fade-in"
    >
      <!-- Cute SVG Illustration (Bear/Box) -->
      <svg
        class="w-48 h-48 mb-6"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="100" cy="100" r="90" fill="#F3F4F6" />
        <!-- Box Body -->
        <path
          d="M50 80 L150 80 L150 160 Q150 170 140 170 L60 170 Q50 170 50 160 Z"
          fill="#E5E7EB"
        />
        <path d="M50 80 L150 80 L140 120 L60 120 Z" fill="#D1D5DB" />

        <!-- Bear Head Peeking Out -->
        <path d="M70 80 Q70 40 100 40 Q130 40 130 80" fill="#FCD34D" />
        <!-- Head -->
        <circle cx="80" cy="50" r="10" fill="#FCD34D" />
        <!-- Ear L -->
        <circle cx="120" cy="50" r="10" fill="#FCD34D" />
        <!-- Ear R -->
        <circle cx="90" cy="65" r="3" fill="#374151" />
        <!-- Eye L -->
        <circle cx="110" cy="65" r="3" fill="#374151" />
        <!-- Eye R -->
        <circle cx="100" cy="72" r="5" fill="#FFF" />
        <!-- Muzzle -->
        <circle cx="100" cy="70" r="2" fill="#374151" />
        <!-- Nose -->

        <!-- Decorations -->
        <path
          d="M120 140 L130 150 M60 130 L70 120"
          stroke="#9CA3AF"
          stroke-width="3"
          stroke-linecap="round"
        />
      </svg>

      <h3 class="text-xl font-bold text-ink mb-2">{{ message() }}</h3>
      <p class="text-ink-soft max-w-sm">{{ subMessage() }}</p>
      
      <div class="mt-4">
        <ng-content select="[action]"></ng-content>
      </div>
    </div>
  `,
  styles: [],
})
export class EmptyStateComponent {
  readonly message = input<string>('Không có dữ liệu');
  readonly subMessage = input<string>(
    'Thử điều chỉnh bộ lọc hoặc tìm kiếm để tìm thấy thông tin cần thiết.'
  );
}
