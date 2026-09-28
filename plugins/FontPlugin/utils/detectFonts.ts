import { canvas, renderDetached } from '@on-codemerge/sdk';
import { FONT_CANDIDATES, SYSTEM_FONT, cssStack } from '../constants';
import type { FontOption } from '../constants';

const TEST_STR = 'mmmmmmmmmmlliABCDEFGWij@#%';
const TEST_SIZE = '72px';
const BASELINES = ['monospace', 'sans-serif', 'serif'] as const;

let cache: FontOption[] | null = null;
let inflight: Promise<FontOption[]> | null = null;

function measureWidth(fontCss: string): number {
  const { el } = renderDetached(canvas());
  if (!(el instanceof HTMLCanvasElement)) {
    return 0;
  }
  const ctx = el.getContext('2d');
  if (!ctx) {
    return 0;
  }
  ctx.font = `${TEST_SIZE} ${fontCss}`;
  return ctx.measureText(TEST_STR).width;
}

/**
 * Detect whether a named font is installed by comparing text metrics
 * against generic fallbacks (no permission prompt).
 */
export function isLocalFontAvailable(fontName: string): boolean {
  if (typeof document === 'undefined') {
    return false;
  }
  const quoted = /\s/.test(fontName) ? `"${fontName}"` : fontName;
  for (const base of BASELINES) {
    const baseline = measureWidth(base);
    const mixed = measureWidth(`${quoted}, ${base}`);
    if (mixed !== baseline && baseline > 0) {
      return true;
    }
  }
  return false;
}

type LocalFontData = { family: string };

function windowHasLocalFonts(
  w: Window
): w is Window & { queryLocalFonts: () => Promise<LocalFontData[]> } {
  return 'queryLocalFonts' in w && typeof w.queryLocalFonts === 'function';
}

async function tryQueryLocalFonts(): Promise<FontOption[] | null> {
  if (!windowHasLocalFonts(window)) {
    return null;
  }

  // Only use if already granted — never pop a permission dialog from settings open.
  try {
    if (typeof navigator.permissions?.query !== 'function') {
      return null;
    }
    // @ts-expect-error — `local-fonts` not yet in lib.dom PermissionName
    const status = await navigator.permissions.query({ name: 'local-fonts' });
    if (status.state !== 'granted') {
      return null;
    }
  } catch {
    // Permissions API may not know local-fonts — skip silent query.
    return null;
  }

  try {
    const fonts = await window.queryLocalFonts();
    const seen = new Set<string>();
    const out: FontOption[] = [];
    for (const f of fonts) {
      const name = f.family?.trim();
      if (!name || seen.has(name.toLowerCase())) {
        continue;
      }
      seen.add(name.toLowerCase());
      const generic = guessGeneric(name);
      out.push({ id: cssStack(name, generic), label: name });
    }
    out.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
    return out;
  } catch {
    return null;
  }
}

function guessGeneric(name: string): 'sans-serif' | 'serif' | 'monospace' {
  const n = name.toLowerCase();
  if (/mono|console|courier|menlo|code|fixed/.test(n)) {
    return 'monospace';
  }
  if (/serif|times|georgia|garamond|palatino|baskerville|didot|roman/.test(n)) {
    return 'serif';
  }
  return 'sans-serif';
}

function probeCandidates(): FontOption[] {
  const found: FontOption[] = [];
  const seen = new Set<string>();
  for (const c of FONT_CANDIDATES) {
    const key = c.name.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    if (!isLocalFontAvailable(c.name)) {
      continue;
    }
    seen.add(key);
    found.push({ id: cssStack(c.name, c.generic), label: c.name });
  }
  found.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
  return found;
}

/**
 * Resolve fonts available on this machine.
 * 1) Local Font Access API — only if permission already granted
 * 2) else canvas metric probe of curated candidates
 * Always prepends System UI stack. Cached for the session.
 */
export function listAvailableFonts(): Promise<FontOption[]> {
  if (cache) {
    return Promise.resolve(cache);
  }
  if (inflight) {
    return inflight;
  }

  inflight = (async () => {
    const fromApi = await tryQueryLocalFonts();
    const detected = fromApi && fromApi.length > 0 ? fromApi : probeCandidates();
    const merged: FontOption[] = [SYSTEM_FONT];
    const seen = new Set(['system']);
    for (const f of detected) {
      const key = f.label.toLowerCase();
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      merged.push(f);
    }
    cache = merged;
    inflight = null;
    return merged;
  })();

  return inflight;
}

/** Sync snapshot — cached result, or quick probe / static fallback. */
export function getAvailableFontsSync(): FontOption[] {
  if (cache) {
    return cache;
  }
  if (typeof document === 'undefined') {
    return [SYSTEM_FONT];
  }
  return [SYSTEM_FONT, ...probeCandidates()];
}

export function clearFontCache(): void {
  cache = null;
  inflight = null;
}
