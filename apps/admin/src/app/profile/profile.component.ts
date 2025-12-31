import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@kindergarten-warehouse/data-access';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styles: [],
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);

  activeTab: 'general' | 'security' = 'general';

  user = {
    name: '',
    email: '',
    role: '',
    phone: '', // Not in User model yet
    bio: '', // Not in User model yet
    joinedDate: new Date(),
    avatarUrl: '',
  };

  ngOnInit() {
    this.authService.currentUser$.subscribe((currentUser) => {
      if (currentUser) {
        this.user = {
          ...this.user,
          name: currentUser.fullName,
          email: currentUser.email,
          role: currentUser.roles?.length
            ? currentUser.roles.join(', ')
            : currentUser.role || 'User',
          joinedDate: this.parseDate(currentUser.createdAt),
          avatarUrl: currentUser.avatarUrl || '',
        };
        // Update check state
        this.initialUser = { ...this.user };
      }
    });
  }

  private parseDate(dateStr: string | undefined): Date {
    if (!dateStr) return new Date();
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
  }

  // State for Dirty Checking
  initialUser = { ...this.user };

  // Password Fields
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  get hasChanges(): boolean {
    return JSON.stringify(this.user) !== JSON.stringify(this.initialUser);
  }

  get isPasswordValid(): boolean {
    return (
      this.currentPassword.length > 0 &&
      this.newPassword.length >= 8 &&
      this.newPassword === this.confirmPassword
    );
  }

  get passwordsMatch(): boolean {
    return !this.confirmPassword || this.newPassword === this.confirmPassword;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          this.user.avatarUrl = e.target.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  saveProfile() {
    console.log('Profile saved:', this.user);
    // In a real app, this would be an API call
    alert('Changes saved successfully!');
    this.initialUser = { ...this.user }; // Reset dirty state
  }

  updatePassword() {
    alert('Password updated successfully!');
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
  }
}
