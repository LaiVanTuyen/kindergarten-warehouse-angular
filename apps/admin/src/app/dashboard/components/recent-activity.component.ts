import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ActivityAction, ActivityItem } from '@kindergarten-warehouse/data-access';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';

interface ActionStyle {
  bg: string;
  text: string;
  label: string;
  iconPath: string;
}

const ACTION_STYLES: Record<ActivityAction, ActionStyle> = {
  UPLOAD: {
    bg: 'bg-kindy-sky-soft',
    text: 'text-blue-600',
    label: 'đã tải lên',
    iconPath:
      'M12 3v14m0-14L7 8m5-5l5 5M5 21h14a2 2 0 002-2v-2H3v2a2 2 0 002 2z',
  },
  APPROVE: {
    bg: 'bg-kindy-mint-soft',
    text: 'text-emerald-600',
    label: 'đã phê duyệt',
    iconPath: 'M20 6L9 17l-5-5',
  },
  REJECT: {
    bg: 'bg-kindy-coral-soft',
    text: 'text-kindy-coral-strong',
    label: 'đã từ chối',
    iconPath: 'M18 6L6 18M6 6l12 12',
  },
  DELETE: {
    bg: 'bg-kindy-coral-soft',
    text: 'text-kindy-coral-strong',
    label: 'đã xoá',
    iconPath:
      'M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6',
  },
  UPDATE: {
    bg: 'bg-kindy-sun-soft',
    text: 'text-amber-600',
    label: 'đã cập nhật',
    iconPath:
      'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
  },
  LOGIN: {
    bg: 'bg-kindy-lavender/40',
    text: 'text-violet-600',
    label: '',
    iconPath:
      'M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3',
  },
};

@Component({
  selector: 'app-recent-activity',
  standalone: true,
  imports: [RelativeTimePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (items().length === 0) {
      <p class="text-sm text-kindy-ink-soft py-8 text-center">
        Chưa có hoạt động nào.
      </p>
    } @else {
      <ul class="space-y-4">
        @for (item of items(); track item.id) {
          <li class="flex items-start gap-3">
            <div
              aria-hidden="true"
              [class]="'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ' + style(item.action).bg + ' ' + style(item.action).text"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                viewBox="0 0 24 24"
              >
                <path [attr.d]="style(item.action).iconPath" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-kindy-ink">
                <span class="font-semibold">{{ item.actor }}</span>
                @if (style(item.action).label) {
                  <span class="text-kindy-ink-soft"> {{ style(item.action).label }} </span>
                }
                <span>{{ item.target }}</span>
              </p>
              <p class="text-xs text-kindy-ink-soft mt-0.5">
                {{ item.timestamp | relativeTime }}
              </p>
            </div>
          </li>
        }
      </ul>
    }
  `,
})
export class RecentActivityComponent {
  readonly items = input.required<ActivityItem[]>();

  style(action: ActivityAction): ActionStyle {
    return ACTION_STYLES[action] ?? ACTION_STYLES.UPDATE;
  }
}
