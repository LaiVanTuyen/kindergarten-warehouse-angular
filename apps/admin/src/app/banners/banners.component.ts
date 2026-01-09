import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

// Custom Validator for Date Range
export const dateRangeValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const start = control.get('startDate')?.value;
  const end = control.get('endDate')?.value;

  if (start && end && new Date(start) > new Date(end)) {
    return { dateRangeInvalid: true };
  }
  return null;
};

// URL Pattern
const URL_PATTERN = /^(https?:\/\/[\w\d.-]+(\.[\w]+)+.*)|(\/[\w\d-./]*)$/;

import {
  DragDropModule,
  CdkDragDrop,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { Banner } from '@kindergarten-warehouse/data-access';
import {
  BannerService,
  ToastService,
} from '@kindergarten-warehouse/data-access';
import { BreadcrumbComponent } from '../shared/components/breadcrumb/breadcrumb.component';
import { EmptyStateComponent } from '../shared/components/empty-state/empty-state.component';

import { SafeHtmlPipe } from '../shared/pipes/safe-html.pipe';

@Component({
  selector: 'app-banners',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DragDropModule,
    BreadcrumbComponent,
    EmptyStateComponent, // Add EmptyStateComponent
    SafeHtmlPipe,
  ],
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
  host: {
    class: 'block h-full',
  },
})
export class BannersComponent implements OnInit {
  private toastService = inject(ToastService);
  readonly Math = Math;
  banners = signal<Banner[]>([]);

  // Pagination
  pageIndex = 0;
  pageSize = 100;
  totalElements = signal(0);
  totalPages = signal(0);

  isModalOpen = signal(false);
  isEditMode = signal(false);

  // Image Preview Modal
  isPreviewModalOpen = signal(false);
  previewImageUrl = signal<string | null>(null);

  currentBannerId: number | null = null;
  selectedFile: File | null = null;
  bannerForm: FormGroup;

  // Delete Modal Signals
  isDeleteModalOpen = signal(false);
  bannerToDelete = signal<Banner | null>(null);

  // Gradient Themes
  readonly gradientThemes = [
    {
      label: 'Primary (Blue/Cyan)',
      from: 'from-blue-50',
      to: 'to-cyan-50',
      value: 'primary',
    },
    {
      label: 'Creative (Purple/Amber)',
      from: 'from-purple-50',
      to: 'to-amber-50',
      value: 'creative',
    },
    {
      label: 'Nature (Green/Emerald)',
      from: 'from-green-50',
      to: 'to-emerald-50',
      value: 'nature',
    },
    {
      label: 'Warm (Orange/Rose)',
      value: 'warm',
      from: 'from-orange-50',
      to: 'to-rose-50',
    },
  ];

  textColors = [
    {
      label: 'Blue',
      class: 'text-blue-600',
      bgClass: 'bg-blue-100 text-blue-700',
      dotClass: 'bg-blue-600',
    },
    {
      label: 'Green',
      class: 'text-green-600',
      bgClass: 'bg-green-100 text-green-700',
      dotClass: 'bg-green-600',
    },
    {
      label: 'Red',
      class: 'text-red-600',
      bgClass: 'bg-red-100 text-red-700',
      dotClass: 'bg-red-600',
    },
    {
      label: 'Orange',
      class: 'text-orange-600',
      bgClass: 'bg-orange-100 text-orange-700',
      dotClass: 'bg-orange-600',
    },
    {
      label: 'Purple',
      class: 'text-purple-600',
      bgClass: 'bg-purple-100 text-purple-700',
      dotClass: 'bg-purple-600',
    },
    {
      label: 'Pink',
      class: 'text-pink-600',
      bgClass: 'bg-pink-100 text-pink-700',
      dotClass: 'bg-pink-600',
    },
  ];

  constructor(private fb: FormBuilder, private bannerService: BannerService) {
    this.bannerForm = this.fb.group(
      {
        title: [''],
        subtitle: [''],
        theme: ['primary'],
        bgFrom: ['from-primary-50'],
        bgTo: ['to-secondary-50'],
        imageUrl: ['', [Validators.required]],
        link: ['', [Validators.pattern(URL_PATTERN)]],
        displayOrder: [0, [Validators.required, Validators.min(0)]],
        isActive: [true],
        startDate: [''],
        endDate: [''],
        platform: ['WEB'],
      },
      { validators: dateRangeValidator }
    );
  }

  ngOnInit() {
    this.loadBanners();
  }

  loadBanners() {
    this.bannerService.getAllBanners(this.pageIndex, this.pageSize).subscribe({
      next: (response) => {
        if (response.result) {
          const page = response.result;
          let content = page.content || [];
          // Service handles normalization
          this.banners.set(content);
          this.totalElements.set(page.totalElements);
          this.totalPages.set(page.totalPages);
        }
      },
      error: (err) => console.error('Failed to load banners', err),
    });
  }

  changePage(newPage: number) {
    if (newPage >= 0 && newPage < this.totalPages()) {
      this.pageIndex = newPage;
      this.loadBanners();
    }
  }

  // Drag & Drop
  drop(event: CdkDragDrop<Banner[]>) {
    const currentBanners = [...this.banners()];
    moveItemInArray(currentBanners, event.previousIndex, event.currentIndex);

    // Update display_order based on new index
    const updatedBanners = currentBanners.map((banner, index) => ({
      ...banner,
      displayOrder: index + 1,
    }));

    this.banners.set(updatedBanners);

    // Call API to save sorting order
    this.bannerService.updateReorderedBanners(updatedBanners).subscribe();
  }

  // Status & Expiration
  isExpired(banner: Banner): boolean {
    if (!banner.endDate) return false;
    const now = new Date();
    const end = new Date(banner.endDate);
    return now > end;
  }

  toggleStatus(banner: Banner, event: Event) {
    event.stopPropagation();
    const newStatus = !banner.isActive;

    // Optimistic update
    this.banners.update((list) =>
      list.map((b) => (b.id === banner.id ? { ...b, isActive: newStatus } : b))
    );

    const formData = new FormData();
    formData.append('isActive', String(newStatus));
    formData.append('is_active', String(newStatus)); // Backend compatibility
    // Append other required fields if strictly required by backend,
    // but assuming backend can handle partial update via this endpoint or logic.
    // If updateBanner points to PUT, backend usually needs all data.
    // However, recreating the full banner FormData here is complex (image file missing).
    // Let's assume we send at least the critical fields or the ID implies the rest for a smart backend,
    // OR we revert to using a specific PATCH endpoint if available.
    // Given the plan says "Update (Edit): PUT... FormData", this is tricky for a toggle.
    // Ideally we should usage PATCH /status.
    // IF PUT is strict, this might fail without other fields.
    // But let's try sending what we have (non-file fields).
    formData.append('title', banner.title);
    formData.append('bgFrom', banner.bgFrom);
    formData.append('bgTo', banner.bgTo);
    formData.append('platform', banner.platform);
    formData.append('displayOrder', String(banner.displayOrder));
    if (banner.subtitle) formData.append('subtitle', banner.subtitle);
    if (banner.link) formData.append('link', banner.link);
    if (banner.startDate) formData.append('startDate', banner.startDate);
    if (banner.endDate) formData.append('endDate', banner.endDate);
    // image is optional in update

    this.bannerService.updateBanner(banner.id, formData).subscribe({
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
  getSelectedBanner(): Banner | undefined {
    return this.banners().find((b) => b.id === this.currentBannerId);
  }

  openCreateModal() {
    this.isEditMode.set(false);
    this.currentBannerId = null;
    this.bannerForm.reset({
      title: '',
      subtitle: '',
      theme: 'primary',
      bgFrom: 'from-blue-50',
      bgTo: 'to-cyan-50',
      imageUrl: '',
      link: '',
      displayOrder: this.banners().length + 1, // Default to next order
      isActive: true,
      platform: 'desktop',
    });
    this.isModalOpen.set(true);
  }

  openEditModal(banner: Banner) {
    this.isEditMode.set(true);
    this.currentBannerId = banner.id;

    // Find matching theme
    const matchingTheme = this.gradientThemes.find(
      (t) => t.from === banner.bgFrom && t.to === banner.bgTo
    );

    this.bannerForm.patchValue({
      title: banner.title,
      subtitle: banner.subtitle,
      theme: matchingTheme ? matchingTheme.value : '',
      bgFrom: banner.bgFrom,
      bgTo: banner.bgTo,
      imageUrl: banner.imageUrl,
      link: banner.link,
      displayOrder: banner.displayOrder,
      isActive: banner.isActive,
      startDate: banner.startDate,
      endDate: banner.endDate,
      platform: banner.platform || 'desktop',
    });
    this.bannerForm.markAsPristine(); // Ensure form starts as pristine
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
      displayOrder: index + 1,
    }));
  }

  onSubmit() {
    if (this.bannerForm.invalid) return;

    const formValue = this.bannerForm.value;
    const formData = new FormData();

    formData.append('title', formValue.title);
    if (formValue.subtitle) formData.append('subtitle', formValue.subtitle);
    formData.append('bgFrom', formValue.bgFrom);
    formData.append('bgTo', formValue.bgTo);
    formData.append('platform', formValue.platform);
    if (formValue.link) formData.append('link', formValue.link);
    formData.append('isActive', String(formValue.isActive));
    formData.append('is_active', String(formValue.isActive)); // Backend compatibility
    formData.append('displayOrder', String(formValue.displayOrder));
    if (formValue.startDate) formData.append('startDate', formValue.startDate);
    if (formValue.endDate) formData.append('endDate', formValue.endDate);

    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    const isEdit = this.isEditMode();
    const id = this.currentBannerId;

    if (isEdit && id) {
      this.bannerService.updateBanner(id, formData).subscribe({
        next: () => {
          this.toastService.show('Banner updated successfully', 'success');
          this.loadBanners();
          this.closeModal();
        },
        error: (err) => {
          console.error(err);
          const msg = err.error?.message || 'Update failed';
          this.toastService.show(msg, 'error');
        },
      });
    } else {
      this.bannerService.createBanner(formData).subscribe({
        next: () => {
          this.toastService.show('Banner created successfully', 'success');
          this.loadBanners();
          this.closeModal();
        },
        error: (err) => {
          console.error(err);
          const msg = err.error?.message || 'Create failed';
          this.toastService.show(msg, 'error');
        },
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
      this.bannerService.deleteBanner(banner.id).subscribe({
        next: () => {
          this.toastService.show('Banner deleted successfully', 'success');
          this.loadBanners();
          this.closeDeleteModal();
        },
        error: (err) => this.toastService.show('Delete failed', 'error'),
      });
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        this.bannerForm.patchValue({
          imageUrl: reader.result as string,
        });
        this.bannerForm.get('imageUrl')?.markAsDirty();
      };

      reader.readAsDataURL(file);
    }
  }

  onThemeChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const selectedTheme = this.gradientThemes.find(
      (t) => t.value === select.value
    );

    if (selectedTheme) {
      this.bannerForm.patchValue({
        bgFrom: selectedTheme.from,
        bgTo: selectedTheme.to,
      });

      // Mark as dirty so Angular knows value changed (optional but good practice)
      this.bannerForm.get('bgFrom')?.markAsDirty();
      this.bannerForm.get('bgTo')?.markAsDirty();
    }
  }

  // Text Helper: Insert Color Tag
  insertColorTag(
    controlName: string,
    colorClass: string,
    inputElement?: HTMLInputElement
  ) {
    const control = this.bannerForm.get(controlName);
    if (!control) return;

    const currentValue = control.value || '';
    let newValue = '';

    if (
      inputElement &&
      inputElement.selectionStart !== inputElement.selectionEnd
    ) {
      // Wrap Selected Text
      const start = inputElement.selectionStart || 0;
      const end = inputElement.selectionEnd || 0;

      // Get selected text and STRIP existing spans to prevent nesting
      let selectedText = currentValue.substring(start, end);
      selectedText = selectedText.replace(/<\/?span[^>]*>/g, '');

      newValue =
        currentValue.substring(0, start) +
        `<span class="${colorClass}">${selectedText}</span>` +
        currentValue.substring(end);
    } else {
      // Append at the end (fallback)
      newValue = currentValue + ` <span class="${colorClass}">TEXT</span> `;
    }

    control.setValue(newValue);
    control.markAsDirty();
  }

  // Text Helper: Insert Custom Hex Color (Inline Style)
  insertCustomColor(
    controlName: string,
    colorHex: string,
    inputElement?: HTMLInputElement
  ) {
    const control = this.bannerForm.get(controlName);
    if (!control) return;

    const currentValue = control.value || '';
    let newValue = '';

    if (
      inputElement &&
      inputElement.selectionStart !== inputElement.selectionEnd
    ) {
      // Wrap Selected Text
      const start = inputElement.selectionStart || 0;
      const end = inputElement.selectionEnd || 0;

      // Get selected text and STRIP existing spans to prevent nesting
      let selectedText = currentValue.substring(start, end);
      selectedText = selectedText.replace(/<\/?span[^>]*>/g, '');

      newValue =
        currentValue.substring(0, start) +
        `<span style="color: ${colorHex}">${selectedText}</span>` +
        currentValue.substring(end);
    } else {
      // Append at end
      newValue =
        currentValue + ` <span style="color: ${colorHex}">TEXT</span> `;
    }

    control.setValue(newValue);
    control.markAsDirty();
  }

  closeDeleteModal() {
    this.isDeleteModalOpen.set(false);
    this.bannerToDelete.set(null);
  }
}
