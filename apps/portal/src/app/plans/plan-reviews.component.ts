import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { LessonPlanService, LessonPlanSummary } from '@kindergarten-warehouse/data-access';
import { PaginatorComponent } from '../shared/paginator/paginator.component';

/** ADMIN: plans waiting for "duyệt chuyên môn". Review happens on the plan page itself. */
@Component({
  selector: 'app-plan-reviews',
  standalone: true,
  imports: [CommonModule, RouterModule, PaginatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-surface-2 pt-24 pb-16">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <h1 class="text-3xl font-extrabold text-ink mb-2">Duyệt chuyên môn</h1>
        <p class="text-ink-soft mb-6">Kế hoạch giáo viên gửi duyệt, gửi sớm nhất ở trên. Mở kế hoạch để đọc và quyết định.</p>
        <p *ngIf="error()" class="text-danger mb-4" role="alert">{{ error() }}</p>
        <p *ngIf="!loading() && !items().length && !error()" class="text-ink-muted">Không có kế hoạch nào đang chờ duyệt.</p>
        <ul class="space-y-3" [class.opacity-60]="loading()">
          <li *ngFor="let p of items()" class="bg-surface rounded-2xl border border-line p-4 flex flex-wrap items-center gap-3">
            <div class="flex-1 min-w-0">
              <a [routerLink]="['/plans', p.id]" class="font-bold text-ink hover:text-primary break-words">{{ p.title }}</a>
              <p class="text-sm text-ink-muted">{{ p.ownerName }}<span *ngIf="p.ageGroup"> · {{ p.ageGroup.name }}</span> · cập nhật {{ p.updatedAt | date:'dd/MM/yyyy HH:mm' }}</p>
            </div>
            <a [routerLink]="['/plans', p.id]" class="px-4 py-2 rounded-xl bg-primary text-ink-onbrand text-sm font-semibold">Xem và duyệt</a>
          </li>
        </ul>
        <div *ngIf="totalPages() > 1" class="mt-8 flex justify-center">
          <app-paginator [page]="page()" [totalPages]="totalPages()" (pageChange)="goToPage($event)"></app-paginator>
        </div>
      </div>
    </div>
  `,
})
export class PlanReviewsComponent implements OnInit {
  private readonly api = inject(LessonPlanService);

  readonly items = signal<LessonPlanSummary[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .reviewQueue(this.page(), 20)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (p) => {
          this.items.set(p?.content ?? []);
          this.totalPages.set(p?.totalPages ?? 0);
        },
        error: () => this.error.set('Không tải được hàng đợi duyệt.'),
      });
  }
}
