import {
  Component,
  computed,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PaginationComponent } from '../shared/components/pagination/pagination.component';
import { SkeletonTableComponent } from '../shared/components/skeleton-table/skeleton-table.component';
import {
  FormBuilder,
  ReactiveFormsModule,
  FormsModule,
  Validators,
  FormControl,
} from '@angular/forms';
import { BreadcrumbComponent } from '../shared/components/breadcrumb/breadcrumb.component';
import { EmptyStateComponent } from '../shared/components/empty-state/empty-state.component';
import {
  UserService,
  User,
  UserRole,
  UserStatus,
  AdminUpdateUserRequest,
  ApiResponse,
} from '@kindergarten-warehouse/data-access';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';
import { timer } from 'rxjs';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ToastService, AuthService } from '@kindergarten-warehouse/data-access';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    PaginationComponent,
    SkeletonTableComponent,
    BreadcrumbComponent,
    EmptyStateComponent,
  ],
  templateUrl: './users.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
    `,
  ],
})
export class UsersComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  toastService = inject(ToastService);
  userService = inject(UserService);
  authService = inject(AuthService);

  // -- State Signals --
  loggedInUser = toSignal(this.authService.currentUser$);
  users = signal<User[]>([]);
  isLoading = signal(false);

  // Selection for bulk actions
  selectedIds = signal<Set<number>>(new Set());

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);

  // Filter Signals (Driven by FormControls)
  searchQuery = signal('');
  roleFilter = signal<'ALL' | UserRole>('ALL');
  statusFilter = signal<'ALL' | 'ACTIVE' | 'BLOCKED' | 'DELETED'>('ALL');

  // Form Controls for UI
  searchControl = new FormControl<string>('', { nonNullable: true });
  roleControl = new FormControl<'ALL' | UserRole>('ALL', { nonNullable: true });
  statusControl = new FormControl<'ALL' | 'ACTIVE' | 'BLOCKED' | 'DELETED'>(
    'ALL',
    { nonNullable: true }
  );

  // Sorting
  sortColumn = signal<'fullName' | 'createdAt' | 'lastActive'>('createdAt');
  sortDirection = signal<'asc' | 'desc'>('desc');

  constructor() {
    /* Form initialized inline */
    this.initFromUrl();

    // -- Filter Subscriptions --
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((val) => {
        this.searchQuery.set(val || '');
        this.currentPage.set(1);
        this.updateUrl();
        this.loadUsers();
      });

    this.roleControl.valueChanges.subscribe((val) => {
      this.roleFilter.set((val as any) || 'ALL');
      this.currentPage.set(1);
      this.updateUrl();
      this.loadUsers();
    });

    this.statusControl.valueChanges.subscribe((val) => {
      this.statusFilter.set((val as any) || 'ALL');
      this.currentPage.set(1);
      this.updateUrl();
      this.loadUsers();
    });

    // Initial load is triggered by initFromUrl if needed, or explicitly here if no params
    // But loadUsers() updates URL, so let's call it to sync everything.
    this.loadUsers();
  }

  private initFromUrl() {
    const params = this.route.snapshot.queryParams;

    if (params['page']) this.currentPage.set(Number(params['page']));
    if (params['size']) this.pageSize.set(Number(params['size']));

    if (params['sort']) this.sortColumn.set(params['sort']);
    if (params['dir']) this.sortDirection.set(params['dir']);

    if (params['q']) {
      this.searchQuery.set(params['q']);
      this.searchControl.setValue(params['q'], { emitEvent: false });
    }

    if (params['role']) {
      const role = params['role'];
      this.roleFilter.set(role);
      this.roleControl.setValue(role, { emitEvent: false });
    }

    if (params['status']) {
      const status = params['status'];
      this.statusFilter.set(status);
      this.statusControl.setValue(status, { emitEvent: false });
    }
  }

  private updateUrl() {
    const queryParams: any = {
      page: this.currentPage(),
      size: this.pageSize(),
      sort: this.sortColumn(),
      dir: this.sortDirection(),
    };

    if (this.searchQuery()) {
      queryParams['search'] = this.searchQuery();
    } else {
      queryParams['search'] = null;
    }

    if (this.roleFilter() !== 'ALL') {
      queryParams['role'] = this.roleFilter();
    } else {
      queryParams['role'] = null;
    }

    if (this.statusFilter() !== 'ALL') {
      queryParams['status'] = this.statusFilter();
    } else {
      queryParams['status'] = null;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  loadUsers() {
    this.isLoading.set(true);
    this.userService
      .getUsers(
        this.currentPage(),
        this.pageSize(),
        this.searchQuery(),
        this.roleFilter(),
        this.statusFilter(), // Pass string status directly
        this.sortColumn(),
        this.sortDirection()
      )
      .subscribe({
        next: (res) => {
          if (res.result) {
            this.users.set(res.result.content);
            this.totalUsersCount.set(res.result.totalElements);
          }
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  // Derived Statistics
  totalUsersCount = signal(0);
  totalPages = computed(() =>
    Math.ceil(this.totalUsersCount() / this.pageSize())
  );

  // Helper for UI
  Math = Math;

  // -- Modal State --
  isUserModalOpen = signal(false);
  isEditMode = signal(false);

  // Typed Form
  userForm = this.fb.group({
    id: new FormControl<number | null>(null),
    fullName: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    username: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    password: new FormControl<string>(''), // Optional in edit mode
    roles: new FormControl<string[]>(['USER'], {
      nonNullable: true,
      validators: [Validators.required],
    }),
    isActive: new FormControl<boolean>(true, { nonNullable: true }),
    isDeleted: new FormControl<boolean>(false, { nonNullable: true }),
  });

  showPassword = signal(false);
  currentUser = signal<User | null>(null);

  resetFilters() {
    this.searchControl.setValue('', { emitEvent: false });
    this.roleControl.setValue('ALL', { emitEvent: false });
    this.statusControl.setValue('ALL', { emitEvent: false });

    // Update signals manually since events are suppressed
    this.searchQuery.set('');
    this.roleFilter.set('ALL');
    this.statusFilter.set('ALL');

    this.currentPage.set(1);
    this.updateUrl();
    this.loadUsers();
  }

  toggleSort(column: 'fullName' | 'createdAt' | 'lastActive') {
    if (this.sortColumn() === column) {
      this.sortDirection.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('desc');
    }
    this.updateUrl();
    this.loadUsers();
  }

  // -- Bulk Selection --
  clearSelection() {
    this.selectedIds.set(new Set());
  }

  toggleSelectAll(checked: boolean) {
    if (checked) {
      // Select all ON CURRENT PAGE except logged in user
      const loggedInId = this.loggedInUser()?.id;
      const ids = this.users()
        .filter((u) => u.id !== loggedInId)
        .map((u) => u.id);
      this.selectedIds.set(new Set(ids));
    } else {
      this.selectedIds.set(new Set());
    }
  }

  isRowSelected(id: number) {
    return this.selectedIds().has(id);
  }
  toggleSelection(id: number) {
    this.selectedIds.update((set) => {
      const newSet = new Set(set);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }

  isAllSelected() {
    const visible = this.users();
    const loggedInId = this.loggedInUser()?.id;
    // Filter out logged in user from "Select All" check
    const eligible = visible.filter((u) => u.id !== loggedInId);

    if (eligible.length === 0) return false;
    const selected = this.selectedIds();
    return eligible.every((u) => selected.has(u.id));
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
    // Implementation for Bulk Block (Looping or Bulk API if available)
    // For now, let's just loop sequentially as mockup
    // Real implementation should utilize forkJoin or a specific bulk endpoint
    let completed = 0;
    const total = selected.size;

    selected.forEach((id) => {
      this.userService.blockUser(String(id)).subscribe({
        next: () => {
          completed++;
          if (completed === total) {
            this.toastService.show(
              `${total} users blocked/unblocked`,
              'success'
            );
            this.loadUsers();
            this.selectedIds.set(new Set());
          }
        },
        error: (err) => console.error(err),
      });
    });
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
    let completed = 0;
    const total = selected.size;

    selected.forEach((id) => {
      this.userService.deleteUser(String(id)).subscribe({
        next: () => {
          completed++;
          if (completed === total) {
            this.toastService.show(`${total} users moved to bin`, 'success');
            this.loadUsers();
            this.selectedIds.set(new Set());
          }
        },
        error: (err) => console.error(err),
      });
    });
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
      roles: ['USER'],
      isActive: true,
      isDeleted: false,
    });
    this.userForm
      .get('password')
      ?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();

    this.isUserModalOpen.set(true);
  }

  onEditUser(user: User) {
    this.isEditMode.set(true);
    this.currentUser.set(user);

    // Determine Roles
    let roles = user.roles || [];
    if (roles.length === 0 && user.role) {
      roles = [user.role];
    }

    // Determine Active Status
    let isActive = user.isActive;
    if (user.status) {
      isActive = user.status === 'ACTIVE';
    }

    this.userForm.patchValue({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      roles: roles,
      isActive: isActive,
      // isDeleted property might be optional in User but we need it for form
      isDeleted: user.isDeleted ?? false,
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

  // -- Role Confirmation Modal (Deprecated / Removed) --
  // isRoleConfirmModalOpen = signal(false); // Removed

  submitUserForm() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const formVal = this.userForm.value;

    const requestData: any = {
      fullName: formVal.fullName,
      email: formVal.email,
      username: formVal.username,
      roles: formVal.roles,
      status: formVal.isActive ? 'ACTIVE' : 'BLOCKED',
    };

    if (this.isEditMode()) {
      // Update User
      // Prepare request object matching AdminUpdateUserRequest
      this.userService.updateUser(String(formVal.id), requestData).subscribe({
        next: (res) => {
          if (res.code === 200 || res.result) {
            this.toastService.show('User updated successfully', 'success');
            this.loadUsers();
            this.closeUserModal();
          } else {
            this.toastService.show(res.message || 'Update failed', 'error');
          }
        },
        error: (err) => {
          this.toastService.show(
            err.error?.message || 'Failed to update user',
            'error'
          );
        },
      });
    } else {
      // Create new user
      // Pass password for creation
      requestData.password = formVal.password;

      this.userService.createUser(requestData).subscribe({
        next: (res) => {
          this.toastService.show('User created successfully', 'success');
          this.loadUsers();
          this.closeUserModal();
        },
        error: (err) => {
          this.toastService.show(
            err.error?.message || 'Failed to create user',
            'error'
          );
        },
      });
    }
  }

  // Remove deprecated confirmRoleChange methods if they exist

  closeResetModal() {
    this.isResetModalOpen.set(false);
    this.userToReset.set(null);
    this.resetStep.set('INIT');
    this.otpControl.reset();
    this.stopOtpTimer();
  }

  // Update Reset Password
  // Update Reset Password
  // Renamed to onResetPassword to match template usage
  // Note: duplicate declaration of onResetPassword was removed below
  /*
  onResetPassword(user: User) {
     this.userToReset.set(user);
     this.resetStep.set('INIT');
     this.otpControl.reset();
     this.isResetModalOpen.set(true);
  }
  */
  // Actually, I should remove this block and keep the one I added below, or vice versa.
  // The block below is where `onResetPassword` normally lives (Row Actions).
  // But I put the logic here in the previous step.
  // I will KEEP this block but remove the method name if I moved it.

  // Wait, I just modified the block below (526-574) to have the logic.
  // So I should REMOVE the methods here to avoid duplicates.

  // Removing openResetModal and closeResetModal from this location as they are now consolidated below.

  // confirmResetPassword uses variables that are defined below (otpControl was redefined?).
  // Let's check where signals are defined.
  // Signals were duplicated in the previous view:
  // Line 500: isResetModalOpen... added in recent edit.
  // Line 531: isResetModalOpen... existing.

  // I need to clean up the duplicates deeply.

  confirmResetPassword() {
    const user = this.userToReset();
    if (!user) return;

    // Step 1: Initiate (Send OTP)
    if (this.resetStep() === 'INIT') {
      this.userService.initiatePasswordReset(user.id).subscribe({
        next: (res) => {
          this.toastService.show('OTP sent to user email', 'success');
          this.resetStep.set('OTP');
          this.startOtpTimer();
        },
        error: (err) => {
          this.toastService.show(
            err.error?.message || 'Failed to send OTP',
            'error'
          );
        },
      });
      return;
    }

    // Step 2: Confirm (Verify OTP)
    if (this.resetStep() === 'OTP') {
      if (this.otpControl.invalid) {
        this.otpControl.markAsTouched();
        return;
      }

      const otp = this.otpControl.value || '';
      this.userService.completePasswordReset(user.id, otp).subscribe({
        next: (res) => {
          const newPass = res.result;

          if (newPass) {
            this.toastService.show(
              `Success! New Password: ${newPass}`,
              'success'
            );
          } else {
            this.toastService.show(
              'Success! New password sent to user email.',
              'success'
            );
          }

          this.closeResetModal();
        },
        error: (err) => {
          this.toastService.show(
            err.error?.message || 'Invalid OTP or Reset Failed',
            'error'
          );
        },
      });
    }
  }

  // -- Block/Unblock Modal State --
  isBlockModalOpen = signal(false);
  userToBlock = signal<User | null>(null);

  // -- Row Actions (Open Modals) --
  onToggleStatus(user: User) {
    this.userToBlock.set(user);
    this.isBlockModalOpen.set(true);
  }

  // Renamed from openResetModal to match HTML template
  onResetPassword(user: User) {
    this.userToReset.set(user);
    this.resetStep.set('INIT');
    this.otpControl.reset();
    this.isResetModalOpen.set(true);
  }

  confirmBlockUser() {
    const user = this.userToBlock();
    if (!user) return;

    this.userService.blockUser(String(user.id)).subscribe((res) => {
      // Assuming showResponse or show handles generic ApiResponse
      this.toastService.show(
        res.message || 'Updated status successfully',
        'success'
      );
      this.loadUsers();
      this.closeBlockModal();
    });
  }

  // -- Close Modals --
  closeBlockModal() {
    this.isBlockModalOpen.set(false);
    this.userToBlock.set(null);
  }

  // closeResetModal is already defined above at line 470, removing duplicate here

  // -- Delete Modal State --
  isDeleteModalOpen = signal(false);
  userToDelete = signal<User | null>(null);

  onDeleteUser(user: User) {
    this.userToDelete.set(user);
    this.isDeleteModalOpen.set(true);
  }

  confirmDeleteUser() {
    const user = this.userToDelete();
    if (user) {
      this.userService.deleteUser(String(user.id)).subscribe((res) => {
        this.toastService.showResponse(res);
        this.loadUsers();
        this.closeDeleteModal();
      });
    }
  }

  closeDeleteModal() {
    this.isDeleteModalOpen.set(false);
    this.userToDelete.set(null);
  }

  // -- Reset Password Modal State --
  // -- Reset Password Modal State --
  isResetModalOpen = signal(false);
  userToReset = signal<User | null>(null);
  resetStep = signal<'INIT' | 'OTP'>('INIT');
  otpControl = new FormControl('', [
    Validators.required,
    Validators.minLength(6),
  ]);

  // OTP Timer
  otpCountdown = signal(0);
  private timerSub: any;

  startOtpTimer() {
    this.otpCountdown.set(300); // 5 minutes
    this.timerSub = setInterval(() => {
      const current = this.otpCountdown();
      if (current > 0) {
        this.otpCountdown.set(current - 1);
      } else {
        this.stopOtpTimer();
      }
    }, 1000);
  }

  stopOtpTimer() {
    if (this.timerSub) {
      clearInterval(this.timerSub);
      this.timerSub = null;
    }
  }
  // -- Restore Modal State --
  isRestoreModalOpen = signal(false);
  userToRestore = signal<User | null>(null);

  onRestoreUser(user: User) {
    this.userToRestore.set(user);
    this.isRestoreModalOpen.set(true);
  }

  confirmRestoreUser() {
    const user = this.userToRestore();
    if (user) {
      this.userService.restoreUser(String(user.id)).subscribe({
        next: (res) => {
          this.toastService.show('User restored successfully', 'success');
          this.loadUsers();
          this.closeRestoreModal();
        },
        error: (err) => {
          this.toastService.show('Failed to restore user', 'error');
        },
      });
    }
  }

  closeRestoreModal() {
    this.isRestoreModalOpen.set(false);
    this.userToRestore.set(null);
  }

  onPageSizeChange(newSize: number) {
    this.pageSize.set(Number(newSize));
    this.currentPage.set(1);
    this.updateUrl();
    this.loadUsers();
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.updateUrl();
    this.loadUsers();
  }

  trackByUser(index: number, item: User): number {
    return item.id;
  }

  // -- Helper for Checkbox Group --
  toggleRole(role: string, checked: boolean) {
    const currentRoles = this.userForm.value.roles || [];
    let newRoles = [...currentRoles];

    if (checked) {
      if (!newRoles.includes(role)) newRoles.push(role);
    } else {
      newRoles = newRoles.filter((r) => r !== role);
    }

    this.userForm.patchValue({ roles: newRoles });
    this.userForm.get('roles')?.markAsTouched();
  }
}
