import {
  Component,
  EventEmitter,
  Output,
  computed,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true, // Making it standalone as no SharedModule was found
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
})
export class PaginationComponent {
  currentPage = input.required<number>();
  pageSize = input.required<number>();
  totalItems = input.required<number>();
  itemName = input<string>('mục');

  @Output() pageChange = new EventEmitter<number>();

  totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()));

  startItem = computed(() => (this.currentPage() - 1) * this.pageSize() + 1);
  endItem = computed(() =>
    Math.min(this.currentPage() * this.pageSize(), this.totalItems())
  );

  pages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }

    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }

    return [1, '...', current - 1, current, current + 1, '...', total];
  });

  onPageClick(page: number | string) {
    if (typeof page === 'number') {
      this.onPageChange(page);
    }
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages() && page !== this.currentPage()) {
      this.pageChange.emit(page);
    }
  }

  trackByIndex(index: number): number {
    return index;
  }
}
