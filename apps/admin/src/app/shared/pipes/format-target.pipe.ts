import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatTarget',
  standalone: true,
})
export class FormatTargetPipe implements PipeTransform {
  transform(value: string | undefined | null): string {
    if (!value) return '';

    const mapping: { [key: string]: string } = {
      // User
      USER: 'Người dùng',
      USER_TOGGLE_BLOCK: 'Khóa/Mở khóa User',
      USER_PASSWORD_RESET: 'Khôi phục mật khẩu',
      USER_PROFILE: 'Cập nhật hồ sơ',
      USER_PASSWORD_CHANGE: 'Đổi mật khẩu',
      USER_AVATAR: 'Đổi Avatar',

      // Resource
      RESOURCE: 'Tài liệu',
      RESOURCE_CREATE: 'Tạo tài liệu',
      RESOURCE_UPDATE: 'Cập nhật tài liệu',

      // Category
      CATEGORY: 'Danh mục',
      CATEGORY_BULK: 'Thao tác gộp danh mục',

      // Topic
      TOPIC: 'Chủ đề',

      // Age Group
      AGE_GROUP: 'Nhóm tuổi',

      // Auth
      AUTH_LOGIN: 'Đăng nhập',
    };

    return mapping[value] || value;
  }
}
