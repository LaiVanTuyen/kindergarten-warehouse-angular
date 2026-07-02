import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { SidebarComponent } from './sidebar/sidebar.component';
import { BreadcrumbComponent } from '../shared/components/breadcrumb/breadcrumb.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../shared/components/confirm-dialog/confirm-dialog.component';
import { AuthService } from '@kindergarten-warehouse/data-access';
import { DialogService } from '../shared/services/dialog.service';
import { RoleLabelPipe } from '../shared/pipes/role-label.pipe';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterModule, SidebarComponent, BreadcrumbComponent, RoleLabelPipe],
  templateUrl: './admin-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayoutComponent {
  private authService = inject(AuthService);
  private dialogs = inject(DialogService);
  private destroyRef = inject(DestroyRef);

  readonly isProfileOpen = signal(false);
  readonly isSidebarOpen = signal(false); // mobile drawer
  readonly isSidebarCollapsed = signal(false); // desktop collapse

  readonly currentUser = toSignal(this.authService.currentUser$, {
    initialValue: null,
  });

  readonly avatarUrl = computed(() =>
    this.authService.formatAvatarUrl(this.currentUser()?.avatarUrl)
  );

  readonly userInitials = computed(() => {
    const name = this.currentUser()?.fullName;
    if (!name) return 'A';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  });

  readonly currentUserRoles = computed(() => {
    const user = this.currentUser();
    if (!user) return [] as string[];
    if (user.roles && user.roles.length > 0) return user.roles;
    return user.role ? [user.role] : [];
  });

  private profileMenu = viewChild<ElementRef<HTMLElement>>('profileMenu');
  private profileButton = viewChild<ElementRef<HTMLElement>>('profileButton');

  toggleProfile() {
    this.isProfileOpen.update((v) => !v);
  }

  toggleSidebar() {
    this.isSidebarOpen.update((v) => !v);
  }

  toggleSidebarCollapsed() {
    this.isSidebarCollapsed.update((v) => !v);
  }

  closeMobileSidebar() {
    this.isSidebarOpen.set(false);
  }

  logout() {
    this.isProfileOpen.set(false);
    const data: ConfirmDialogData = {
      title: 'Đăng xuất',
      message: 'Bạn có chắc muốn đăng xuất khỏi trang quản trị?',
      confirmText: 'Đăng xuất',
      cancelText: 'Ở lại',
      tone: 'danger',
    };
    this.dialogs.confirm(data, this.destroyRef).subscribe((confirmed) => {
      if (confirmed) {
        this.authService.logout('Hẹn gặp lại bạn! 👋');
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.isProfileOpen()) this.isProfileOpen.set(false);
    if (this.isSidebarOpen()) this.isSidebarOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.isProfileOpen()) return;
    const target = event.target as Node;
    const menu = this.profileMenu()?.nativeElement;
    const button = this.profileButton()?.nativeElement;
    if (
      menu &&
      !menu.contains(target) &&
      button &&
      !button.contains(target)
    ) {
      this.isProfileOpen.set(false);
    }
  }
}
