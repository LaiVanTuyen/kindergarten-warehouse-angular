import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-gradient-to-b from-pink-50/40 via-white to-white">
      <div class="text-center max-w-lg">
        <div class="inline-flex items-center justify-center size-28 rounded-[2rem] bg-pink-100 text-pink-500 mb-8 shadow-inner"
          aria-hidden="true">
          <i class="ph-fill ph-paw-print text-6xl"></i>
        </div>
        <p class="text-sm font-bold tracking-[0.2em] text-pink-500 mb-2">LỖI 404</p>
        <h1 class="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-4">
          Ơ kìa, lạc đường rồi!
        </h1>
        <p class="text-gray-600 mb-10 text-lg leading-relaxed">
          Trang bạn tìm không tồn tại hoặc đã được di chuyển. Hãy quay lại và cùng khám phá kho học liệu nhé!
        </p>
        <div class="flex flex-wrap items-center justify-center gap-3">
          <a routerLink="/"
            class="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white font-bold shadow-lg hover:shadow-xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:ring-offset-2">
            <i class="ph-fill ph-house" aria-hidden="true"></i>
            Về trang chủ
          </a>
          <button type="button" (click)="goBack()"
            class="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white ring-1 ring-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400">
            <i class="ph ph-arrow-left" aria-hidden="true"></i>
            Quay lại
          </button>
        </div>
      </div>
    </main>
  `,
})
export class NotFoundComponent {
  private readonly location = inject(Location);

  goBack(): void {
    this.location.back();
  }
}
