import { PopupManager } from '../../../core/ui/PopupManager';
import { SHORTCUTS } from '../constants';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';

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
    const container = document.createElement('div');
    container.className = 'p-4';

    // Сетка для категорий
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-2 gap-8';

    // Создаем элементы для каждой категории
    Object.entries(SHORTCUTS).forEach(([category, shortcuts]) => {
      const categoryContainer = document.createElement('div');

      // Заголовок категории
      const categoryTitle = document.createElement('h3');
      categoryTitle.className = 'text-sm font-medium text-gray-900 mb-3';
      categoryTitle.textContent = category;

      // Список шорткатов
      const shortcutsList = document.createElement('ul');
      shortcutsList.className = 'space-y-2';

      shortcuts.forEach((shortcut) => {
        const shortcutItem = document.createElement('li');
        shortcutItem.className = 'flex items-center justify-between text-sm';

        // Описание шортката
        const description = document.createElement('span');
        description.className = 'text-gray-600';
        description.textContent = shortcut.description;

        // Клавиши шортката
        const keys = document.createElement('kbd');
        keys.className = 'px-2 py-1 bg-gray-100 rounded text-gray-800 font-mono text-xs';
        keys.textContent = this.formatShortcut(shortcut.keys);

        // Сборка элемента
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
