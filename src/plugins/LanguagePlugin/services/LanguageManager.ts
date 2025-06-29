import type { HTMLEditor } from '../../../core/HTMLEditor';
import { LocaleManager } from '../../../core/services/LocaleManager';

export class LanguageManager {
  private editor: HTMLEditor | null = null;

  public initialize(editor: HTMLEditor): void {
    this.editor = editor;
  }

  public getLocales(): string[] {
    return new LocaleManager().getAvailableLocales();
  }

  public getCurrentLocale(): string {
    return this.editor?.getLocale() || 'en';
  }

  public async setLocale(locale: string): Promise<void> {
    if (!this.editor) return;
    await this.editor.setLocale(locale);
    localStorage.setItem('editor-language', locale);
  }
}
