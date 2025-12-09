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

    // Call API to save sorting order
    this.bannerService.updateReorderedBanners(updatedBanners).subscribe();
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

  // Manual Reordering Logic
  handleManualReorder(currentId: number, newOrder: number): Banner[] {
    const currentBanners = [...this.banners()];
    const currentIndex = currentBanners.findIndex((b) => b.id === currentId);

    if (currentIndex === -1) return currentBanners;

    // Remove from old position
    const [movedBanner] = currentBanners.splice(currentIndex, 1);

    // Insert at new position (1-based index to 0-based, clamped)
    // Clamp between 0 and length (since we removed one, length is N-1, so max index is N-1, creating N items)
    const targetIndex = Math.max(
      0,
      Math.min(newOrder - 1, currentBanners.length)
    );
    currentBanners.splice(targetIndex, 0, movedBanner);

    // Renumber strictly 1..N
    return currentBanners.map((b, index) => ({
      ...b,
      display_order: index + 1,
    }));
  }

  onSubmit() {
    if (this.bannerForm.invalid) return;

    const formValue = this.bannerForm.value;
    const isEdit = this.isEditMode();
    const id = this.currentBannerId;

    if (isEdit && id) {
      // Update
      const oldBanner = this.banners().find((b) => b.id === id);
      const newOrder = formValue.display_order;

      if (oldBanner && oldBanner.display_order !== newOrder) {
        // Order changed: Perform Smart Reorder
        let reorderedList = this.handleManualReorder(id, newOrder);

        // Update the specific banner's details in the new list
        reorderedList = reorderedList.map((b) =>
          b.id === id ? { ...b, ...formValue, display_order: b.display_order } : b
        );

        // Sync with Backend (Mock Batch Update)
        this.bannerService.updateReorderedBanners(reorderedList).subscribe(() => {
          this.loadBanners();
          this.closeModal();
        });
      } else {
        // Simple Update (No order change)
        this.bannerService.updateBanner(id, formValue).subscribe(() => {
          this.loadBanners();
          this.closeModal();
        });
      }
    } else {
      // Create
      this.bannerService.createBanner(formValue).subscribe((newBanner) => {
        // After creation, we need to ensure the order is respected (shifting others if needed)
        this.loadBanners(); // Reload to get the full list including the new one
        
        // Timeout to allow signal update or straightforward sequencing
        setTimeout(() => {
           // We perform a reorder to ensure the new banner (which might cause a collision)
           // is inserted correctly and others are shifted.
           const desiredOrder = formValue.display_order;
           const listWithNew = this.banners();
           
           // If the simplistic create just appended or collided, this reorder fixes it
           const reorderedList = this.handleManualReorder(newBanner.id, desiredOrder);
           
           this.bannerService.updateReorderedBanners(reorderedList).subscribe(() => {
             this.loadBanners();
             this.closeModal();
           });
        }, 100);
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

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        this.bannerForm.patchValue({
          image_url: reader.result as string,
        });
        this.bannerForm.get('image_url')?.markAsDirty();
      };

      reader.readAsDataURL(file);
    }
  }

  closeDeleteModal() {
    this.isDeleteModalOpen.set(false);
    this.bannerToDelete.set(null);
  }
}
