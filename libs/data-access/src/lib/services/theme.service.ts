import { Injectable, signal, effect, computed } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Centralised light/dark theme control for both apps.
 *
 * - Persists the user's explicit choice in localStorage (`kw-theme`).
 * - `system` follows the OS `prefers-color-scheme` and reacts to changes.
 * - Toggles the `.dark` class on <html>, which drives the CSS design tokens
 *   (libs/theme/tokens.css) and Tailwind's `dark:` variants.
 *
 * Inject once near app startup (e.g. in the root AppComponent) so the saved
 * preference is applied before first paint of feature content.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'kw-theme';

  /** The user's chosen mode (light | dark | system). */
  readonly mode = signal<ThemeMode>(this.readStored());

  /** The effective theme actually applied (light | dark). */
  readonly resolved = computed<'light' | 'dark'>(() => {
    const mode = this.mode();
    if (mode === 'system') return this.systemPrefersDark() ? 'dark' : 'light';
    return mode;
  });

  private mediaQuery?: MediaQueryList;

  constructor() {
    // React to OS changes while in `system` mode.
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQuery.addEventListener('change', () => {
        if (this.mode() === 'system') this.apply();
      });
    }
    // Apply on construction and whenever `mode` changes.
    effect(() => {
      // touch resolved() so the effect re-runs on system changes too
      this.resolved();
      this.apply();
    });
  }

  /** Set an explicit mode and persist it. */
  set(mode: ThemeMode): void {
    this.mode.set(mode);
    try {
      localStorage.setItem(this.storageKey, mode);
    } catch {
      /* storage unavailable — ignore */
    }
  }

  /** Convenience toggle between light and dark (collapses `system`). */
  toggle(): void {
    this.set(this.resolved() === 'dark' ? 'light' : 'dark');
  }

  // --- internals --------------------------------------------------------

  private apply(): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.toggle('dark', this.resolved() === 'dark');
    root.style.colorScheme = this.resolved();
  }

  private systemPrefersDark(): boolean {
    return !!this.mediaQuery?.matches;
  }

  private readStored(): ThemeMode {
    try {
      const v = localStorage.getItem(this.storageKey);
      if (v === 'light' || v === 'dark' || v === 'system') return v;
    } catch {
      /* ignore */
    }
    return 'system';
  }
}
