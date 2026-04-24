import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { catchError, map, of, shareReplay } from 'rxjs';

import { Category, CategoryService } from '@kindergarten-warehouse/data-access';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  private readonly categoryService = inject(CategoryService);

  readonly categories$ = this.categoryService.getCategories(1, 4).pipe(
    map((res) => res.data ?? []),
    catchError(() => of<Category[]>([])),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  trackByCategoryId = (_: number, c: Category) => c.id;
  readonly year = new Date().getFullYear();
}
