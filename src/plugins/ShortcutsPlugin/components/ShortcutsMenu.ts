import { PopupManager } from '../../../core/ui/PopupManager';
import { SHORTCUTS } from '../constants';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';
import {
  createContainer,
  createH,
  createKbd,
  createLi,
  createSpan,
  createUl,
} from '../../../utils/helpers.ts';

export class ShortcutsMenu {
  private popup: PopupManager;

  constructor(editor: HTMLEditor) {
    this.popup = new PopupManager(editor, {
      title: editor.t('Keyboard Shortcuts'),
      className: 'shortcuts-menu',
      closeOnClickOutside: true,
      items: [
        {
          type: 'custom',
          id: 'shortcuts-content',
          content: () => this.createContent(),
        },
      ],
    });
  }

  private createContent(): HTMLElement {
    // Основной контейнер
    const container = createContainer('p-4');
    const grid = createContainer('grid grid-cols-2 gap-8');

    // Создаем элементы для каждой категории
    Object.entries(SHORTCUTS).forEach(([category, shortcuts]) => {
      const categoryContainer = createContainer();

      // Заголовок категории
      const categoryTitle = createH('h3', 'text-sm font-medium text-gray-900 mb-3', category);

      // Список шорткатов
      const shortcutsList = createUl('space-y-2');

      shortcuts.forEach((shortcut) => {
        const shortcutItem = createLi('flex items-center justify-between text-sm');

        const icon = createSpan('text-gray-600', shortcut.icon);
        const description = createSpan('text-gray-600', shortcut.description);
        const keys = createKbd(
          'px-2 py-1 bg-gray-100 rounded text-gray-800 font-mono text-xs',
          this.formatShortcut(shortcut.keys)
        );

        // Сборка элемента
        shortcutItem.appendChild(icon);
        shortcutItem.appendChild(description);
        shortcutItem.appendChild(keys);
        shortcutsList.appendChild(shortcutItem);
      });

      // Сборка категории
      categoryContainer.appendChild(categoryTitle);
      categoryContainer.appendChild(shortcutsList);
      grid.appendChild(categoryContainer);
    });

    // Сборка структуры
    container.appendChild(grid);

    return container;
  }

  private formatShortcut(keys: string): string {
    return keys
      .replace('Ctrl', '⌃')
      .replace('Shift', '⇧')
      .replace('Alt', '⌥')
      .replace('Enter', '↵')
      .replace('Backspace', '⌫')
      .replace('Delete', '⌦')
      .replace('ArrowUp', '↑')
      .replace('ArrowDown', '↓')
      .replace('ArrowLeft', '←')
      .replace('ArrowRight', '→');
  }

  public show(): void {
    this.popup.show();
  }

  public destroy(): void {
    if (this.popup) {
      this.popup.destroy(); // Закрываем и очищаем всплывающее окно
      this.popup = null!; // Очищаем ссылку
    }
  }
}
