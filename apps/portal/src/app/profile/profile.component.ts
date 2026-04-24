import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AuthService } from '@kindergarten-warehouse/data-access';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  private readonly authService = inject(AuthService);

  readonly currentUser = this.authService.currentUser;
  readonly isTeacher = this.authService.isTeacher;
  readonly avatarUrl = computed(() =>
    this.authService.formatAssetUrl(this.currentUser()?.avatarUrl)
  );
  readonly initials = computed<string>(() => {
    const name = this.currentUser()?.fullName?.trim();
    if (!name) return 'ME';
    const [first = '', second = ''] = name.split(/\s+/);
    return (second ? first[0] + second[0] : first.slice(0, 2)).toUpperCase();
  });
}
