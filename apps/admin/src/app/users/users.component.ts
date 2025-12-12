import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginationComponent } from '../shared/components/pagination/pagination.component';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
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
  imports: [CommonModule, ReactiveFormsModule, PaginationComponent],
  templateUrl: './users.component.html',
  styles: [],
})
export class UsersComponent {
  private fb = inject(FormBuilder);
  toastService = inject(ToastService);

  // -- State Signals --
  allUsers = signal<any[]>(MOCK_USERS);

  // Selection for bulk actions
  selectedUserIds = signal<Set<string>>(new Set());

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);

  // Filter Signals
  searchQuery = signal('');
  roleFilter = signal<'ALL' | 'ADMIN' | 'TEACHER' | 'USER'>('ALL');
  statusFilter = signal<'ALL' | 'ACTIVE' | 'BLOCKED' | 'DELETED'>('ALL');

  // Sorting
  sortColumn = signal<'fullName' | 'createdAt'>('createdAt');
  sortDirection = signal<'asc' | 'desc'>('desc');

  // Computed Users (Filtered & Sorted)
  filteredUsers = computed(() => {
    let users = this.allUsers();

    // 1. Filter by Search
    const query = this.searchQuery().toLowerCase();
    if (query) {
      users = users.filter(
        (u) =>
          u.fullName.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query)
      );
    }

    // 2. Filter by Role
    const role = this.roleFilter();
    if (role !== 'ALL') {
      users = users.filter((u) => u.role === role);
    }

    // 3. Filter by Status
    // 3. Filter by Status (and Soft Delete)
    const status = this.statusFilter();

    if (status === 'DELETED') {
      // Show ONLY deleted users
      users = users.filter((u) => u.isDeleted === true);
    } else {
      // Show ONLY non-deleted users
      users = users.filter((u) => u.isDeleted !== true);

      // Apply matching status if not ALL
      if (status !== 'ALL') {
        const isActive = status === 'ACTIVE';
        users = users.filter((u) => u.isActive === isActive);
      }
    }

    // 4. Sort
    const col = this.sortColumn();
    const dir = this.sortDirection();

    users = [...users].sort((a, b) => {
      const valA = a[col];
      const valB = b[col];
      if (valA < valB) return dir === 'asc' ? -1 : 1;
      if (valA > valB) return dir === 'asc' ? 1 : -1;
      return 0;
    });

    return users;
  });

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
  }

  // -- Search & Filter Actions --
  onSearch(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
    this.currentPage.set(1); // Reset page
  }

  onFilterRole(role: string) {
    this.roleFilter.set(role as any);
    this.currentPage.set(1);
  }

  onFilterStatus(status: string) {
    this.statusFilter.set(status as any);
    this.currentPage.set(1);
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
  toggleSelectAll(event: any) {
    const checked = event.target.checked;
    if (checked) {
      const ids = this.filteredUsers().map((u) => u.id);
      this.selectedUserIds.set(new Set(ids));
    } else {
      this.selectedUserIds.set(new Set());
    }
  }

  toggleSelectRow(id: string) {
    this.selectedUserIds.update((set) => {
      const newSet = new Set(set);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }

  isAllSelected() {
    const visible = this.paginatedUsers();
    if (visible.length === 0) return false;
    const selected = this.selectedUserIds();
    return visible.every((u) => selected.has(u.id));
  }

  isRowSelected(id: string) {
    return this.selectedUserIds().has(id);
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
