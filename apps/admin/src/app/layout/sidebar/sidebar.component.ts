import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { RouterModule } from '@angular/router';

interface MenuItem {
  path: string;
  label: string;
  iconPath: string;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
    `,
  ],
})
export class SidebarComponent {
  readonly collapsed = input<boolean>(false);
  readonly toggleCollapsed = output<void>();

  readonly groups: MenuGroup[] = [
    {
      label: 'Tổng quan',
      items: [
        {
          path: '/dashboard',
          label: 'Bảng điều khiển',
          iconPath:
            'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
        },
      ],
    },
    {
      label: 'Nội dung',
      items: [
        {
          path: '/banners',
          label: 'Banner',
          iconPath:
            'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4M21 15l-3.1-3.1a2 2 0 0 0-2.8 0L6 21',
        },
        {
          path: '/categories',
          label: 'Phân loại & Chủ đề',
          iconPath:
            'M12 2H2v10l9.3 9.3a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4zM7 7h.01',
        },
        {
          path: '/resources',
          label: 'Tài nguyên',
          iconPath:
            'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z',
        },
      ],
    },
    {
      label: 'Quản trị',
      items: [
        {
          path: '/users',
          label: 'Người dùng',
          iconPath:
            'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
        },
        {
          path: '/audit-logs',
          label: 'Nhật ký',
          iconPath:
            'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
        },
      ],
    },
  ];

  onToggle() {
    this.toggleCollapsed.emit();
  }
}
