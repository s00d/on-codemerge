import './style.scss';
import './public.scss';

import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
import { ShortcutManager } from './services/ShortcutManager';
import { ShortcutsMenu } from './components/ShortcutsMenu';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { shortcutsIcon } from '../../icons';

export class ShortcutsPlugin implements Plugin {
  name = 'shortcuts';
  private editor: HTMLEditor | null = null;
  private shortcutManager: ShortcutManager;
  private menu: ShortcutsMenu | null = null;
  private toolbarButton: HTMLElement | null = null;

  constructor() {
    this.shortcutManager = new ShortcutManager();
  }

  initialize(editor: HTMLEditor): void {
    this.editor = editor;
    this.menu = new ShortcutsMenu(editor);
    this.addToolbarButton();

    // Регистрируем шорткаты с задержкой для инициализации всех плагинов
    setTimeout(() => {
      this.setupShortcuts();
    }, 1000);
  }

  private addToolbarButton(): void {
    const toolbar = this.editor?.getToolbar();
    if (toolbar) {
      this.toolbarButton = createToolbarButton({
        icon: shortcutsIcon,
        title: this.editor?.t('Keyboard Shortcuts'),
        onClick: () => this.menu?.show(),
      });

      toolbar.appendChild(this.toolbarButton);
    }
  }

  private setupShortcuts(): void {
    const hotkeysList = this.editor?.getHotkeys();
    if (!hotkeysList) return;

    // Регистрируем шорткаты через новый ShortcutManager
    Object.entries(hotkeysList).forEach(([category, shortcuts]) => {
      shortcuts.forEach((shortcut) => {
        this.shortcutManager.register(
          shortcut.command,
          shortcut.keys,
          () => this.editor?.triggerEvent(shortcut.command),
          shortcut.description,
          category,
          shortcut.keysMac
        );
      });
    });

    // Обрабатываем события клавиатуры
    this.editor?.getContainer().addEventListener('keydown', (e) => {
      this.shortcutManager.handleKeyDown(e);
    });
  }

  public getShortcutManager(): ShortcutManager {
    return this.shortcutManager;
  }

  public destroy(): void {
    if (this.toolbarButton && this.toolbarButton.parentElement) {
      this.toolbarButton.parentElement.removeChild(this.toolbarButton);
    }

    this.editor?.getContainer().removeEventListener('keydown', (e) => {
      this.shortcutManager.handleKeyDown(e);
    });

    if (this.menu) {
      this.menu.destroy();
    }

    this.shortcutManager.clear();

    // Очищаем ссылки
    this.editor = null;
    this.menu = null;
    this.toolbarButton = null;
  }
}
