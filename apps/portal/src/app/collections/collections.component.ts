import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';

import {
  COLLECTION_ERRORS,
  CollectionService,
  CollectionSummary,
  CollectionUpsert,
  ToastService,
} from '@kindergarten-warehouse/data-access';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { ErrorStateComponent } from '../shared/error-state/error-state.component';
import { PaginatorComponent } from '../shared/paginator/paginator.component';
import { SpinnerComponent } from '../shared/spinner/spinner.component';
import { CollectionFormDialogComponent } from './collection-form-dialog.component';

type Tab = 'mine' | 'shared';

/** "Bộ học liệu": my collections and collections colleagues have shared. */
@Component({
  selector: 'app-collections',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    EmptyStateComponent,
    ErrorStateComponent,
    PaginatorComponent,
    SpinnerComponent,
    CollectionFormDialogComponent,
  ],
  templateUrl: './collections.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionsComponent implements OnInit {
  private readonly api = inject(CollectionService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly pageSize = 12;
  readonly tab = signal<Tab>('mine');
  readonly page = signal(1);
  readonly totalPages = signal(0);
  readonly items = signal<CollectionSummary[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly creating = signal(false);
  readonly saving = signal(false);
  keyword = '';

  ngOnInit(): void {
    this.load();
  }

  setTab(tab: Tab): void {
    if (tab === this.tab()) return;
    this.tab.set(tab);
    this.page.set(1);
    this.load();
  }

  search(): void {
    this.page.set(1);
    this.load();
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.load();
  }

  create(body: CollectionUpsert): void {
    this.saving.set(true);
    this.api
      .create(body)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (created) => {
          this.creating.set(false);
          this.toast.show('Đã tạo bộ học liệu. Hãy thêm tài liệu vào bộ.', 'success');
          this.router.navigate(['/collections', created.id]);
        },
        error: (err: HttpErrorResponse) =>
          this.toast.show(
            err.error?.code === COLLECTION_ERRORS.LIMIT
              ? 'Bạn đã đạt số bộ học liệu tối đa.'
              : 'Không tạo được bộ học liệu.',
            'error'
          ),
      });
  }

  trackById = (_: number, c: CollectionSummary) => c.id;

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    const request =
      this.tab() === 'mine'
        ? this.api.listMine(this.page(), this.pageSize)
        : this.api.listShared(this.keyword, this.page(), this.pageSize);
    request.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (page) => {
        this.items.set(page?.content ?? []);
        this.totalPages.set(page?.totalPages ?? 0);
      },
      error: () => {
        this.items.set([]);
        this.error.set('Không tải được danh sách bộ học liệu.');
      },
    });
  }
}
