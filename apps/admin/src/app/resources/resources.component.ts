import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  CategoriesStore,
  Resource,
  ResourceService,
  ToastService,
  Topic,
  TopicService,
  handleHttpError,
} from '@kindergarten-warehouse/data-access';
import { PageHeaderComponent } from '../shared/components/page-header/page-header.component';
import { StatusPillComponent, StatusPillTone } from '../shared/components/status-pill/status-pill.component';
import { SearchInputComponent } from '../shared/components/search-input/search-input.component';
import { EmptyStateComponent } from '../shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '../shared/components/pagination/pagination.component';
import { IconButtonComponent } from '../shared/components/icon-button/icon-button.component';
import { SortHeaderComponent, SortState } from '../shared/components/sort-header/sort-header.component';
import { DrawerComponent } from '../shared/components/drawer/drawer.component';
import { RelativeTimePipe } from '../shared/pipes/relative-time.pipe';
import { ConfirmDialogData } from '../shared/components/confirm-dialog/confirm-dialog.component';
import { DialogService } from '../shared/services/dialog.service';
import { setupUrlSync } from '../shared/utils/url-sync';

type ResourceStatus = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN' | 'DELETED';

const STATUS_TONES: Record<string, StatusPillTone> = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  HIDDEN: 'inactive',
  DELETED: 'inactive',
};
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  HIDDEN: 'Đã ẩn',
  DELETED: 'Đã xoá',
};

@Component({
  selector: 'app-resources',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
    PageHeaderComponent,
    StatusPillComponent,
    SearchInputComponent,
    EmptyStateComponent,
    PaginationComponent,
    IconButtonComponent,
    SortHeaderComponent,
    DrawerComponent,
    RelativeTimePipe,
  ],
  templateUrl: './resources.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourcesComponent {
  private resourceService = inject(ResourceService);
  private categoriesStore = inject(CategoriesStore);
  private topicService = inject(TopicService);
  private toast = inject(ToastService);
  private dialogs = inject(DialogService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly isLoading = signal(true);
  readonly resources = signal<Resource[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(15);

  readonly search = signal('');
  readonly status = signal<string>('ALL');
  readonly categoryId = signal<string>('');
  readonly topicId = signal<string>('');
  readonly sortKey = signal<string>('createdAt');
  readonly sortDir = signal<'asc' | 'desc'>('desc');

  readonly sortState = computed<SortState>(() => ({
    key: this.sortKey(),
    dir: this.sortDir(),
  }));

  readonly categories = this.categoriesStore.categories;
  readonly topics = signal<Topic[]>([]);

  readonly selection = signal<Set<string>>(new Set());
  readonly selectedResource = signal<Resource | null>(null);

  readonly selectedCount = computed(() => this.selection().size);
  readonly allSelected = computed(() => {
    const s = this.selection();
    const list = this.resources();
    return list.length > 0 && list.every((r) => s.has(r.id));
  });

  readonly hasFilters = computed(
    () =>
      !!(
        this.search() ||
        this.status() !== 'ALL' ||
        this.categoryId() ||
        this.topicId()
      )
  );

  readonly statusOptions: { value: ResourceStatus; label: string }[] = [
    { value: 'ALL', label: 'Tất cả trạng thái' },
    { value: 'PENDING', label: 'Chờ duyệt' },
    { value: 'APPROVED', label: 'Đã duyệt' },
    { value: 'REJECTED', label: 'Từ chối' },
    { value: 'HIDDEN', label: 'Đã ẩn' },
    { value: 'DELETED', label: 'Thùng rác' },
  ];

  constructor() {
    setupUrlSync({
      fields: {
        q: this.search,
        status: this.status,
        cat: this.categoryId,
        topic: this.topicId,
        sort: this.sortKey,
        dir: this.sortDir,
        page: this.page,
      },
      skipValues: ['', 'ALL'],
      router: this.router,
      route: this.route,
    });

    // Uses shared cache — only hits HTTP once per app session.
    this.categoriesStore.load().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();

    // Filter/sort changes reset page and reload. page is NOT tracked (via
    // untracked) so pagination clicks don't trigger infinite reload.
    effect(() => {
      this.search();
      this.status();
      this.categoryId();
      this.topicId();
      this.sortKey();
      this.sortDir();
      untracked(() => {
        this.page.set(1);
        this.selection.set(new Set());
        this.load();
      });
    });

    // Load topics when category changes.
    effect(() => {
      const catId = this.categoryId();
      if (catId) this.loadTopics(catId);
      else this.topics.set([]);
    });
  }

  // --- Loaders ------------------------------------------------------------

  loadTopics(categoryId: string) {
    this.topicService
      .getTopics(categoryId, 1, 200)
      .pipe(
        handleHttpError(this.toast, 'Không tải được chủ đề.'),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => this.topics.set(res.data));
  }

  load() {
    this.isLoading.set(true);
    const sortParam = `${this.sortKey()},${this.sortDir()}`;
    this.resourceService
      .getResources({
        page: this.page(),
        size: this.pageSize(),
        keyword: this.search() || undefined,
        status: this.status() === 'ALL' ? undefined : this.status(),
        categoryId: this.categoryId() || undefined,
        topicId: this.topicId() || undefined,
        sort: sortParam,
      })
      .pipe(
        handleHttpError(this.toast, 'Không tải được danh sách tài nguyên.'),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        const list = res.result?.content ?? res.data?.content ?? [];
        const totalElements =
          res.result?.totalElements ?? res.data?.totalElements ?? 0;
        this.resources.set(list);
        this.total.set(totalElements);
        this.isLoading.set(false);
      });
  }

  onPageChange(p: number) {
    this.page.set(p);
    this.load();
  }

  onSort(state: SortState) {
    this.sortKey.set(state.key);
    this.sortDir.set(state.dir);
  }

  resetFilters() {
    this.search.set('');
    this.status.set('ALL');
    this.categoryId.set('');
    this.topicId.set('');
  }

  // --- Selection ----------------------------------------------------------

  toggleSelect(id: string) {
    const s = new Set(this.selection());
    if (s.has(id)) s.delete(id);
    else s.add(id);
    this.selection.set(s);
  }

  toggleSelectAll() {
    if (this.allSelected()) this.selection.set(new Set());
    else this.selection.set(new Set(this.resources().map((r) => r.id)));
  }

  clearSelection() {
    this.selection.set(new Set());
  }

  isSelected(id: string): boolean {
    return this.selection().has(id);
  }

  // --- Labels / tones -----------------------------------------------------

  statusTone(status: string): StatusPillTone {
    return STATUS_TONES[status] ?? 'neutral';
  }
  statusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }

  // --- Preview drawer -----------------------------------------------------

  openPreview(resource: Resource) {
    this.selectedResource.set(resource);
  }
  closePreview() {
    this.selectedResource.set(null);
  }

  // --- Single actions -----------------------------------------------------

  confirmApprove(resource: Resource) {
    this.dialogs
      .confirm(
        {
          title: 'Phê duyệt tài nguyên',
          message: `Công khai "${resource.title}" cho phụ huynh và giáo viên?`,
          confirmText: 'Phê duyệt',
          cancelText: 'Huỷ',
          tone: 'primary',
        },
        this.destroyRef
      )
      .subscribe((ok) => {
        if (!ok) return;
        this.resourceService
          .approveResource(resource.id)
          .pipe(
            handleHttpError(this.toast, 'Không phê duyệt được.')
          )
          .subscribe(() => {
            this.toast.show(`Đã phê duyệt "${resource.title}".`, 'success');
            this.load();
          });
      });
  }

  confirmReject(resource: Resource) {
    this.dialogs
      .rejectReason({ resourceTitle: resource.title }, this.destroyRef)
      .subscribe((reason) => {
        if (!reason) return;
        this.resourceService
          .rejectResource(resource.id, reason)
          .pipe(
            handleHttpError(this.toast, 'Không từ chối được.')
          )
          .subscribe(() => {
            this.toast.show(`Đã từ chối "${resource.title}".`, 'info');
            this.load();
          });
      });
  }

  confirmDelete(resource: Resource) {
    const isTrash = this.status() === 'DELETED';
    const data: ConfirmDialogData = isTrash
      ? {
          title: 'Xoá vĩnh viễn',
          message: `Xoá vĩnh viễn "${resource.title}"? Không thể hoàn tác.`,
          confirmText: 'Xoá vĩnh viễn',
          cancelText: 'Huỷ',
          tone: 'danger',
        }
      : {
          title: 'Chuyển vào thùng rác',
          message: `Chuyển "${resource.title}" vào thùng rác?`,
          confirmText: 'Xoá',
          cancelText: 'Huỷ',
          tone: 'danger',
        };
    this.dialogs.confirm(data, this.destroyRef).subscribe((ok) => {
      if (!ok) return;
      this.resourceService
        .deleteResource(resource.id, isTrash)
        .pipe(
          handleHttpError(this.toast, 'Không xoá được.')
        )
        .subscribe(() => {
          this.toast.show(
            isTrash ? 'Đã xoá vĩnh viễn.' : 'Đã chuyển vào thùng rác.',
            'success'
          );
          this.load();
        });
    });
  }

  restore(resource: Resource) {
    this.resourceService
      .restoreResource(resource.id)
      .pipe(
        handleHttpError(this.toast, 'Không khôi phục được.')
      )
      .subscribe(() => {
        this.toast.show('Đã khôi phục tài nguyên.', 'success');
        this.load();
      });
  }

  // --- Bulk actions -------------------------------------------------------

  bulkApprove() {
    const ids = Array.from(this.selection());
    if (!ids.length) return;
    this.dialogs
      .confirm(
        {
          title: `Phê duyệt ${ids.length} tài nguyên`,
          message: 'Tất cả các mục đã chọn sẽ được công khai. Tiếp tục?',
          confirmText: 'Phê duyệt tất cả',
          cancelText: 'Huỷ',
          tone: 'primary',
        },
        this.destroyRef
      )
      .subscribe((ok) => {
        if (!ok) return;
        this.resourceService
          .bulkApproveResources(ids)
          .pipe(
            handleHttpError(this.toast, 'Không phê duyệt được.')
          )
          .subscribe((res) => {
            const n = res.result?.successCount ?? ids.length;
            this.toast.show(`Đã phê duyệt ${n} tài nguyên.`, 'success');
            this.clearSelection();
            this.load();
          });
      });
  }

  bulkReject() {
    const ids = Array.from(this.selection());
    if (!ids.length) return;
    this.dialogs
      .rejectReason(
        { resourceTitle: `${ids.length} tài nguyên đã chọn` },
        this.destroyRef
      )
      .subscribe((reason) => {
        if (!reason) return;
        this.resourceService
          .bulkRejectResources(ids, reason)
          .pipe(
            handleHttpError(this.toast, 'Không từ chối được.')
          )
          .subscribe((res) => {
            const n = res.result?.successCount ?? ids.length;
            this.toast.show(`Đã từ chối ${n} tài nguyên.`, 'info');
            this.clearSelection();
            this.load();
          });
      });
  }

  bulkDelete() {
    const ids = Array.from(this.selection());
    if (!ids.length) return;
    const isTrash = this.status() === 'DELETED';
    this.dialogs
      .confirm(
        {
          title: `${isTrash ? 'Xoá vĩnh viễn' : 'Chuyển vào thùng rác'} ${ids.length} mục`,
          message: isTrash
            ? 'Hành động này không thể hoàn tác.'
            : 'Các tài nguyên sẽ vào thùng rác và có thể khôi phục.',
          confirmText: isTrash ? 'Xoá vĩnh viễn' : 'Xoá',
          cancelText: 'Huỷ',
          tone: 'danger',
        },
        this.destroyRef
      )
      .subscribe((ok) => {
        if (!ok) return;
        this.resourceService
          .bulkDeleteResources(ids, isTrash)
          .pipe(
            handleHttpError(this.toast, 'Không xoá được.')
          )
          .subscribe(() => {
            this.toast.show(`Đã xoá ${ids.length} tài nguyên.`, 'success');
            this.clearSelection();
            this.load();
          });
      });
  }

  bulkRestore() {
    const ids = Array.from(this.selection());
    if (!ids.length) return;
    this.resourceService
      .bulkRestoreResources(ids)
      .pipe(
        handleHttpError(this.toast, 'Không khôi phục được.')
      )
      .subscribe(() => {
        this.toast.show(`Đã khôi phục ${ids.length} mục.`, 'success');
        this.clearSelection();
        this.load();
      });
  }
}
