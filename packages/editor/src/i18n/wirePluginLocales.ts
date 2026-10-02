import type { EditorAPI, LocaleMessages } from '@codemerge/sdk';

type LocaleModuleMap = Record<string, () => Promise<{ default: LocaleMessages }>>;

/** Load a non-en locale JSON from a Vite `import.meta.glob` map (paths like `./locales/ru.json`). */
export async function loadLocaleFromGlob(
  modules: LocaleModuleMap,
  locale: string,
  pathPrefix = './locales'
): Promise<LocaleMessages | null> {
  if (locale === 'en') {
    return null;
  }
  const load = modules[`${pathPrefix}/${locale}.json`];
  if (load === undefined) {
    return null;
  }
  const mod = await load();
  return mod.default;
}

/**
 * Merge plugin `en` immediately; lazy-load other locales via `registerLocaleOverlay`
 * (awaited by `setLocale`). Returns unsubscribe.
 */
export function wirePluginLocales(
  editor: Pick<EditorAPI, 'registerLocale' | 'registerLocaleOverlay'>,
  en: LocaleMessages,
  modules: LocaleModuleMap,
  pathPrefix = './locales'
): () => void {
  editor.registerLocale('en', en);
  return editor.registerLocaleOverlay(async (code) => {
    const dict = await loadLocaleFromGlob(modules, code, pathPrefix);
    if (dict) {
      editor.registerLocale(code, dict);
    }
  });
}
