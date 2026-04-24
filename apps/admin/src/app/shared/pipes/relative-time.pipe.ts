import { Pipe, PipeTransform } from '@angular/core';

/**
 * Renders an ISO date/time as a Vietnamese relative string, e.g. "5 phút trước".
 * Pure pipe — dashboard data is refreshed on filter change, so second-by-second
 * accuracy is not required.
 */
@Pipe({
  name: 'relativeTime',
  standalone: true,
})
export class RelativeTimePipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    if (!value) return '';
    const date = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(date.getTime())) return '';

    const diffMs = Date.now() - date.getTime();
    const sec = Math.floor(diffMs / 1000);
    if (sec < 60) return 'Vừa xong';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} phút trước`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} giờ trước`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day} ngày trước`;
    const week = Math.floor(day / 7);
    if (week < 4) return `${week} tuần trước`;
    const month = Math.floor(day / 30);
    if (month < 12) return `${month} tháng trước`;
    const year = Math.floor(day / 365);
    return `${year} năm trước`;
  }
}
