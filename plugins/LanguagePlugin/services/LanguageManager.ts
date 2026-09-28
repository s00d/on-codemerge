import type { EditorAPI } from '@on-codemerge/sdk';

const STORAGE_KEY = 'editor-language';

/**
 * UI helper for LanguagePlugin — persistence + switch.
 * Locale files and loading live in editor core (`src/i18n`), not here.
 */
export class LanguageManager {
  private editor: EditorAPI | null = null;

  public initialize(editor: EditorAPI): void {
    this.editor = editor;
  }

  public getLocales(): string[] {
    return this.editor?.listLocales() ?? ['en'];
  }

  public getCurrentLocale(): string {
    return this.editor?.getLocale() ?? 'en';
  }

  public async setLocale(locale: string): Promise<void> {
    if (!this.editor) {
      return;
    }
    await this.editor.setLocale(locale);
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* ignore quota / private mode */
    }
  }

  public async restoreSavedLocale(): Promise<void> {
    if (!this.editor) {
      return;
    }
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      return;
    }
    if (saved === null || saved === '' || saved === this.editor.getLocale()) {
      return;
    }
    if (!this.getLocales().includes(saved)) {
      return;
    }
    await this.setLocale(saved);
  }
}
