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
    this.menu = new ShortcutsMenu(editor);
    this.editor = editor;
    this.addToolbarButton();

    setTimeout(() => {
      this.setupShortcuts();
    }, 1000);
  }

  private addToolbarButton(): void {
    const toolbar = document.querySelector('.editor-toolbar');
    if (!toolbar) return;

    this.toolbarButton = createToolbarButton({
      icon: shortcutsIcon,
      title: this.editor?.t('Keyboard Shortcuts'),
      onClick: () => this.menu?.show(),
    });

    toolbar.appendChild(this.toolbarButton);
  }

  private setupShortcuts(): void {
    const hotkeysList = this.editor?.getHotkeys();

    if (!hotkeysList) return;

    // Register default shortcuts
    Object.entries(hotkeysList).map(([_category, shortcuts]) => {
      shortcuts.map((shortcut) => {
        this.shortcutManager.register(shortcut.keys, () =>
          this.editor?.triggerEvent(shortcut.command)
        );
        if (shortcut.keysMac) {
          this.shortcutManager.register(shortcut.keysMac, () =>
            this.editor?.triggerEvent(shortcut.command)
          );
        }
      });
    });
    // Handle keyboard events
    this.editor?.getContainer().addEventListener('keydown', (e) => {
      this.shortcutManager.handleKeyDown(e);
    });
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

    // Очищаем ссылки
    this.editor = null;
    this.menu = null;
    this.toolbarButton = null;
  }
}
