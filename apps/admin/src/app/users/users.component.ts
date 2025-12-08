import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '@kindergarten-warehouse/data-access';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      <div
        class="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50"
      >
        <h3 class="text-lg font-semibold text-gray-800">User Management</h3>
        <div class="flex space-x-2">
          <button
            class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            + Create Teacher
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-gray-50 text-gray-600 text-sm uppercase">
            <tr>
              <th class="px-6 py-3">User</th>
              <th class="px-6 py-3">Role</th>
              <th class="px-6 py-3">Status</th>
              <th class="px-6 py-3">Joined Date</th>
              <th class="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="text-gray-700 text-sm">
            <!-- Mock Data Row 1 (Admin) -->
            <tr class="border-b border-gray-100 hover:bg-gray-50">
              <td class="px-6 py-4">
                <div class="flex items-center">
                  <div
                    class="h-8 w-8 rounded-full bg-admin-navy text-white flex items-center justify-center font-bold mr-3"
                  >
                    A
                  </div>
                  <div>
                    <div class="font-medium text-gray-900">Admin User</div>
                    <div class="text-xs text-gray-500">
                      admin@kindergarten.com
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span
                  class="px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700"
                  >ADMIN</span
                >
              </td>
              <td class="px-6 py-4">
                <span
                  class="flex items-center text-green-600 font-medium text-xs"
                >
                  <span class="h-2 w-2 rounded-full bg-green-500 mr-1.5"></span>
                  Active
                </span>
              </td>
              <td class="px-6 py-4 text-gray-500">Jan 10, 2024</td>
              <td class="px-6 py-4 text-right">
                <button class="text-gray-400 cursor-not-allowed">Edit</button>
              </td>
            </tr>

            <!-- Mock Data Row 2 (Teacher) -->
            <tr class="border-b border-gray-100 hover:bg-gray-50">
              <td class="px-6 py-4">
                <div class="flex items-center">
                  <div
                    class="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold mr-3"
                  >
                    S
                  </div>
                  <div>
                    <div class="font-medium text-gray-900">Sarah Johnson</div>
                    <div class="text-xs text-gray-500">sarah.j@school.edu</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span
                  class="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700"
                  >TEACHER</span
                >
              </td>
              <td class="px-6 py-4">
                <span
                  class="flex items-center text-green-600 font-medium text-xs"
                >
                  <span class="h-2 w-2 rounded-full bg-green-500 mr-1.5"></span>
                  Active
                </span>
              </td>
              <td class="px-6 py-4 text-gray-500">Feb 14, 2024</td>
              <td class="px-6 py-4 text-right space-x-2">
                <button class="text-blue-600 hover:underline">Reset Pwd</button>
                <button class="text-orange-600 hover:underline">Block</button>
              </td>
            </tr>

            <!-- Mock Data Row 3 (User / Parent) -->
            <tr class="border-b border-gray-100 hover:bg-gray-50">
              <td class="px-6 py-4">
                <div class="flex items-center">
                  <div
                    class="h-8 w-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold mr-3"
                  >
                    M
                  </div>
                  <div>
                    <div class="font-medium text-gray-900">Mike Smith</div>
                    <div class="text-xs text-gray-500">
                      mike.smith@email.com
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span
                  class="px-2 py-1 rounded text-xs font-bold bg-gray-100 text-gray-700"
                  >USER</span
                >
              </td>
              <td class="px-6 py-4">
                <span
                  class="flex items-center text-gray-500 font-medium text-xs"
                >
                  <span class="h-2 w-2 rounded-full bg-gray-400 mr-1.5"></span>
                  Offline
                </span>
              </td>
              <td class="px-6 py-4 text-gray-500">Mar 01, 2024</td>
              <td class="px-6 py-4 text-right space-x-2">
                <button class="text-blue-600 hover:underline">Details</button>
                <button class="text-orange-600 hover:underline">Block</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [],
})
export class UsersComponent {
  userService = inject(UserService);
}
