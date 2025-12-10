import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed top-20 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
    >
      <div
        *ngFor="let toast of toastService.toasts()"
        class="pointer-events-auto transform transition-all duration-300 ease-in-out min-w-[300px] max-w-md p-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in"
        [ngClass]="{
          'bg-green-500 text-white': toast.type === 'success',
          'bg-red-500 text-white': toast.type === 'error',
          'bg-blue-500 text-white': toast.type === 'info',
          'bg-yellow-500 text-white': toast.type === 'warning'
        }"
      >
        <!-- Icons -->
        <span *ngIf="toast.type === 'success'" class="text-xl">✅</span>
        <span *ngIf="toast.type === 'error'" class="text-xl">❌</span>
        <span *ngIf="toast.type === 'info'" class="text-xl">ℹ️</span>
        <span *ngIf="toast.type === 'warning'" class="text-xl">⚠️</span>

        <p class="font-medium text-sm flex-1">{{ toast.message }}</p>

        <button
          (click)="toastService.remove(toast.id)"
          class="opacity-70 hover:opacity-100 transition-opacity"
        >
          ✖
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      @keyframes slide-in {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      .animate-slide-in {
        animation: slide-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
    `,
  ],
})
export class ToastComponent {
  toastService = inject(ToastService);
}
