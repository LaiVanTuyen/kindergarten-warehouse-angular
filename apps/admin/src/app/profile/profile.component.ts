import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-4xl mx-auto">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">My Profile</h1>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <!-- Cover Image -->
        <div class="h-32 bg-gradient-to-r from-primary-pink to-primary-blue"></div>

        <div class="px-8 pb-8">
          <!-- Avatar -->
          <div class="relative -mt-12 mb-6">
            <div class="w-24 h-24 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center text-3xl shadow-md">
              👤
            </div>
          </div>

          <!-- Form -->
          <form (ngSubmit)="saveProfile()">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input 
                  type="text" 
                  [(ngModel)]="user.name" 
                  name="name"
                  class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none transition-all"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input 
                  type="email" 
                  [(ngModel)]="user.email" 
                  name="email"
                  class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none transition-all"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <input 
                  type="text" 
                  [value]="user.role" 
                  disabled
                  class="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input 
                  type="tel" 
                  [(ngModel)]="user.phone" 
                  name="phone"
                  class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none transition-all"
                >
              </div>
            </div>

            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">Bio</label>
              <textarea 
                [(ngModel)]="user.bio" 
                name="bio"
                rows="4"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none transition-all"
              ></textarea>
            </div>

            <div class="flex justify-end gap-4">
              <button 
                type="button" 
                class="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                class="px-6 py-2 rounded-lg bg-primary-blue text-white font-bold shadow-md hover:bg-blue-600 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class ProfileComponent {
  user = {
    name: 'Admin User',
    email: 'admin@kinderworld.com',
    role: 'Administrator',
    phone: '+1 (555) 123-4567',
    bio: 'Passionate about early childhood education and managing digital resources for the next generation of learners.',
  };

  saveProfile() {
    console.log('Profile saved:', this.user);
    alert('Profile saved successfully!');
  }
}
