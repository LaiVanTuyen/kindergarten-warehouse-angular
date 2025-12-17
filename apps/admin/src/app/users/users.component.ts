import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginationComponent } from '../shared/components/pagination/pagination.component';
import { SkeletonTableComponent } from '../shared/components/skeleton-table/skeleton-table.component';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormControl,
} from '@angular/forms';
import { BreadcrumbComponent } from '../shared/components/breadcrumb/breadcrumb.component';
import { EmptyStateComponent } from '../shared/components/empty-state/empty-state.component';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  switchMap,
  tap,
} from 'rxjs/operators';
import { combineLatest, timer } from 'rxjs';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ToastService } from '../shared/toast/toast.service';

// Mock Data for Demonstration
const MOCK_USERS: any[] = [
  {
    id: '1',
    fullName: 'Emily Davis',
    email: 'emily.davis@kindergarten.com',
    username: 'admin_emily',
    role: 'ADMIN',
    isActive: false,
    isDeleted: true,
    createdAt: '2023-01-15',
    avatarUrl: 'https://i.pravatar.cc/150?u=1',
  },
  {
    id: '2',
    fullName: 'Michael Wilson',
    email: 'michael.w@kindergarten.com',
    username: 'teacher_mike',
    role: 'TEACHER',
    isActive: true,
    isDeleted: false,
    createdAt: '2023-03-22',
    avatarUrl: 'https://i.pravatar.cc/150?u=2',
  },
  {
    id: '3',
    fullName: 'Sarah Johnson',
    email: 'sarah.j@gmail.com',
    username: 'parent_sarah',
    role: 'USER',
    isActive: false,
    isDeleted: false,
    createdAt: '2023-06-10',
    avatarUrl: 'https://i.pravatar.cc/150?u=3',
  },
  {
    id: '4',
    fullName: 'Jessica Brown',
    email: 'jess.brown@kindergarten.com',
    username: 'teacher_jess',
    role: 'TEACHER',
    isActive: true,
    isDeleted: false,
    createdAt: '2023-07-05',
    avatarUrl: 'https://i.pravatar.cc/150?u=4',
  },
  {
    id: '5',
    fullName: 'David Lee',
    email: 'david.lee@yahoo.com',
    username: 'parent_david',
    role: 'USER',
    isActive: true,
    isDeleted: false,
    createdAt: '2023-08-12',
    avatarUrl: 'https://i.pravatar.cc/150?u=5',
  },
];

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PaginationComponent,
    SkeletonTableComponent,
    BreadcrumbComponent,
    EmptyStateComponent,
  ],
  templateUrl: './users.component.html',
  styles: [],
})
export class UsersComponent {
  private fb = inject(FormBuilder);
  toastService = inject(ToastService);

  // -- State Signals --
  allUsers = signal<any[]>(MOCK_USERS);
  isLoading = signal(false);

  // Selection for bulk actions
  selectedIds = signal<Set<string>>(new Set());

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);

  // Filter Signals (Driven by FormControls)
  searchQuery = signal('');
  roleFilter = signal<'ALL' | 'ADMIN' | 'TEACHER' | 'USER'>('ALL');
  statusFilter = signal<'ALL' | 'ACTIVE' | 'BLOCKED' | 'DELETED'>('ALL');

  // Form Controls for UI
  searchControl = new FormControl('');
  roleControl = new FormControl('ALL');
  statusControl = new FormControl('ALL');

  // Sorting
  sortColumn = signal<'fullName' | 'createdAt'>('createdAt');
  sortDirection = signal<'asc' | 'desc'>('desc');

  // Computed Users (Filtered & Sorted) with Async Simulation
  private filterState$ = combineLatest([
    toObservable(this.allUsers),
    toObservable(this.searchQuery),
    toObservable(this.roleFilter),
    toObservable(this.statusFilter),
    toObservable(this.sortColumn),
    toObservable(this.sortDirection),
  ]).pipe(
    tap(() => this.isLoading.set(true)),
    switchMap(([users, queryRaw, role, status, col, dir]) => {
      return timer(500).pipe(
        map(() => {
          let res = users;

          // 1. Filter by Search
          const query = queryRaw.toLowerCase();
          if (query) {
            res = res.filter(
              (u) =>
                u.fullName.toLowerCase().includes(query) ||
                u.email.toLowerCase().includes(query)
            );
          }

          // 2. Filter by Role
          if (role !== 'ALL') {
            res = res.filter((u) => u.role === role);
          }

          // 3. Filter by Status (and Soft Delete)
          if (status === 'DELETED') {
            res = res.filter((u) => u.isDeleted === true);
          } else {
            res = res.filter((u) => u.isDeleted !== true);
            if (status !== 'ALL') {
              const isActive = status === 'ACTIVE';
              res = res.filter((u) => u.isActive === isActive);
            }
          }

          // 4. Sort
          res = [...res].sort((a, b) => {
            const valA = a[col];
            const valB = b[col];
            if (valA < valB) return dir === 'asc' ? -1 : 1;
            if (valA > valB) return dir === 'asc' ? 1 : -1;
            return 0;
          });

          return res;
        }),
        tap(() => this.isLoading.set(false))
      );
    })
  );

  filteredUsers = toSignal(this.filterState$, { initialValue: [] });

  // Derived Statistics
  totalUsersCount = computed(() => this.filteredUsers().length);
  totalPages = computed(() =>
    Math.ceil(this.totalUsersCount() / this.pageSize())
  );

  paginatedUsers = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredUsers().slice(start, end);
  });

  // Helper for UI
  Math = Math;

  // -- Modal State --
  isUserModalOpen = signal(false);
  isEditMode = signal(false);
  userForm: FormGroup;
  showPassword = signal(false);
  currentUser = signal<any | null>(null);

  constructor() {
    this.userForm = this.fb.group({
      id: [null],
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      username: ['', Validators.required],
      password: [''], // Optional in edit mode
      role: ['USER', Validators.required],
      isActive: [true],
      isDeleted: [false],
    });

    // -- Filter Subscriptions --
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((val) => {
        this.searchQuery.set(val || '');
        this.currentPage.set(1);
      });

    this.roleControl.valueChanges.subscribe((val) => {
      this.roleFilter.set((val as any) || 'ALL');
      this.currentPage.set(1);
    });

    this.statusControl.valueChanges.subscribe((val) => {
      this.statusFilter.set((val as any) || 'ALL');
      this.currentPage.set(1);
    });
  }

  resetFilters() {
    this.searchControl.setValue('');
    this.roleControl.setValue('ALL');
    this.statusControl.setValue('ALL');
  }

  toggleSort(column: 'fullName' | 'createdAt') {
    if (this.sortColumn() === column) {
      this.sortDirection.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('desc');
    }
  }

  // -- Bulk Selection --
  toggleSelectAll(checked: boolean) {
    if (checked) {
      const ids = this.filteredUsers().map((u) => u.id);
      this.selectedIds.set(new Set(ids));
    } else {
      this.selectedIds.set(new Set());
    }
  }

  isRowSelected(id: string) {
    return this.selectedIds().has(id);
  }
  toggleSelection(id: string) {
    this.selectedIds.update((set) => {
      const newSet = new Set(set);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }

  isAllSelected() {
    const visible = this.paginatedUsers();
    if (visible.length === 0) return false;
    const selected = this.selectedIds();
    return visible.every((u) => selected.has(u.id));
  }

  // -- Bulk Actions --
  bulkBlock() {
    const selected = this.selectedIds();
    if (selected.size === 0) return;

    this.openConfirmModal(
      'Block Selected Users?',
      `Are you sure you want to BLOCK ${selected.size} selected users? They will lose access.`,
      'BULK_BLOCK'
    );
  }

  executeBulkBlock() {
    const selected = this.selectedIds();
    this.allUsers.update((users) =>
      users.map((u) => (selected.has(u.id) ? { ...u, isActive: false } : u))
    );
    this.toastService.show(`${selected.size} users blocked`, 'success');
    this.selectedIds.set(new Set());
  }

  bulkDelete() {
    const selected = this.selectedIds();
    if (selected.size === 0) return;

    this.openConfirmModal(
      'Delete Selected Users?',
      `Are you sure you want to DELETE ${selected.size} selected users? This cannot be undone.`,
      'BULK_DELETE'
    );
  }

  executeBulkDelete() {
    const selected = this.selectedIds();
    const timestamp = new Date().getTime();
    this.allUsers.update((users) =>
      users.map((u) => {
        if (selected.has(u.id)) {
          return {
            ...u,
            isDeleted: true,
            email: `${u.email}_deleted_${timestamp}`,
            username: `${u.username}_deleted_${timestamp}`,
          };
        }
        return u;
      })
    );
    this.toastService.show(`${selected.size} users moved to bin`, 'success');
    this.selectedIds.set(new Set());
  }

  // GENERIC CONFIRMATION MODAL STATE
  isConfirmModalOpen = signal(false);
  confirmConfig = signal<{
    title: string;
    message: string;
    action: 'BULK_BLOCK' | 'BULK_DELETE';
  } | null>(null);

  openConfirmModal(
    title: string,
    message: string,
    action: 'BULK_BLOCK' | 'BULK_DELETE'
  ) {
    this.confirmConfig.set({ title, message, action });
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
      case 'BULK_BLOCK':
        this.executeBulkBlock();
        break;
      case 'BULK_DELETE':
        this.executeBulkDelete();
        break;
    }
    this.closeConfirmModal();
  }

  // -- Modal Actions --
  openAddUserModal() {
    this.isEditMode.set(false);
    this.currentUser.set(null);
    this.userForm.reset({
      role: 'USER',
      isActive: true,
      isDeleted: false,
    });
    this.userForm
      .get('password')
      ?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();

    this.isUserModalOpen.set(true);
  }

  onEditUser(user: any) {
    this.isEditMode.set(true);
    this.currentUser.set(user);
    this.userForm.patchValue({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      isDeleted: user.isDeleted,
      password: '',
    });
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();

    this.isUserModalOpen.set(true);
  }

  closeUserModal() {
    this.isUserModalOpen.set(false);
  }

  generatePassword() {
    const pwd = 'User@' + Math.floor(1000 + Math.random() * 9000);
    this.userForm.patchValue({ password: pwd });
  }

  submitUserForm() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const formVal = this.userForm.value;

    if (this.isEditMode()) {
      this.allUsers.update((users) =>
        users.map((u) =>
          u.id === formVal.id ? { ...u, ...formVal, avatarUrl: u.avatarUrl } : u
        )
      );
      this.toastService.show('User updated successfully', 'success');
    } else {
      const newUser = {
        ...formVal,
        id: Math.random().toString(36).substr(2, 9),
        isDeleted: false,
        createdAt: new Date().toISOString(),
        avatarUrl: `https://i.pravatar.cc/150?u=${Math.random()}`,
      };
      this.allUsers.update((users) => [newUser, ...users]);
      this.toastService.show('User created successfully', 'success');
    }
    this.closeUserModal();
  }

  // -- Block/Unblock Modal State --
  isBlockModalOpen = signal(false);
  userToBlock = signal<any | null>(null);

  // -- Reset Password Modal State --
  isResetModalOpen = signal(false);
  userToReset = signal<any | null>(null);

  // -- Row Actions (Open Modals) --
  onToggleStatus(user: any) {
    this.userToBlock.set(user);
    this.isBlockModalOpen.set(true);
  }

  onResetPassword(user: any) {
    this.userToReset.set(user);
    this.isResetModalOpen.set(true);
  }

  // -- Confirm Actions --
  confirmBlockUser() {
    const user = this.userToBlock();
    if (!user) return;

    const newStatus = !user.isActive;
    this.allUsers.update((users) =>
      users.map((u) => (u.id === user.id ? { ...u, isActive: newStatus } : u))
    );

    const msg = newStatus ? 'User activated' : 'User blocked';
    this.toastService.show(msg, newStatus ? 'success' : 'error');

    this.closeBlockModal();
  }

  confirmResetPassword() {
    const user = this.userToReset();
    if (!user) return;

    // Mock API call
    this.toastService.show(
      `Password reset email sent to ${user.email}`,
      'success'
    );
    this.closeResetModal();
  }

  // -- Close Modals --
  closeBlockModal() {
    this.isBlockModalOpen.set(false);
    this.userToBlock.set(null);
  }

  closeResetModal() {
    this.isResetModalOpen.set(false);
    this.userToReset.set(null);
  }

  // -- Delete Modal State --
  isDeleteModalOpen = signal(false);
  userToDelete = signal<any | null>(null);

  onDeleteUser(user: any) {
    this.userToDelete.set(user);
    this.isDeleteModalOpen.set(true);
  }

  confirmDeleteUser() {
    const user = this.userToDelete();
    if (user) {
      // Soft Delete with anti-collision suffix
      // NOTE: In a real app, this logic belongs in the Backend to handle Unique Constraints.
      // We are simulating it here for the mock.
      const timestamp = new Date().getTime();
      this.allUsers.update((users) =>
        users.map((u) =>
          u.id === user.id
            ? {
                ...u,
                isDeleted: true,
                email: `${u.email}_deleted_${timestamp}`,
                username: `${u.username}_deleted_${timestamp}`,
              }
            : u
        )
      );
      this.toastService.show('User moved to bin', 'success');
      this.closeDeleteModal();
    }
  }

  closeDeleteModal() {
    this.isDeleteModalOpen.set(false);
    this.userToDelete.set(null);
  }

  // -- Restore Modal State --
  isRestoreModalOpen = signal(false);
  userToRestore = signal<any | null>(null);

  onRestoreUser(user: any) {
    this.userToRestore.set(user);
    this.isRestoreModalOpen.set(true);
  }

  confirmRestoreUser() {
    const user = this.userToRestore();
    if (user) {
      this.allUsers.update((users) =>
        users.map((u) => (u.id === user.id ? { ...u, isDeleted: false } : u))
      );
      this.toastService.show('User restored successfully', 'success');
      this.closeRestoreModal();
    }
  }

  closeRestoreModal() {
    this.isRestoreModalOpen.set(false);
    this.userToRestore.set(null);
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
  }
}
