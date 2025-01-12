import { PopupManager } from '../../../core/ui/PopupManager';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';
import {
  createContainer,
  createHr,
  createKbd,
  createLi,
  createSpan,
  createUl,
} from '../../../utils/helpers.ts';

export class ShortcutsMenu {
  private popup: PopupManager | null = null;
  private editor: HTMLEditor;
  private container: HTMLDivElement | null = null;

  constructor(editor: HTMLEditor) {
    this.editor = editor;
  }

  initialize(editor: HTMLEditor): void {
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
    this.container?.remove();

    this.container = createContainer('p-4');

    // Поле для фильтрации
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search by category or shortcut...';
    searchInput.className =
      'w-full p-2 mb-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500';
    this.container.appendChild(searchInput);

    const grid = createContainer('shortcuts-grid');
    this.container.appendChild(grid);

    // Инициализация данных
    const hotkeysList = this.editor?.getHotkeys();

    // Отрисовка списка
    const renderList = (filterTerm: string = '') => {
      grid.innerHTML = ''; // Очищаем контейнер перед отрисовкой

      if (hotkeysList) {
        Object.entries(hotkeysList).forEach(([category, shortcuts]) => {
          // Фильтрация шорткатов в категории
          const filteredShortcuts = shortcuts.filter((shortcut) => {
            const matchesCategory = category.toLowerCase().includes(filterTerm);
            const matchesDescription = shortcut.description.toLowerCase().includes(filterTerm);
            const matchesKeys = this.formatShortcut(shortcut.keys)
              .toLowerCase()
              .includes(filterTerm);
            return matchesCategory || matchesDescription || matchesKeys;
          });

          // Если есть отфильтрованные шорткаты, отрисовываем категорию
          if (filteredShortcuts.length > 0) {
            const categoryContainer = this.renderCategory(category, filteredShortcuts);
            grid.appendChild(categoryContainer);
          }
        });
      }
    };

    // Первоначальная отрисовка
    renderList();

    // Обработчик поиска
    searchInput.addEventListener('input', (event) => {
      const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
      renderList(searchTerm); // Отрисовываем отфильтрованный список
    });

    return this.container;
  }

  // Метод для отображения категории
  private renderCategory(category: string, shortcuts: any[]): HTMLElement {
    const categoryContainer = createContainer();

    // Заголовок категории
    const categoryTitle = createSpan('shortcuts-category', category);

    // Список шорткатов
    const shortcutsList = createUl('shortcuts-group');

    shortcuts.forEach((shortcut) => {
      const shortcutItem = this.renderShortcut(shortcut);
      shortcutsList.appendChild(shortcutItem);
    });

    // Сборка категории
    categoryContainer.appendChild(categoryTitle);
    categoryContainer.appendChild(shortcutsList);
    categoryContainer.appendChild(createHr());

    return categoryContainer;
  }

  // Метод для отображения шортката
  private renderShortcut(shortcut: any): HTMLElement {
    const shortcutItem = createLi('shortcut');

    const icon = createSpan('shortcut-icon', shortcut.icon);
    const description = createSpan('shortcut-description', shortcut.description);
    const keys = createKbd('shortcut-key', this.formatShortcut(shortcut.keys));

    // Сборка элемента
    shortcutItem.appendChild(icon);
    shortcutItem.appendChild(description);
    shortcutItem.appendChild(keys);

    return shortcutItem;
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
    this.initialize(this.editor);
    this.popup?.show();
  }

  public destroy(): void {
    if (this.popup) {
      this.popup.destroy(); // Закрываем и очищаем всплывающее окно
      this.popup = null!; // Очищаем ссылку
    }
    this.container?.remove();
  }
}
