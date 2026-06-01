import { Pipe, PipeTransform } from '@angular/core';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Quản trị viên',
  TEACHER: 'Giáo viên',
  USER: 'Người dùng',
};

@Pipe({
  name: 'roleLabel',
  standalone: true,
})
export class RoleLabelPipe implements PipeTransform {
  transform(role: string | null | undefined): string {
    if (!role) return '—';
    return ROLE_LABELS[role] ?? role;
  }
}
