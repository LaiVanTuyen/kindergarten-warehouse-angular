import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styles: [],
})
export class ProfileComponent {
  activeTab: 'general' | 'security' = 'general';

  user = {
    name: 'Admin User',
    email: 'admin@kinderworld.com',
    role: 'Administrator',
    phone: '+1 (555) 123-4567',
    bio: 'Passionate about early childhood education and managing digital resources for the next generation of learners.',
    joinedDate: new Date('2023-10-15'),
    avatarUrl: '', // Empty for now to verify fallback
  };

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
