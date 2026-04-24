import { WritableSignal, effect, untracked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

type PrimitiveValue = string | number | boolean;

interface UrlSyncConfig {
  fields: Record<string, WritableSignal<PrimitiveValue>>;
  /** Values that should NOT write to the URL (treated as "default"). */
  skipValues?: unknown[];
  /** Optional value transform per field when reading from URL. */
  read?: Record<string, (raw: string) => PrimitiveValue>;
  router: Router;
  route: ActivatedRoute;
  /** Debounce URL updates to avoid navigation spam while typing. Default 150ms. */
  debounceMs?: number;
}

/**
 * Two-way bind a set of writable signals with query-string params so that
 * refreshing the page preserves filter state.
 *
 * - On setup, hydrate signals from current URL.
 * - When any field changes, schedule a URL replace (queryParamsHandling: merge)
 *   after a short debounce, omitting signals whose value matches `skipValues`.
 *
 * Must be called inside an injection context (constructor).
 */
export function setupUrlSync(cfg: UrlSyncConfig): void {
  const skip = new Set(cfg.skipValues ?? ['', null, undefined, 'ALL']);
  const debounceMs = cfg.debounceMs ?? 150;

  // 1) Hydrate signals from snapshot exactly once.
  const params = cfg.route.snapshot.queryParamMap;
  for (const [key, sig] of Object.entries(cfg.fields)) {
    const raw = params.get(key);
    if (raw === null) continue;
    const parse = cfg.read?.[key];
    try {
      sig.set(parse ? parse(raw) : (raw as PrimitiveValue));
    } catch {
      /* ignore invalid URL values */
    }
  }

  // 2) Reflect changes back to the URL with a small debounce. The timer is
  //    cancelled on each new change so rapid edits (e.g. search-as-you-type)
  //    produce a single navigation after the user pauses.
  let timer: ReturnType<typeof setTimeout> | null = null;
  effect(() => {
    const snapshot: Record<string, PrimitiveValue | null> = {};
    for (const [key, sig] of Object.entries(cfg.fields)) {
      const v = sig();
      snapshot[key] = skip.has(v) ? null : v;
    }
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      untracked(() => {
        cfg.router.navigate([], {
          relativeTo: cfg.route,
          queryParams: snapshot,
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      });
    }, debounceMs);
  });
}
