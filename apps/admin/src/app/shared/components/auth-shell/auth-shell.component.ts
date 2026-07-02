import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Visual shell shared by all auth pages (login, forgot-password, reset-password).
 * Content slot projects the form card body.
 */
@Component({
  selector: 'app-auth-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="min-h-screen bg-gradient-to-br from-kindy-surface-soft via-kindy-cream to-kindy-coral-soft/40 relative overflow-y-auto"
    >
      <!-- Decorative blobs -->
      <div
        aria-hidden="true"
        class="absolute top-0 -left-24 w-96 h-96 bg-kindy-lavender/40 rounded-full blur-3xl"
      ></div>
      <div
        aria-hidden="true"
        class="absolute bottom-0 -right-24 w-[28rem] h-[28rem] bg-kindy-coral-soft/50 rounded-full blur-3xl"
      ></div>
      <div
        aria-hidden="true"
        class="absolute top-1/3 right-1/4 w-64 h-64 bg-kindy-sun-soft/60 rounded-full blur-3xl"
      ></div>

      <div class="relative min-h-screen flex items-center justify-center px-4 py-10">
        <div class="w-full max-w-md">
          <!-- Branding -->
          <header class="text-center mb-6">
            <div
              aria-hidden="true"
              class="inline-flex items-center justify-center w-16 h-16 bg-kindy-coral rounded-2xl shadow-lg shadow-kindy-coral/30 mb-3 text-3xl"
            >🌱</div>
            <h1 class="text-2xl font-bold font-display text-kindy-ink">
              Mầm Non Admin
            </h1>
            <p class="text-kindy-ink-soft text-sm mt-1">
              {{ subtitle() }}
            </p>
          </header>

          <!-- Form card -->
          <div class="bg-white rounded-3xl border border-gray-100 shadow-xl p-7 sm:p-8">
            <ng-content />
          </div>

          <p class="text-center text-kindy-ink-soft text-xs mt-6">
            © {{ currentYear }} Mầm Non Admin · Hệ thống quản lý kho tài nguyên
          </p>
        </div>
      </div>
    </div>
  `,
})
export class AuthShellComponent {
  readonly subtitle = input('Hệ thống quản lý kho tài nguyên mầm non');
  readonly currentYear = new Date().getFullYear();
}
