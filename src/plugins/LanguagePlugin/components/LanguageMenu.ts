import { PopupManager } from '../../../core/ui/PopupManager';
import type { HTMLEditor } from '../../../core/HTMLEditor';
import type { LanguageManager } from '../services/LanguageManager';

export class LanguageMenu {
  private popup: PopupManager;
  private editor: HTMLEditor;
  private languageManager: LanguageManager;

  constructor(editor: HTMLEditor, languageManager: LanguageManager) {
    this.editor = editor;
    this.languageManager = languageManager;
    this.popup = this.createPopup();
  }

  private createPopup(): PopupManager {
    return new PopupManager(this.editor, {
      title: this.editor.t('Language Settings'),
      className: 'language-menu',
      closeOnClickOutside: true,
      items: [
        {
          type: 'custom',
          id: 'language-list',
          content: () => this.createLanguageList(),
        },
      ],
    });
  }

  private createLanguageList(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'language-list-container';

    const locales = this.languageManager.getLocales();
    const currentLocale = this.editor.getLocale();

    locales.forEach((code) => {
      const button = document.createElement('button');
      button.className = `language-option w-full text-left px-3 py-2 rounded-lg transition-colors ${
        code === currentLocale
          ? 'bg-blue-100 text-blue-700 border border-blue-300'
          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-transparent'
      }`;

      const languageName = this.getLanguageName(code);
      const languageCode = code.toUpperCase();

      button.innerHTML = `
        <div class="flex items-center justify-between">
          <span class="font-medium">${languageName}</span>
          <span class="text-sm text-gray-500">${languageCode}</span>
        </div>
      `;

      button.addEventListener('click', () => {
        this.languageManager.setLocale(code);
        this.popup.hide();
      });

      container.appendChild(button);
    });

    return container;
  }

  private getLanguageName(code: string): string {
    const names: Record<string, string> = {
      en: 'English',
      ru: 'Русский',
      de: 'Deutsch',
      fr: 'Français',
      es: 'Español',
      it: 'Italiano',
      pt: 'Português',
      pl: 'Polski',
      cs: 'Čeština',
      nl: 'Nederlands',
      tr: 'Türkçe',
      ja: '日本語',
      ko: '한국어',
      zh: '中文',
      ar: 'العربية',
      hi: 'हिन्दी',
      vi: 'Tiếng Việt',
      th: 'ไทย',
      id: 'Bahasa Indonesia',
    };
    return names[code] || code;
  }

  public show(): void {
    this.popup.rerender([
      {
        type: 'custom',
        id: 'language-list',
        content: () => this.createLanguageList(),
      },
    ]);
    this.popup.show();
  }

  public destroy(): void {
    this.popup.destroy();
  }
}
