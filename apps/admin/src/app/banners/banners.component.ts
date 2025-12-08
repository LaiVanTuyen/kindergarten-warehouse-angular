import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BannerService } from '@kindergarten-warehouse/data-access';

@Component({
  selector: 'app-admin-banners',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      <div
        class="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50"
      >
        <h3 class="text-lg font-semibold text-gray-800">Banner Management</h3>
        <button
          class="bg-admin-navy text-white px-4 py-2 rounded-md hover:bg-opacity-90 transition-colors text-sm"
        >
          + Add New Banner
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr
              class="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider"
            >
              <th class="px-6 py-3 border-b border-gray-200">Order</th>
              <th class="px-6 py-3 border-b border-gray-200">Preview</th>
              <th class="px-6 py-3 border-b border-gray-200">Link</th>
              <th class="px-6 py-3 border-b border-gray-200">Status</th>
              <th class="px-6 py-3 border-b border-gray-200 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="text-gray-700 text-sm">
            <tr
              *ngFor="let banner of banners$ | async"
              class="hover:bg-gray-50 transition-colors"
            >
              <td class="px-6 py-4 border-b border-gray-200 font-medium">
                {{ banner.order }}
              </td>
              <td class="px-6 py-4 border-b border-gray-200">
                <img
                  [src]="banner.imageUrl"
                  class="h-12 w-24 object-cover rounded-md border border-gray-200"
                  alt="Banner"
                />
              </td>
              <td
                class="px-6 py-4 border-b border-gray-200 text-blue-500 truncate max-w-xs"
              >
                {{ banner.link || '-' }}
              </td>
              <td class="px-6 py-4 border-b border-gray-200">
                <button
                  class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2"
                  [ngClass]="banner.active ? 'bg-green-500' : 'bg-gray-200'"
                  role="switch"
                  [attr.aria-checked]="banner.active"
                >
                  <span
                    class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                    [ngClass]="
                      banner.active ? 'translate-x-5' : 'translate-x-0'
                    "
                  >
                  </span>
                </button>
              </td>
              <td
                class="px-6 py-4 border-b border-gray-200 text-right space-x-2"
              >
                <button class="text-blue-600 hover:text-blue-800 font-medium">
                  Edit
                </button>
                <button class="text-red-600 hover:text-red-800 font-medium">
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [],
})
export class BannersComponent {
  bannerService = inject(BannerService);
  banners$ = this.bannerService.getBanners();
}
