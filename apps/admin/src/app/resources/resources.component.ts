import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginationComponent } from '../shared/components/pagination/pagination.component';
import { SkeletonTableComponent } from '../shared/components/skeleton-table/skeleton-table.component';
import { BreadcrumbComponent } from '../shared/components/breadcrumb/breadcrumb.component';
import { EmptyStateComponent } from '../shared/components/empty-state/empty-state.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormControl,
} from '@angular/forms';
import { debounceTime, distinctUntilChanged, delay } from 'rxjs/operators';
import {
  ResourceService,
  CategoryService,
  Resource,
  Category,
  Topic,
  AuthService,
} from '@kindergarten-warehouse/data-access';
import { ToastService } from '../shared/toast/toast.service';

@Component({
  selector: 'app-admin-resources',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PaginationComponent,
    SkeletonTableComponent,
    BreadcrumbComponent,
    EmptyStateComponent,
  ],
  templateUrl: './resources.component.html',
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
    `,
  ],
})
export class ResourcesComponent {
  private fb = inject(FormBuilder);
  resourceService = inject(ResourceService);
  categoryService = inject(CategoryService);
  toastService = inject(ToastService);
  authService = inject(AuthService);
  sanitizer = inject(DomSanitizer);

  // Data Signals
  resources = signal<Resource[]>([]);
  totalResources = signal(0);
  selectedIds = signal<Set<string>>(new Set());

  // Bulk Actions
  toggleSelection(id: string) {
    this.selectedIds.update((set) => {
      const newSet = new Set(set);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }

  toggleAll(checked: boolean) {
    if (checked) {
      this.selectedIds.set(new Set(this.resources().map((r) => r.id)));
    } else {
      this.selectedIds.set(new Set());
    }
  }

  // UI State
  activeTab = signal<'pending' | 'list'>('pending');
  isEditMode = signal(false);
  currentResourceId: string | null = null;
  Math = Math;

  // Preview State
  previewResource = signal<Resource | null>(null);
  isLoading = signal(false);
  isTableLoading = signal(false);
  previewUrl: SafeResourceUrl | null = null;
  previewType: 'VIDEO' | 'AUDIO' | 'IMAGE' | 'DOC' | 'UNSUPPORTED' =
    'UNSUPPORTED';

  // GENERIC CONFIRMATION MODAL STATE
  isConfirmModalOpen = signal(false);
  confirmConfig = signal<{
    title: string;
    message: string;
    action: 'APPROVE' | 'REJECT' | 'DELETE' | 'BULK_APPROVE' | 'BULK_DELETE';
    data?: any;
  } | null>(null);

  openConfirmModal(
    title: string,
    message: string,
    action: 'APPROVE' | 'REJECT' | 'DELETE' | 'BULK_APPROVE' | 'BULK_DELETE',
    data: any = null
  ) {
    this.confirmConfig.set({ title, message, action, data });
    this.isConfirmModalOpen.set(true);
  }

  closeConfirmModal() {
    this.isConfirmModalOpen.set(false);
    this.confirmConfig.set(null);
  }

  onConfirmAction() {
    const config = this.confirmConfig();
    if (!config) return;

    switch (config.action) {
      case 'APPROVE':
        this.executeApprove(config.data);
        break;
      case 'REJECT':
        this.executeReject(config.data);
        break;
      case 'DELETE':
        this.executeDeleteSingle(config.data);
        break;
      case 'BULK_APPROVE':
        this.executeBulkApprove();
        break;
      case 'BULK_DELETE':
        this.executeBulkDelete();
        break;
    }
    this.closeConfirmModal();
  }

  // Filtering & Pagination
  pageSize = signal(10);
  currentPage = signal(1);
  searchControl = new FormControl('');
  typeFilter = new FormControl('');
  categoryFilter = new FormControl('');
  topicFilter = new FormControl('');

  // Forms
  uploadForm: FormGroup;
  categories = signal<Category[]>([]);
  topics = signal<Topic[]>([]);
  filteredTopics = signal<Topic[]>([]);

  constructor() {
    this.uploadForm = this.fb.group({
      title: ['', Validators.required],
      categoryId: ['', Validators.required],
      topicId: ['', Validators.required],
      type: ['VIDEO', Validators.required],
      url: [''],
      description: [''],
    });

    this.loadData();
    this.loadCategoriesAndTopics();

    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.currentPage.set(1);
        this.loadData();
      });

    this.typeFilter.valueChanges.subscribe(() => {
      this.currentPage.set(1);
      this.loadData();
    });

    this.categoryFilter.valueChanges.subscribe((catId) => {
      this.topicFilter.setValue('');
      if (catId) {
        this.filteredTopics.set(
          this.topics().filter((t) => t.categoryId === catId)
        );
      } else {
        this.filteredTopics.set(this.topics());
      }
    });

    this.topicFilter.valueChanges.subscribe(() => {
      this.currentPage.set(1);
      this.loadData();
    });

    this.uploadForm.get('categoryId')?.valueChanges.subscribe((catId) => {
      this.filteredTopics.set(
        this.topics().filter((t) => t.categoryId === catId)
      );
      this.uploadForm.get('topicId')?.reset();
    });

    // Move Modal Category Change
    this.moveTargetCategoryId.valueChanges.subscribe((catId) => {
      this.moveTargetTopicId.reset();
      if (catId) {
        this.filteredTopics.set(
          this.topics().filter((t) => t.categoryId === catId)
        );
      } else {
        this.filteredTopics.set(this.topics());
      }
    });
  }

  setActiveTab(tab: 'pending' | 'list') {
    this.activeTab.set(tab);
    this.currentPage.set(1);
    this.loadData();
  }

  loadData() {
    let status: 'pending' | 'approved' | 'rejected' | undefined = undefined;
    if (this.activeTab() === 'pending') {
      status = 'pending';
    }

    this.isTableLoading.set(true);

    this.resourceService
      .getResources(this.currentPage(), this.pageSize(), {
        search: this.searchControl.value || undefined,
        status: status,
        type: (this.typeFilter.value as any) || undefined,
        topicId: (this.topicFilter.value as any) || undefined,
      })
      .pipe(delay(500))
      .subscribe((res) => {
        this.resources.set(res.data);
        this.totalResources.set(res.total);
        this.selectedIds.set(new Set()); // Clear selection on load
        this.isTableLoading.set(false);
      });
  }

  loadCategoriesAndTopics() {
    this.categoryService
      .getCategories(1, 100)
      .subscribe((res) => this.categories.set(res.data));
    this.categoryService.getTopics(undefined, 1, 100).subscribe((res) => {
      this.topics.set(res.data);
      this.filteredTopics.set(res.data);
    });
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadData();
  }

  resetFilters() {
    this.searchControl.setValue('', { emitEvent: false });
    this.categoryFilter.setValue('', { emitEvent: false });
    this.topicFilter.setValue('', { emitEvent: false });
    this.typeFilter.setValue('', { emitEvent: false });

    this.filteredTopics.set(this.topics());
    this.currentPage.set(1);
    this.loadData();
  }

  // Upload Modal State
  isUploadModalOpen = signal(false);

  openUploadModal() {
    this.isUploadModalOpen.set(true);
    this.isEditMode.set(false);
    this.currentResourceId = null;
    this.uploadForm.reset({ type: 'VIDEO' });
  }

  closeUploadModal() {
    this.isUploadModalOpen.set(false);
    this.isEditMode.set(false);
    this.currentResourceId = null;
  }

  approveResource(id: string) {
    this.openConfirmModal(
      'Approve Resource?',
      'Are you sure you want to APPROVE this resource? It will become visible to all users.',
      'APPROVE',
      id
    );
  }

  executeApprove(id: string) {
    this.resourceService.approveResource(id).subscribe(() => {
      this.toastService.show('Resource approved successfully', 'success');
      this.loadData();
    });
  }

  rejectResource(id: string) {
    this.openConfirmModal(
      'Reject Resource?',
      'Are you sure you want to REJECT this resource? It will be marked as rejected.',
      'REJECT',
      id
    );
  }

  executeReject(id: string) {
    this.resourceService.rejectResource(id).subscribe(() => {
      this.toastService.show('Resource rejected', 'info');
      this.loadData();
    });
  }

  // Refactoring usage:
  confirmDelete(id: string) {
    this.openConfirmModal(
      'Delete Resource?',
      'Are you sure you want to delete this resource? This action cannot be undone.',
      'DELETE',
      id
    );
  }

  executeDeleteSingle(id: string) {
    this.resourceService.deleteResource(id).subscribe(() => {
      if (this.currentResourceId === id) {
        this.cancelEdit();
      }
      this.toastService.show('Resource deleted successfully', 'success');
      this.loadData();
    });
  }

  // BULK ACTIONS
  approveSelected() {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    this.openConfirmModal(
      'Approve Selected?',
      `Are you sure you want to approve ${ids.length} selected resources?`,
      'BULK_APPROVE'
    );
  }

  executeBulkApprove() {
    const ids = Array.from(this.selectedIds());
    let count = 0;
    ids.forEach((id) => {
      this.resourceService.approveResource(id).subscribe(() => {
        count++;
        if (count === ids.length) {
          this.toastService.show('Selected resources approved', 'success');
          this.selectedIds.set(new Set());
          this.loadData();
        }
      });
    });
  }

  deleteSelected() {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    this.openConfirmModal(
      'Delete Selected?',
      `Are you sure you want to delete ${ids.length} selected resources? This cannot be undone.`,
      'BULK_DELETE'
    );
  }

  executeBulkDelete() {
    const ids = Array.from(this.selectedIds());
    let count = 0;
    ids.forEach((id) => {
      this.resourceService.deleteResource(id).subscribe(() => {
        count++;
        if (count === ids.length) {
          this.toastService.show('Selected resources deleted', 'success');
          this.selectedIds.set(new Set());
          this.loadData();
        }
      });
    });
  }

  // BULK MOVE LOGIC
  isMoveModalOpen = signal(false);
  moveTargetTopicId = new FormControl('', Validators.required);
  moveTargetCategoryId = new FormControl('');

  openMoveModal() {
    this.moveTargetCategoryId.reset();
    this.moveTargetTopicId.reset();
    this.isMoveModalOpen.set(true);
  }

  closeMoveModal() {
    this.isMoveModalOpen.set(false);
    this.moveTargetCategoryId.reset();
    this.moveTargetTopicId.reset();
  }

  executeBulkMove() {
    const ids = Array.from(this.selectedIds());
    const topicId = this.moveTargetTopicId.value;

    if (ids.length === 0 || !topicId) return;

    this.resourceService.moveResources(ids, topicId).subscribe(() => {
      this.toastService.show(
        `Moved ${ids.length} resources to new topic`,
        'success'
      );
      this.selectedIds.set(new Set());
      this.closeMoveModal();
      this.loadData();
    });
  }

  editResource(resource: Resource) {
    this.isEditMode.set(true);
    this.currentResourceId = resource.id;
    this.uploadForm.patchValue({
      title: resource.title,
      categoryId: resource.topicId
        ? this.getCategoryIdFromTopic(resource.topicId)
        : '',
      topicId: resource.topicId,
      type: resource.type,
      description: resource.description,
      url: resource.url,
    });

    const catId = this.getCategoryIdFromTopic(resource.topicId);
    if (catId) {
      this.filteredTopics.set(
        this.topics().filter((t) => t.categoryId === catId)
      );
    }
    this.isUploadModalOpen.set(true);
  }

  cancelEdit() {
    this.isEditMode.set(false);
    this.currentResourceId = null;
    this.uploadForm.reset({ type: 'VIDEO' });
  }

  onFileSelected(event: Event) {
    if (this.isEditMode()) return;

    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (!this.uploadForm.get('title')?.value) {
        this.uploadForm.patchValue({ title: file.name });
      }
      this.toastService.show(`File "${file.name}" selected!`, 'info');
    }
  }

  submitUpload() {
    if (this.uploadForm.invalid) return;

    const val = this.uploadForm.value;
    const resourceData: Partial<Resource> = {
      title: val.title,
      type: val.type,
      topicId: val.topicId,
      description: val.description,
      url: val.url || 'https://example.com',
      thumbnail: val.type === 'VIDEO' ? '🎬' : '📄',
    };

    if (this.isEditMode() && this.currentResourceId) {
      this.resourceService
        .updateResource(this.currentResourceId, resourceData)
        .subscribe(() => {
          this.toastService.show('Resource updated successfully', 'success');
          this.loadData();
          this.closeUploadModal();
        });
    } else {
      const currentUser = this.authService.currentUserValue;
      const isAdmin = currentUser?.role === 'ADMIN';
      const status = isAdmin ? 'approved' : 'pending';

      this.resourceService
        .createResource({
          ...resourceData,
          status: status,
        })
        .subscribe(() => {
          this.uploadForm.reset({ type: 'VIDEO' });
          const msg = isAdmin
            ? 'Resource uploaded and automatically approved!'
            : 'Resource uploaded and pending approval.';

          this.toastService.show(msg, 'success');
          this.loadData();
          this.closeUploadModal();
        });
    }
  }

  // PREVIEW LOGIC
  openPreview(resource: Resource) {
    console.log('Clicked Preview:', resource); // Debugging
    this.previewResource.set(resource);
    this.isLoading.set(true);
    this.previewType = this.getPreviewType(resource.url || '');
    this.previewUrl = this.getSafeUrl(resource.url || '', this.previewType);

    // If unsupported, stop loading spinner immediately
    if (this.previewType === 'UNSUPPORTED') {
      this.isLoading.set(false);
    }
  }

  closePreview() {
    this.previewResource.set(null);
    this.previewUrl = null;
    this.isLoading.set(false);
  }

  onLoad() {
    this.isLoading.set(false);
  }

  getPreviewType(url: string) {
    const ext = url.split('.').pop()?.toLowerCase();
    if (['mp4', 'webm', 'ogg'].includes(ext || '')) return 'VIDEO';
    if (['mp3', 'wav', 'ogg'].includes(ext || '')) return 'AUDIO';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || ''))
      return 'IMAGE';
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx'].includes(ext || '')) return 'DOC';
    return 'UNSUPPORTED';
  }

  getSafeUrl(url: string, type: string): SafeResourceUrl {
    if (type === 'DOC') {
      // Use Google Docs Viewer
      // https://docs.google.com/viewer?url={url}&embedded=true
      const googleUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
        url
      )}&embedded=true`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(googleUrl);
    }
    // For Video/Audio/Image, trust the known public URL or sanitise properly
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  // Helpers
  getCategoryName(topicId?: string): string {
    if (!topicId) return 'Unknown';
    const topic = this.topics().find((t) => t.id === topicId);
    if (!topic) return 'Unknown';
    const cat = this.categories().find((c) => c.id === topic.categoryId);
    return cat ? cat.name : 'Unknown';
  }

  getCategoryIdFromTopic(topicId?: string): string {
    if (!topicId) return '';
    const topic = this.topics().find((t) => t.id === topicId);
    return topic ? topic.categoryId : '';
  }

  getTopicTitle(topicId?: string): string {
    if (!topicId) return 'General';
    const topic = this.topics().find((t) => t.id === topicId);
    return topic ? topic.title : 'General';
  }
}
