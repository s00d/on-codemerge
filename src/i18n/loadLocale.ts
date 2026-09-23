import type { Translations } from '@i18n-micro/runtime';

/**
 * Lazy locale chunks (everything except bundled `en.json`).
 * Vite splits each JSON into its own async chunk.
 */
const modules = import.meta.glob<{ default: Translations }>('./locales/*.json');

function localeFromPath(path: string): string | null {
  const match = /\/([a-z]{2}(?:-[A-Za-z]+)?)\.json$/.exec(path);
  return match?.[1] ?? null;
}

/** Locales shipped with the editor (`en` + lazy JSON next to it). */
export function listLocales(): string[] {
  const codes = new Set<string>(['en']);
  for (const path of Object.keys(modules)) {
    const code = localeFromPath(path);
    if (code) {
      codes.add(code);
    }
  }
  return [...codes].toSorted((a, b) => a.localeCompare(b));
}

/** Load a non-en locale tree. Returns null for unknown codes or `en` (already bundled). */
export async function loadLocale(locale: string): Promise<Translations | null> {
  if (locale === 'en') {
    return null;
  }
  const path = `./locales/${locale}.json`;
  const load = modules[path];
  if (load === undefined) {
    return null;
  }
  const mod = await load();
  return mod.default;
}
