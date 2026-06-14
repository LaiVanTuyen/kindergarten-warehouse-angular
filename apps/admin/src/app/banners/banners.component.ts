import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NgStyle } from '@angular/common';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Banner,
  BannerService,
  ToastService,
  extractErrorMessage,
} from '@kindergarten-warehouse/data-access';
import { PageHeaderComponent } from '../shared/components/page-header/page-header.component';
import { StatusPillComponent } from '../shared/components/status-pill/status-pill.component';
import { EmptyStateComponent } from '../shared/components/empty-state/empty-state.component';
import { IconButtonComponent } from '../shared/components/icon-button/icon-button.component';
import { DialogService } from '../shared/services/dialog.service';
import { handleHttpError } from '../shared/utils/rx-operators';
import {
  BannerFormDialogComponent,
  BannerFormDialogData,
  BannerFormDialogResult,
  getThemeByTailwind,
} from './components/banner-form-dialog.component';

type PlatformFilter = 'ALL' | 'WEB' | 'MOBILE';
type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

@Component({
  selector: 'app-banners',
  standalone: true,
  imports: [
    CdkDropList,
    CdkDrag,
    PageHeaderComponent,
    StatusPillComponent,
    EmptyStateComponent,
    IconButtonComponent,
    NgStyle,
  ],
  templateUrl: './banners.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BannersComponent {
  private bannerService = inject(BannerService);
  private toast = inject(ToastService);
  private dialogs = inject(DialogService);
  private destroyRef = inject(DestroyRef);

  readonly isLoading = signal(true);
  readonly banners = signal<Banner[]>([]);
  readonly platformFilter = signal<PlatformFilter>('ALL');
  readonly statusFilter = signal<StatusFilter>('ALL');

  readonly filtered = computed(() => {
    const list = this.banners();
    const platform = this.platformFilter();
    const status = this.statusFilter();
    return list.filter((b) => {
      if (platform !== 'ALL' && b.platform !== platform) return false;
      if (status === 'ACTIVE' && b.visibility !== 'PUBLIC') return false;
      if (status === 'INACTIVE' && b.visibility === 'PUBLIC') return false;
      return true;
    });
  });

  readonly activeCount = computed(
    () => this.banners().filter((b) => b.visibility === 'PUBLIC').length
  );

  constructor() {
    this.load();
  }

  load() {
    this.isLoading.set(true);
    this.bannerService
      .getAllBanners(1, 100)
      .pipe(
        handleHttpError(this.toast, 'Không tải được danh sách banner.'),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        this.banners.set(res.result?.content || []);
        this.isLoading.set(false);
      });
  }

  setPlatform(v: PlatformFilter) {
    this.platformFilter.set(v);
  }
  setStatus(v: StatusFilter) {
    this.statusFilter.set(v);
  }

  onDrop(event: CdkDragDrop<Banner[]>) {
    // Phải chọn đúng 1 nền tảng (Web/Mobile) để đảm bảo thứ tự độc lập theo platform
    if (this.platformFilter() === 'ALL') {
      this.toast.show('Vui lòng chọn nền tảng (Web hoặc Mobile) trước khi sắp xếp.', 'info');
      return;
    }
    // Không cho kéo thả khi đang lọc trạng thái để tránh mất thứ tự các banner đang ẩn
    if (this.statusFilter() !== 'ALL') {
      this.toast.show('Vui lòng tắt bộ lọc trạng thái trước khi sắp xếp.', 'info');
      return;
    }
    if (event.previousIndex === event.currentIndex) return;

    // Lưu trạng thái cũ để rollback nếu API thất bại
    const prev = this.banners().map((b) => ({ ...b }));
    const platform = this.platformFilter();

    // Tạo bản sao object (spread) để tránh mutation vô tình làm hỏng prev (dùng cho rollback)
    const next = this.filtered().map(b => ({ ...b }));
    moveItemInArray(next, event.previousIndex, event.currentIndex);
    next.forEach((b, i) => (b.displayOrder = i + 1));

    // Optimistic UI: thay thế VỊ TRÍ VẬT LÝ các phần tử của platform hiện tại
    // trong mảng banners() bằng thứ tự mới, giữ nguyên platform còn lại
    let platformIdx = 0;
    const reordered = this.banners().map(b =>
      b.platform === platform ? next[platformIdx++] : b
    );
    this.banners.set(reordered);

    this.bannerService
      .updateReorderedBanners(next)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.toast.show('Đã cập nhật thứ tự.', 'success'),
        error: () => {
          // Rollback về trạng thái cũ khi API lỗi
          this.banners.set(prev);
          this.toast.show('Không cập nhật được thứ tự. Đã hoàn tác.', 'error');
        },
      });
  }

  openCreate() {
    this.openDialog(null);
  }

  getGradientStyle(banner: Banner) {
    const theme = getThemeByTailwind(banner.bgFrom, banner.bgTo);
    return { 'background-image': `linear-gradient(135deg, ${theme.hexFrom}, ${theme.hexTo})` };
  }

  openEdit(banner: Banner) {
    this.openDialog(banner);
  }

  private openDialog(banner: Banner | null) {
    const data: BannerFormDialogData = { banner };
    this.dialogs
      .openForm<BannerFormDialogResult, BannerFormDialogData>(
        BannerFormDialogComponent,
        data,
        this.destroyRef
      )
      .subscribe((result) => {
        if (!result) return;
        const fd = this.buildFormData(result);
        const req$ = banner
          ? this.bannerService.updateBanner(banner.id, fd)
          : this.bannerService.createBanner(fd);
        req$
          .pipe(
            handleHttpError(
              this.toast,
              banner ? 'Không cập nhật được banner.' : 'Không tạo được banner.'
            ),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe(() => {
            this.toast.show(
              banner ? 'Đã cập nhật banner.' : 'Đã tạo banner mới.',
              'success'
            );
            this.load();
          });
      });
  }

  private buildFormData(result: BannerFormDialogResult): FormData {
    const fd = new FormData();
    const { values, imageFile } = result;
    fd.append('title', values.title);
    fd.append('subtitle', values.subtitle);
    fd.append('link', values.link);
    fd.append('bgFrom', values.bgFrom);
    fd.append('bgTo', values.bgTo);
    fd.append('platform', values.platform);
    fd.append('visibility', values.visibility);
    if (values.startDate) {
      const start = values.startDate.split('T')[0];
      fd.append('startDate', `${start}T00:00:00`);
    }
    if (values.endDate) {
      const end = values.endDate.split('T')[0];
      fd.append('endDate', `${end}T23:59:59`);
    }
    if (imageFile) fd.append('image', imageFile);
    return fd;
  }

  toggleActive(banner: Banner) {
    // Contract v1 §2.4 — PATCH /banners/:id/toggle flips PUBLIC ⇄ PRIVATE.
    const willBe = banner.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
    const prev = this.banners();
    this.banners.set(
      prev.map((b) =>
        b.id === banner.id ? { ...b, visibility: willBe } : b
      )
    );
    this.bannerService
      .toggleBanner(banner.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const updated = res.result;
          if (updated) {
            this.banners.update((list) =>
              list.map((b) =>
                b.id === banner.id ? { ...b, visibility: updated.visibility } : b
              )
            );
          }
          this.toast.show(
            `Đã ${willBe === 'PUBLIC' ? 'hiển thị' : 'ẩn'} banner.`,
            'success'
          );
        },
        error: (err) => {
          // Roll back optimistic update on failure.
          this.banners.set(prev);
          this.toast.show(
            extractErrorMessage(err, 'Không đổi được trạng thái.'),
            'error'
          );
        },
      });
  }

  confirmDelete(banner: Banner) {
    this.dialogs
      .confirm(
        {
          title: 'Xoá banner',
          message: `Xoá "${banner.title}"? Hành động này không thể hoàn tác.`,
          confirmText: 'Xoá',
          cancelText: 'Huỷ',
          tone: 'danger',
        },
        this.destroyRef
      )
      .subscribe((ok) => {
        if (!ok) return;
        this.bannerService
          .deleteBanner(banner.id)
          .pipe(
            handleHttpError(this.toast, 'Không xoá được banner.'),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe(() => {
            this.toast.show('Đã xoá banner.', 'success');
            this.banners.update((list) =>
              list.filter((b) => b.id !== banner.id)
            );
          });
      });
  }
}
