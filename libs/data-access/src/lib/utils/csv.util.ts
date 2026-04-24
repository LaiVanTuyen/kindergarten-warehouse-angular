/**
 * Simple client-side CSV exporter for admin pages. Preserves Vietnamese
 * characters by prepending a UTF-8 BOM so Excel auto-detects the charset.
 *
 * Usage:
 *   downloadCsv('audit-logs.csv', logs.map(l => ({
 *     'Thời gian': l.timestamp,
 *     'Người dùng': l.username,
 *     ...
 *   })));
 */
export function downloadCsv(
  filename: string,
  rows: ReadonlyArray<Record<string, unknown>>
): void {
  if (!rows.length) return;

  const keys = Object.keys(rows[0]);
  const escape = (v: unknown): string => {
    if (v == null) return '';
    const s = typeof v === 'string' ? v : String(v);
    return /["\n\r,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lines = [
    keys.map(escape).join(','),
    ...rows.map((row) => keys.map((k) => escape(row[k])).join(',')),
  ];

  const blob = new Blob(['﻿' + lines.join('\r\n')], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Give the browser a tick to start the download before freeing the blob URL.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
