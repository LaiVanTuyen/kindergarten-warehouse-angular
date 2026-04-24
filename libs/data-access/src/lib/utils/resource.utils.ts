/**
 * Trả về Tailwind CSS class cho badge loại tài nguyên.
 * Dựa trên giá trị fileType enum từ Resource model:
 * VIDEO | DOCUMENT | EXCEL | PDF | POWERPOINT | IMAGE | OTHER
 * Và resourceType đặc biệt: YOUTUBE
 */
export function getResourceBadgeClass(type: string | undefined): string {
  switch (type) {
    case 'YOUTUBE':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'VIDEO':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'PDF':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'DOCUMENT':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'EXCEL':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'POWERPOINT':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'IMAGE':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}
