import './style.scss';
import './public.scss';

import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
import { LanguageManager } from './services/LanguageManager';
import { LanguageMenu } from './components/LanguageMenu';
import { globeIcon } from '../../icons';
import { LocaleManager } from '../../core/services/LocaleManager';

export class LanguagePlugin implements Plugin {
  name = 'language';
  private editor: HTMLEditor | null = null;
  private languageManager: LanguageManager;
  private menu: LanguageMenu | null = null;
  private toolbarButton: HTMLElement | null = null;

  constructor() {
    this.languageManager = new LanguageManager();
  }

  initialize(editor: HTMLEditor): void {
    this.editor = editor;
    this.menu = new LanguageMenu(editor, this.languageManager);
    this.addToolbarButton();
    this.setupLanguageManager();
  }

  private addToolbarButton(): void {
    const toolbar = this.editor?.getToolbar();
    if (!toolbar) return;

    this.toolbarButton = document.createElement('div');
    this.toolbarButton.className = 'language-indicator flex items-center gap-2 py-1 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors';
    this.toolbarButton.title = this.editor?.t('Current locale - Click to change') || 'Current locale - Click to change';

    this.updateLanguageIndicator();

    this.toolbarButton.addEventListener('click', () => {
      this.menu?.show();
      // Восстановить выбранный язык
      this.updateLanguageIndicator();
    });

    toolbar.appendChild(this.toolbarButton);
  }

  private updateLanguageIndicator(): void {
    if (!this.toolbarButton) return;

    const locale = this.editor?.getLocale() || 'en';
    const label = LocaleManager.getLocaleLabel(locale);

    this.toolbarButton.innerHTML = `
      <span class="language-icon">${globeIcon}</span>
      <span class="language-label">${label}</span>
    `;
  }

  private setupLanguageManager(): void {
    if (!this.editor) return;
    this.languageManager.initialize(this.editor);
    const savedLanguage = localStorage.getItem('editor-language');
    if (savedLanguage) {
      this.editor.setLocale(savedLanguage).catch(console.error);
    }
    // Подписка на смену языка для обновления кнопки
    const updateButton = () => {
      this.updateLanguageIndicator();
    };
    // Переопределим setLocale чтобы обновлять кнопку
    const origSetLocale = this.editor.setLocale.bind(this.editor);
    this.editor.setLocale = async (locale: string) => {
      await origSetLocale(locale);
      updateButton();
    };
  }

  public getLanguageManager(): LanguageManager {
    return this.languageManager;
  }

  public destroy(): void {
    if (this.toolbarButton && this.toolbarButton.parentElement) {
      this.toolbarButton.parentElement.removeChild(this.toolbarButton);
    }
    if (this.menu) {
      this.menu.destroy();
    }
    this.editor = null;
    this.menu = null;
    this.toolbarButton = null;
  }
}
