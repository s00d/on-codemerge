import { PopupManager } from '../../../core/ui/PopupManager';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';
import {
  createContainer,
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
      title: this.editor.t('Keyboard Shortcuts'),
      className: 'shortcuts-menu',
      closeOnClickOutside: true,
      items: [
        {
          type: 'custom',
          id: 'shortcuts-search',
          content: () => this.createSearchSection(),
        },
        {
          type: 'custom',
          id: 'shortcuts-content',
          content: () => this.createContentSection(),
        },
      ],
    });
  }
  private createSearchSection(): HTMLElement {
    const searchSection = createContainer('shortcuts-search');

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = this.editor.t('Search shortcuts...');
    searchInput.className = 'shortcuts-search-input';

    const searchIcon = createSpan('search-icon', '🔍');
    searchSection.appendChild(searchIcon);
    searchSection.appendChild(searchInput);

    // Обработчик поиска
    searchInput.addEventListener('input', (event) => {
      const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
      this.filterShortcuts(searchTerm);
    });

    return searchSection;
  }

  private createContentSection(): HTMLElement {
    const contentSection = createContainer('shortcuts-content');

    // Создаем контейнер для отображения шорткатов
    const shortcutsGrid = createContainer('shortcuts-grid');
    contentSection.appendChild(shortcutsGrid);

    // Первоначальная отрисовка
    this.renderShortcuts(shortcutsGrid);

    return contentSection;
  }

  private renderShortcuts(container: HTMLElement): void {
    container.innerHTML = '';

    const hotkeysList = this.editor?.getHotkeys();
    if (!hotkeysList) return;

    // Показываем все шорткаты
    this.renderAllShortcuts(container, hotkeysList);
  }

  private renderAllShortcuts(container: HTMLElement, hotkeysList: any): void {
    Object.entries(hotkeysList).forEach(([category, shortcuts]) => {
      const categoryContainer = this.renderCategory(category, shortcuts as any[]);
      container.appendChild(categoryContainer);
    });
  }

  private renderCategory(category: string, shortcuts: any[]): HTMLElement {
    const categoryContainer = createContainer('shortcuts-category');

    const categoryHeader = createContainer('category-header');
    const categoryTitle = createSpan('category-title', category);
    const shortcutsCount = createSpan('shortcuts-count', `(${shortcuts.length})`);

    categoryHeader.appendChild(categoryTitle);
    categoryHeader.appendChild(shortcutsCount);
    categoryContainer.appendChild(categoryHeader);

    const shortcutsList = createUl('shortcuts-list');

    shortcuts.forEach((shortcut) => {
      const shortcutItem = this.renderShortcut(shortcut);
      shortcutsList.appendChild(shortcutItem);
    });

    categoryContainer.appendChild(shortcutsList);
    return categoryContainer;
  }

  private renderShortcut(shortcut: any): HTMLElement {
    const shortcutItem = createLi('shortcut-item');

    const shortcutInfo = createContainer('shortcut-info');
    const icon = createSpan('shortcut-icon', shortcut.icon || '⌨️');
    const description = createSpan('shortcut-description', shortcut.description);

    shortcutInfo.appendChild(icon);
    shortcutInfo.appendChild(description);

    const shortcutKeys = createContainer('shortcut-keys');
    const keys = createKbd('shortcut-key', this.formatShortcut(shortcut.keys));
    shortcutKeys.appendChild(keys);

    shortcutItem.appendChild(shortcutInfo);
    shortcutItem.appendChild(shortcutKeys);

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

  private filterShortcuts(searchTerm: string): void {
    const shortcutsGrid = this.container?.querySelector('.shortcuts-grid');
    if (!shortcutsGrid) return;

    const shortcutItems = shortcutsGrid.querySelectorAll('.shortcut-item');

    shortcutItems.forEach((item) => {
      const description =
        item.querySelector('.shortcut-description')?.textContent?.toLowerCase() || '';
      const keys = item.querySelector('.shortcut-key')?.textContent?.toLowerCase() || '';

      const matches = description.includes(searchTerm) || keys.includes(searchTerm);

      if (matches) {
        (item as HTMLElement).style.display = 'flex';
      } else {
        (item as HTMLElement).style.display = 'none';
      }
    });
  }

  public show(): void {
    this.initialize(this.editor);

    // Показываем попап в центре экрана
    if (this.popup) {
      this.popup.show();

      // Принудительно центрируем попап и устанавливаем размеры
      const popupElement = document.querySelector('.shortcuts-menu') as HTMLElement;
      if (popupElement) {
        popupElement.style.position = 'fixed';
        popupElement.style.top = '50%';
        popupElement.style.left = '50%';
        popupElement.style.transform = 'translate(-50%, -50%)';
        popupElement.style.zIndex = '9999';
        popupElement.style.maxHeight = '90vh';
        popupElement.style.overflowY = 'auto';
      }
    }
  }

  public destroy(): void {
    if (this.popup) {
      this.popup.destroy();
      this.popup = null;
    }
    this.container?.remove();
  }
}
