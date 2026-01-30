import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { CategoryService } from '@kindergarten-warehouse/data-access';
import { map } from 'rxjs';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.component.html',
})
export class FooterComponent {
  private categoryService = inject(CategoryService);

  categories$ = this.categoryService
    .getCategories(1, 4)
    .pipe(map((res) => res.data));
}
