/**
 * Central icon path registry. All SVG paths used by IconButton and other
 * components should be added here so updates happen in one place.
 *
 * Keep paths in their raw form (no fills/strokes) — `app-icon-button` applies
 * `fill="none" stroke="currentColor"`.
 */
export const ICONS = {
  pencil:
    'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  trash:
    'M19 7l-1 13a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7m5 4v6m4-6v6M10 4V2h4v2m-9 3h14',
  eye: 'M15 12a3 3 0 11-6 0 3 3 0 016 0zm-3-7c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7C3.732 7.943 7.522 5 12 5z',
  eyeOff:
    'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029M3 3l18 18',
  check: 'M5 13l4 4L19 7',
  checkBold: 'M20 6L9 17l-5-5',
  close: 'M6 18L18 6M6 6l12 12',
  plus: 'M12 4v16m8-8H4',
  search: 'M21 21l-4.35-4.35 M11 11a8 8 0 1 1 0-16 8 8 0 0 1 0 16z',
  lock: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  unlock:
    'M8 11V7a4 4 0 118 0v4m-9 0h10a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6a2 2 0 012-2z',
  refresh:
    'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  key: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
  arrowUp: 'M5 15l7-7 7 7',
  arrowDown: 'M19 9l-7 7-7-7',
  arrowRight: 'M9 5l7 7-7 7',
  download:
    'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-5l-4 4m0 0l-4-4m4 4V4',
  externalLink:
    'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14',
  dragHandle: 'M8 6h.01M8 12h.01M8 18h.01M16 6h.01M16 12h.01M16 18h.01',
  sortAsc: 'M3 4h13M3 8h9M3 12h5M17 8l4-4m0 0l4 4m-4-4v16',
} as const;

export type IconName = keyof typeof ICONS;
