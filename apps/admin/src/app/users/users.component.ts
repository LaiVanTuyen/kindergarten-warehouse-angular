import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormControl,
} from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { UserService, User } from '@kindergarten-warehouse/data-access';
import { ToastService } from '../shared/toast/toast.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './users.component.html',
  styles: [],
})
export class UsersComponent {
  private fb = inject(FormBuilder);
  userService = inject(UserService);
  toastService = inject(ToastService);

  // Data Signals
  users = signal<User[]>([]);
  totalUsers = signal(0);
  currentPage = signal(1);
  pageSize = signal(10);
  protected readonly Math = Math;

  // Filters
  roleFilter = new FormControl<'ADMIN' | 'TEACHER' | 'USER' | ''>('');
  selectedRoleLabel = signal('All Roles');
  isRoleDropdownOpen = signal(false);

  statusFilter = new FormControl<'ACTIVE' | 'BLOCKED' | ''>('');
  selectedStatusLabel = signal('All Status');
  isStatusDropdownOpen = signal(false);

  searchControl = new FormControl('');

  // Create Teacher Modal
  isCreateModalOpen = signal(false);
  createTeacherForm: FormGroup;
  showPassword = signal(false);

  // Block User Modal
  isBlockModalOpen = signal(false);
  userToBlock = signal<User | null>(null);

  constructor() {
    this.createTeacherForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      fullName: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['TEACHER'], // Default
    });

    // Load initial data
    this.loadData();

    // Listen to filters
    this.roleFilter.valueChanges.subscribe(() => this.loadData());
    this.statusFilter.valueChanges.subscribe(() => this.loadData());
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.loadData());
  }

  toggleRoleDropdown() {
    this.isRoleDropdownOpen.update((v) => !v);
  }

  selectRole(role: 'ADMIN' | 'TEACHER' | 'USER' | '', label: string) {
    this.roleFilter.setValue(role);
    this.selectedRoleLabel.set(label);
    this.isRoleDropdownOpen.set(false);
  }

  toggleStatusDropdown() {
    this.isStatusDropdownOpen.update((v) => !v);
  }

  selectStatus(status: 'ACTIVE' | 'BLOCKED' | '', label: string) {
    this.statusFilter.setValue(status);
    this.selectedStatusLabel.set(label);
    this.isStatusDropdownOpen.set(false);
  }

  loadData() {
    this.userService
      .getUsers(this.currentPage(), this.pageSize(), {
        role: (this.roleFilter.value as any) || undefined,
        status: (this.statusFilter.value as any) || undefined,
        search: this.searchControl.value || undefined,
      })
      .subscribe((res) => {
        this.users.set(res.data);
        this.totalUsers.set(res.total);
      });
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadData();
  }

  // Create Teacher Actions
  openCreateModal() {
    this.isCreateModalOpen.set(true);
    this.createTeacherForm.reset({ role: 'TEACHER' });
    this.generatePassword(); // Auto-generate default
  }

  closeCreateModal() {
    this.isCreateModalOpen.set(false);
  }

  generatePassword() {
    const defaultPwd = 'Teacher@' + Math.floor(100 + Math.random() * 900);
    this.createTeacherForm.patchValue({ password: defaultPwd });
  }

  submitCreateUser() {
    if (this.createTeacherForm.invalid) return;

    this.userService.createUser(this.createTeacherForm.value).subscribe({
      next: () => {
        this.toastService.show('Teacher created successfully!', 'success');
        this.loadData();
        this.closeCreateModal();
      },
      error: (err) => {
        if (err.status === 409) {
          this.toastService.show('Username already exists.', 'error');
        } else {
          this.toastService.show('Failed to create user.', 'error');
        }
      },
    });
  }

  // Block/Unblock Actions
  confirmBlock(user: User) {
    this.userToBlock.set(user);
    this.isBlockModalOpen.set(true);
  }

  closeBlockModal() {
    this.isBlockModalOpen.set(false);
    this.userToBlock.set(null);
  }

  toggleBlockUser() {
    const user = this.userToBlock();
    if (!user) return;

    // Toggle logic: If currently active (isActive=true), we block (isActive=false).
    const newActiveState = !user.isActive;

    this.userService.updateUserStatus(user.id, newActiveState).subscribe(() => {
      const msg = newActiveState
        ? 'User unblocked successfully'
        : 'User blocked successfully';

      this.toastService.show(msg, 'success');
      this.loadData();
      this.closeBlockModal();
    });
  }

  resetPassword(user: User) {
    // TODO: Implement actual reset password logic
    this.toastService.show(
      `Password reset for ${user.username} (Mock Action)`,
      'success'
    );
  }
}
