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
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AuthService,
  User,
  UserService,
  ToastService,
} from '@kindergarten-warehouse/data-access';
import { PageHeaderComponent } from '../shared/components/page-header/page-header.component';
import { StatusPillComponent, StatusPillTone } from '../shared/components/status-pill/status-pill.component';
import { AvatarComponent } from '../shared/components/avatar/avatar.component';
import { SearchInputComponent } from '../shared/components/search-input/search-input.component';
import { EmptyStateComponent } from '../shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '../shared/components/pagination/pagination.component';
import { IconButtonComponent } from '../shared/components/icon-button/icon-button.component';
import { SortHeaderComponent, SortState } from '../shared/components/sort-header/sort-header.component';
import { RelativeTimePipe } from '../shared/pipes/relative-time.pipe';
import { RoleLabelPipe } from '../shared/pipes/role-label.pipe';
import { ConfirmDialogData } from '../shared/components/confirm-dialog/confirm-dialog.component';
import { DialogService } from '../shared/services/dialog.service';
import { handleHttpError } from '../shared/utils/rx-operators';
import { setupUrlSync } from '../shared/utils/url-sync';
import {
  UserFormDialogComponent,
  UserFormDialogData,
  UserFormDialogResult,
} from './components/user-form-dialog.component';
import {
  PasswordResetDialogComponent,
  PasswordResetDialogData,
} from './components/password-reset-dialog.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    PageHeaderComponent,
    StatusPillComponent,
    AvatarComponent,
    SearchInputComponent,
    EmptyStateComponent,
    PaginationComponent,
    IconButtonComponent,
    SortHeaderComponent,
    RelativeTimePipe,
    RoleLabelPipe,
  ],
  templateUrl: './users.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersComponent {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private dialogs = inject(DialogService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly currentUser = toSignal(this.authService.currentUser$, {
    initialValue: null,
  });

  readonly isLoading = signal(true);
  readonly users = signal<User[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(15);

  readonly search = signal('');
  readonly roleFilter = signal<string>('ALL');
  readonly statusFilter = signal<string>('ALL');
  readonly sortKey = signal<string>('createdAt');
  readonly sortDir = signal<'asc' | 'desc'>('desc');

  readonly sortState = computed<SortState>(() => ({
    key: this.sortKey(),
    dir: this.sortDir(),
  }));

  readonly roleOptions = [
    { value: 'ALL', label: 'Tất cả vai trò' },
    { value: 'ADMIN', label: 'Quản trị viên' },
    { value: 'TEACHER', label: 'Giáo viên' },
    { value: 'USER', label: 'Người dùng' },
  ];

  readonly statusOptions = [
    { value: 'ALL', label: 'Tất cả trạng thái' },
    { value: 'ACTIVE', label: 'Đang hoạt động' },
    { value: 'BLOCKED', label: 'Đã khoá' },
    { value: 'DELETED', label: 'Đã xoá' },
  ];

  readonly hasFilters = computed(
    () =>
      !!(this.search() || this.roleFilter() !== 'ALL' || this.statusFilter() !== 'ALL')
  );

  constructor() {
    // URL sync must run before the first load so we hydrate from query params.
    setupUrlSync({
      fields: {
        q: this.search,
        role: this.roleFilter,
        status: this.statusFilter,
        sort: this.sortKey,
        dir: this.sortDir,
        page: this.page,
      },
      skipValues: ['', 'ALL'],
      router: this.router,
      route: this.route,
    });

    // Any filter/sort change resets to page 1 and reloads.
    // `page.set(1)` and `load()` run inside untracked() so this effect does
    // NOT depend on `page`/`pageSize` — preventing an infinite loop when the
    // pagination click advances to page 2.
    effect(() => {
      this.search();
      this.roleFilter();
      this.statusFilter();
      this.sortKey();
      this.sortDir();
      untracked(() => {
        this.page.set(1);
        this.load();
      });
    });
  }

  load() {
    this.isLoading.set(true);
    this.userService
      .getUsers(
        this.page(),
        this.pageSize(),
        this.search(),
        this.roleFilter(),
        this.statusFilter(),
        this.sortKey(),
        this.sortDir()
      )
      .pipe(
        handleHttpError(this.toast, 'Không tải được danh sách người dùng.'),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          this.users.set(res.result?.content || []);
          this.total.set(res.result?.totalElements || 0);
          this.isLoading.set(false);
        },
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
    this.roleFilter.set('ALL');
    this.statusFilter.set('ALL');
  }

  rolesOf(user: User): string[] {
    if (user.roles && user.roles.length > 0) return user.roles;
    return user.role ? [user.role] : [];
  }

  roleTone(role: string): StatusPillTone {
    switch (role) {
      case 'ADMIN':
        return 'admin';
      case 'TEACHER':
        return 'teacher';
      default:
        return 'user';
    }
  }

  statusTone(status?: string): StatusPillTone {
    switch (status) {
      case 'ACTIVE':
        return 'active';
      case 'BLOCKED':
        return 'rejected';
      case 'DELETED':
        return 'inactive';
      default:
        return 'neutral';
    }
  }

  statusLabel(status?: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'Hoạt động';
      case 'BLOCKED':
        return 'Đã khoá';
      case 'DELETED':
        return 'Đã xoá';
      default:
        return status ?? '—';
    }
  }

  // --- CRUD handlers ------------------------------------------------------

  openCreate() {
    this.openForm(null);
  }
  openEdit(user: User) {
    this.openForm(user);
  }

  private openForm(user: User | null) {
    const data: UserFormDialogData = { user };
    this.dialogs
      .openForm<UserFormDialogResult, UserFormDialogData>(
        UserFormDialogComponent,
        data,
        this.destroyRef
      )
      .subscribe((result) => {
        if (!result) return;
        const req$ = user
          ? this.userService.updateUser(user.id, {
              fullName: result.fullName,
              email: result.email,
              username: result.username,
              role: result.roles[0] as 'ADMIN' | 'TEACHER' | 'USER',
              roles: result.roles,
              status: result.status,
            })
          : this.userService.createUser({
              fullName: result.fullName,
              username: result.username,
              email: result.email,
              password: result.password,
              roles: result.roles,
              status: result.status,
            });

        req$
          .pipe(
            handleHttpError(
              this.toast,
              user ? 'Không cập nhật được.' : 'Không tạo được tài khoản.'
            )
          )
          .subscribe(() => {
            this.toast.show(
              user ? 'Đã cập nhật tài khoản.' : 'Đã tạo tài khoản mới.',
              'success'
            );
            this.load();
          });
      });
  }

  confirmBlock(user: User) {
    const isBlocked = user.status === 'BLOCKED';
    const data: ConfirmDialogData = {
      title: isBlocked ? 'Mở khoá tài khoản' : 'Khoá tài khoản',
      message: isBlocked
        ? `Mở khoá "${user.fullName}" và cho phép họ đăng nhập trở lại?`
        : `Khoá "${user.fullName}" khỏi hệ thống? Họ sẽ không thể đăng nhập.`,
      confirmText: isBlocked ? 'Mở khoá' : 'Khoá',
      cancelText: 'Huỷ',
      tone: isBlocked ? 'primary' : 'danger',
    };
    this.dialogs.confirm(data, this.destroyRef).subscribe((ok) => {
      if (!ok) return;
      this.userService
        .blockUser(String(user.id))
        .pipe(
          handleHttpError(this.toast, 'Không thay đổi được trạng thái.')
        )
        .subscribe(() => {
          this.toast.show(
            isBlocked ? 'Đã mở khoá.' : 'Đã khoá tài khoản.',
            'success'
          );
          this.load();
        });
    });
  }

  confirmDelete(user: User) {
    const data: ConfirmDialogData = {
      title: 'Xoá tài khoản',
      message: `Xoá "${user.fullName}"? Dữ liệu sẽ chuyển vào thùng rác và có thể khôi phục.`,
      confirmText: 'Xoá',
      cancelText: 'Huỷ',
      tone: 'danger',
    };
    this.dialogs.confirm(data, this.destroyRef).subscribe((ok) => {
      if (!ok) return;
      this.userService
        .deleteUser(String(user.id))
        .pipe(
          handleHttpError(this.toast, 'Không xoá được tài khoản.')
        )
        .subscribe(() => {
          this.toast.show('Đã xoá tài khoản.', 'success');
          this.load();
        });
    });
  }

  restoreUser(user: User) {
    this.userService
      .restoreUser(String(user.id))
      .pipe(
        handleHttpError(this.toast, 'Không khôi phục được.')
      )
      .subscribe(() => {
        this.toast.show('Đã khôi phục tài khoản.', 'success');
        this.load();
      });
  }

  openPasswordReset(user: User) {
    const data: PasswordResetDialogData = {
      userId: user.id,
      userName: user.fullName,
    };
    this.dialogs
      .openForm<boolean, PasswordResetDialogData>(
        PasswordResetDialogComponent,
        data,
        this.destroyRef
      )
      .subscribe();
  }

  isSelf(user: User): boolean {
    return this.currentUser()?.id === user.id;
  }
}
