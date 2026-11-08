import type { Translations } from '@i18n-micro/runtime';
import { loadLocaleFromGlob } from './wirePluginLocales';

/**
 * Lazy locale chunks — exclude `en.json` (statically imported in Editor.ts).
 * Including it here makes Vite warn INEFFECTIVE_DYNAMIC_IMPORT and keeps en in the main chunk anyway.
 */
const modules = import.meta.glob<{ default: Translations }>([
  './locales/*.json',
  '!./locales/en.json',
]);

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
export function loadLocale(locale: string): Promise<Translations | null> {
  return loadLocaleFromGlob(modules, locale);
}
