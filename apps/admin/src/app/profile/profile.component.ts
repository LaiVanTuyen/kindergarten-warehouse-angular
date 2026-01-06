import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import {
  AuthService,
  UserService,
  ToastService,
} from '@kindergarten-warehouse/data-access';
import {
  UpdateProfileRequest,
  ChangePasswordRequest,
} from '@kindergarten-warehouse/data-access';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styles: [],
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private toastService = inject(ToastService);

  activeTab: 'general' | 'security' = 'general';

  user = {
    name: '',
    email: '',
    role: '',
    phone: '',
    bio: '',
    joinedDate: new Date(),
    avatarUrl: '',
  };

  // State for Dirty Checking
  initialUser = { ...this.user };

  // Loading States
  isSavingProfile = false;
  isChangingPassword = false;
  isUploadingAvatar = false;

  // Password Fields
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  // Helper to fix MinIO URL in Local Dev environment
  private formatAvatarUrl(url: string | undefined): string {
    if (!url) return '';
    // If URL contains internal docker hostname 'minio', replace with 'localhost'
    if (url.includes('minio:9000')) {
      return url.replace('minio:9000', 'localhost:9000');
    }
    return url;
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe((currentUser) => {
      if (currentUser) {
        this.user = {
          name: currentUser.fullName,
          email: currentUser.email,
          role: currentUser.roles?.length
            ? currentUser.roles.join(', ')
            : currentUser.role || 'User',
          phone: currentUser.phoneNumber || '',
          bio: currentUser.bio || '',
          joinedDate: this.parseDate(currentUser.createdAt),
          avatarUrl: this.formatAvatarUrl(currentUser.avatarUrl),
        };
        // If we want to support phone/bio from the beginning, we need to ensure the User model has them.
        // Assuming the User model in auth.model.ts might *not* have them yet based on previous read.
        // Let's check if I need to update User model to include phone/bio if they are returned by API
        // But for now, let's keep it simple. If the user object in authService doesn't have phone/bio, they will be empty.

        this.initialUser = { ...this.user };
      }
    });
  }

  private parseDate(dateStr: string | undefined): Date {
    if (!dateStr) return new Date();
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
  }

  get hasChanges(): boolean {
    return JSON.stringify(this.user) !== JSON.stringify(this.initialUser);
  }

  get isPasswordValid(): boolean {
    return (
      this.currentPassword.length > 0 &&
      this.newPassword.length >= 8 &&
      this.newPassword === this.confirmPassword &&
      this.newPassword !== this.currentPassword
    );
  }

  get passwordsMatch(): boolean {
    return !this.confirmPassword || this.newPassword === this.confirmPassword;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      this.isUploadingAvatar = true; // Start loading

      // Call Upload API immediately
      this.userService.uploadAvatar(file).subscribe({
        next: (response) => {
          this.isUploadingAvatar = false; // Stop loading
          this.toastService.show('Avatar updated successfully!', 'success');

          if (response.result) {
            console.log(
              'New Avatar URL from Backend:',
              response.result.avatarUrl
            ); // DEBUG

            // Format URL before saving
            const fixedUrl = this.formatAvatarUrl(response.result.avatarUrl);

            this.user.avatarUrl = fixedUrl;

            // Update Auth Service with the fixed URL too, or let it receive the raw one?
            // Ideally Auth Service should hold raw data, but for display we need fixed.
            // Let's update Auth Service with proper data, but we might need to patch it globally if we want Header to work.
            // For now, let's just make sure Profile page works.
            // Actually, if we update currentUser with raw URL, header might still break.
            // Let's update the result object's avatarUrl before passing to authService.

            const updatedUser = { ...response.result, avatarUrl: fixedUrl };
            this.authService.updateCurrentUser(updatedUser);
          }
        },
        error: (err) => {
          this.isUploadingAvatar = false; // Stop loading
          this.toastService.show(
            err.error?.message || 'Failed to upload avatar',
            'error'
          );
        },
      });
    }
  }

  handleImageError() {
    // Fallback if image fails to load
    this.user.avatarUrl = ''; // This will trigger the fallback to UI-Avatars in the template
  }

  saveProfile() {
    if (this.isSavingProfile) return;
    this.isSavingProfile = true;

    const request: UpdateProfileRequest = {
      fullName: this.user.name,
      phoneNumber: this.user.phone,
      bio: this.user.bio,
    };

    this.userService.updateProfile(request).subscribe({
      next: (response) => {
        this.toastService.show('Profile updated successfully!', 'success');
        this.initialUser = { ...this.user };

        // Update local user state via AuthService if the response contains the updated user
        // Assuming response.result is the User object
        if (response.result) {
          this.authService.updateCurrentUser(response.result);
        }
        this.isSavingProfile = false;
      },
      error: (err) => {
        this.toastService.show(
          err.error?.message || 'Failed to update profile',
          'error'
        );
        this.isSavingProfile = false;
      },
    });
  }

  @ViewChild('passwordForm') passwordForm?: NgForm;

  updatePassword() {
    if (this.isChangingPassword) return;
    this.isChangingPassword = true;

    const request: ChangePasswordRequest = {
      currentPassword: this.currentPassword,
      newPassword: this.newPassword,
    };

    this.userService.changePassword(request).subscribe({
      next: () => {
        this.toastService.show('Password changed successfully!', 'success');

        // Reset form state properly to remove validation errors
        if (this.passwordForm) {
          this.passwordForm.resetForm();
        }

        // Explicitly clear models just in case (though resetForm does most of it)
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.isChangingPassword = false;
      },
      error: (err) => {
        // Error is already handled by AuthInterceptor/Global Error Handler
        this.isChangingPassword = false;
      },
    });
  }
}
