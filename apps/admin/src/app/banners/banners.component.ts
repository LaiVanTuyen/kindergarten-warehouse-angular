import { Component, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  DragDropModule,
  CdkDragDrop,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { Banner } from '@kindergarten-warehouse/data-access';
import { BannerService } from '@kindergarten-warehouse/data-access';

@Component({
  selector: 'app-banners',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DragDropModule],
  templateUrl: './banners.component.html',
  styles: [
    `
      .cdk-drag-preview {
        box-sizing: border-box;
        border-radius: 4px;
        box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2),
          0 8px 10px 1px rgba(0, 0, 0, 0.14), 0 3px 14px 2px rgba(0, 0, 0, 0.12);
      }
      .cdk-drag-placeholder {
        opacity: 0;
      }
      .cdk-drag-animating {
        transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
      }
      .banner-list.cdk-drop-list-dragging
        .banner-box:not(.cdk-drag-placeholder) {
        transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
      }
    `,
  ],
})
export class BannersComponent implements OnInit {
  banners = signal<Banner[]>([]);
  isModalOpen = signal(false);
  isEditMode = signal(false);

  // Image Preview Modal
  isPreviewModalOpen = signal(false);
  previewImageUrl = signal<string | null>(null);

  currentBannerId: number | null = null;
  bannerForm: FormGroup;

  // Delete Modal Signals
  isDeleteModalOpen = signal(false);
  bannerToDelete = signal<Banner | null>(null);

  constructor(private fb: FormBuilder, private bannerService: BannerService) {
    this.bannerForm = this.fb.group({
      image_url: ['', [Validators.required]],
      link: [''],
      display_order: [0, [Validators.required, Validators.min(0)]],
      is_active: [true],
      start_date: [''],
      end_date: [''],
      platform: ['desktop'],
    });
  }

  ngOnInit() {
    this.loadBanners();
  }

  loadBanners() {
    this.bannerService.getBanners().subscribe((data) => {
      // Sort by display_order initially
      const sorted = data.sort((a, b) => a.display_order - b.display_order);
      this.banners.set(sorted);
    });
  }

  // Drag & Drop
  drop(event: CdkDragDrop<Banner[]>) {
    const currentBanners = [...this.banners()];
    moveItemInArray(currentBanners, event.previousIndex, event.currentIndex);

    // Update display_order based on new index
    const updatedBanners = currentBanners.map((banner, index) => ({
      ...banner,
      display_order: index + 1,
    }));

    this.banners.set(updatedBanners);

    // TODO: Call API to save sorting order
    // this.bannerService.updateOrder(updatedBanners).subscribe();
  }

  // Status & Expiration
  isExpired(banner: Banner): boolean {
    if (!banner.end_date) return false;
    const now = new Date();
    const end = new Date(banner.end_date);
    return now > end;
  }

  toggleStatus(banner: Banner, event: Event) {
    event.stopPropagation(); // Prevent card click
    const newStatus = !banner.is_active;
    const updatedBanner = { ...banner, is_active: newStatus };

    // Optimistic update
    this.banners.update((list) =>
      list.map((b) => (b.id === banner.id ? updatedBanner : b))
    );

    this.bannerService.updateBanner(banner.id, updatedBanner).subscribe({
      error: () => {
        // Revert on error
        this.banners.update((list) =>
          list.map((b) => (b.id === banner.id ? banner : b))
        );
        alert('Failed to update status');
      },
    });
  }

  // Image Preview
  openPreview(imageUrl: string, event: Event) {
    event.stopPropagation();
    this.previewImageUrl.set(imageUrl);
    this.isPreviewModalOpen.set(true);
  }

  closePreview() {
    this.isPreviewModalOpen.set(false);
    this.previewImageUrl.set(null);
  }

  // CRUD
  openCreateModal() {
    this.isEditMode.set(false);
    this.currentBannerId = null;
    this.bannerForm.reset({
      image_url: '',
      link: '',
      display_order: this.banners().length + 1, // Default to next order
      is_active: true,
      platform: 'desktop',
    });
    this.isModalOpen.set(true);
  }

  openEditModal(banner: Banner) {
    this.isEditMode.set(true);
    this.currentBannerId = banner.id;
    this.bannerForm.patchValue({
      image_url: banner.image_url,
      link: banner.link,
      display_order: banner.display_order,
      is_active: banner.is_active,
      start_date: banner.start_date,
      end_date: banner.end_date,
      platform: banner.platform || 'desktop',
    });
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  onSubmit() {
    if (this.bannerForm.invalid) return;

    const formValue = this.bannerForm.value;

    if (this.isEditMode() && this.currentBannerId) {
      // Update
      this.bannerService
        .updateBanner(this.currentBannerId, formValue)
        .subscribe(() => {
          this.loadBanners();
          this.closeModal();
        });
    } else {
      // Create
      this.bannerService.createBanner(formValue).subscribe(() => {
        this.loadBanners();
        this.closeModal();
      });
    }
  }

  deleteBanner(banner: Banner) {
    this.bannerToDelete.set(banner);
    this.isDeleteModalOpen.set(true);
  }

  confirmDelete() {
    const banner = this.bannerToDelete();
    if (banner) {
      this.bannerService.deleteBanner(banner.id).subscribe(() => {
        this.loadBanners();
        this.closeDeleteModal();
      });
    }
  }

  closeDeleteModal() {
    this.isDeleteModalOpen.set(false);
    this.bannerToDelete.set(null);
  }
}
