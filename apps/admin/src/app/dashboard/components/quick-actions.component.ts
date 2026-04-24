import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface QuickAction {
  label: string;
  description: string;
  route: string;
  queryParams?: Record<string, string | number | boolean>;
  tone: 'coral' | 'sun' | 'mint' | 'sky' | 'lavender';
  iconPath: string;
}

const ACTIONS: QuickAction[] = [
  {
    label: 'Duyệt nội dung',
    description: 'Xem hàng đợi',
    route: '/resources',
    queryParams: { status: 'PENDING' },
    tone: 'coral',
    iconPath:
      'M9 12l2 2 4-4M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z',
  },
  {
    label: 'Banner mới',
    description: 'Thêm vào slider',
    route: '/banners',
    queryParams: { new: true },
    tone: 'sun',
    iconPath:
      'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4M21 15l-3.1-3.1a2 2 0 0 0-2.8 0L6 21',
  },
  {
    label: 'Chủ đề mới',
    description: 'Quản lý phân loại',
    route: '/categories',
    queryParams: { newTopic: true },
    tone: 'mint',
    iconPath:
      'M12 2H2v10l9.3 9.3a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4zM7 7h.01',
  },
  {
    label: 'Thêm tài khoản',
    description: 'Admin / Giáo viên',
    route: '/users',
    queryParams: { new: true },
    tone: 'sky',
    iconPath:
      'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M12 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8M20 8v6M17 11h6',
  },
];

const TONE_CLASSES = {
  coral: 'bg-kindy-coral-soft text-kindy-coral-strong group-hover:bg-kindy-coral group-hover:text-white',
  sun: 'bg-kindy-sun-soft text-amber-600 group-hover:bg-kindy-sun group-hover:text-white',
  mint: 'bg-kindy-mint-soft text-emerald-600 group-hover:bg-kindy-mint group-hover:text-white',
  sky: 'bg-kindy-sky-soft text-blue-600 group-hover:bg-kindy-sky group-hover:text-white',
  lavender: 'bg-kindy-lavender/40 text-violet-600 group-hover:bg-kindy-lavender group-hover:text-white',
};

@Component({
  selector: 'app-quick-actions',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid grid-cols-2 gap-3">
      @for (action of actions; track action.route + '?' + action.label) {
        <a
          [routerLink]="action.route"
          [queryParams]="action.queryParams || null"
          class="group flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-kindy-sidebar/30 hover:bg-kindy-surface-soft transition-colors focus:outline-none focus:ring-2 focus:ring-kindy-sidebar"
        >
          <span
            aria-hidden="true"
            [class]="'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ' + toneClass(action.tone)"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              viewBox="0 0 24 24"
            >
              <path [attr.d]="action.iconPath" />
            </svg>
          </span>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-kindy-ink truncate">
              {{ action.label }}
            </p>
            <p class="text-xs text-kindy-ink-soft truncate">
              {{ action.description }}
            </p>
          </div>
        </a>
      }
    </div>
  `,
})
export class QuickActionsComponent {
  readonly actions = ACTIONS;

  toneClass(tone: QuickAction['tone']): string {
    return TONE_CLASSES[tone];
  }
}
