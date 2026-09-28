import { PopupController, h } from '@on-codemerge/sdk';
import type { DisposableScope, EditorAPI, ViewSpec } from '@on-codemerge/sdk';
import type { LanguageManager } from '../services/LanguageManager';

const LANGUAGE_NAMES: Record<string, string> = {
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

export class LanguageMenu {
  private readonly editor: EditorAPI;
  private readonly popups: PopupController;
  private readonly languageManager: LanguageManager;

  constructor(editor: EditorAPI, languageManager: LanguageManager, scope: DisposableScope) {
    this.editor = editor;
    this.languageManager = languageManager;
    this.popups = new PopupController((o) => editor.ui.popup.open(o), scope);
  }

  private languageList(): ViewSpec {
    const current = this.editor.getLocale();
    return h(
      'div',
      { class: 'language-list-container' },
      ...this.languageManager.getLocales().map((code) => {
        const active = code === current;
        return h(
          'button',
          {
            class: `language-option w-full text-left px-3 py-2 rounded-lg transition-colors ${
              active
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-transparent'
            }`,
            attrs: { type: 'button' },
            on: {
              click: () => {
                void this.languageManager.setLocale(code);
                this.popups.close();
              },
            },
          },
          h('div', { class: 'flex items-center justify-between' }, [
            h('span', { class: 'font-medium' }, LANGUAGE_NAMES[code] || code),
            h('span', { class: 'text-sm text-gray-500' }, code.toUpperCase()),
          ])
        );
      })
    );
  }

  show(): void {
    this.popups.open({
      title: this.editor.t('language.settings'),
      className: 'language-menu',
      closeOnClickOutside: true,
      items: [
        {
          type: 'view',
          id: 'language-list',
          view: () => this.languageList(),
        },
      ],
    });
  }
}
