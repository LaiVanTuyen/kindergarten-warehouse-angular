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
    <main class="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-gradient-to-b from-primary-50/40 via-surface to-surface">
      <div class="text-center max-w-lg">
        <div class="inline-flex items-center justify-center size-28 rounded-[2rem] bg-primary-100 text-primary mb-8 shadow-inner"
          aria-hidden="true">
          <i class="ph-fill ph-paw-print text-6xl"></i>
        </div>
        <p class="text-sm font-bold tracking-[0.2em] text-primary mb-2">LỖI 404</p>
        <h1 class="text-4xl sm:text-5xl font-black text-ink tracking-tight mb-4">
          Ơ kìa, lạc đường rồi!
        </h1>
        <p class="text-ink-soft mb-10 text-lg leading-relaxed">
          Trang bạn tìm không tồn tại hoặc đã được di chuyển. Hãy quay lại và cùng khám phá kho học liệu nhé!
        </p>
        <div class="flex flex-wrap items-center justify-center gap-3">
          <a routerLink="/"
            class="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-primary-600 to-accent-500 text-white font-bold shadow-lg hover:shadow-xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2">
            <i class="ph-fill ph-house" aria-hidden="true"></i>
            Về trang chủ
          </a>
          <button type="button" (click)="goBack()"
            class="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-surface ring-1 ring-line text-ink-soft font-bold hover:bg-surface-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">
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
