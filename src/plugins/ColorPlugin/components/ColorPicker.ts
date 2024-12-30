import { PopupManager, type PopupItem } from '../../../core/ui/PopupManager';
import { COLORS, RECENT_COLORS_KEY } from '../constants';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';

export class ColorPicker {
  private editor: HTMLEditor;
  private popup: PopupManager;
  private recentColors: string[] = [];
  private onSelect: ((color: string) => void) | null = null;
  private color = '';

  constructor(editor: HTMLEditor, title: string) {
    this.editor = editor;
    this.popup = new PopupManager(editor, {
      title,
      className: 'color-picker',
      closeOnClickOutside: true,
      items: this.createPopupItems(), // Динамически создаем элементы
      buttons: [
        {
          label: 'Apply',
          variant: 'primary',
          onClick: () => this.selectColor(this.color),
        },
      ],
    });

    this.loadRecentColors();
    this.setupEventListeners();
  }

  private createPopupItems(): PopupItem[] {
    const items: PopupItem[] = [];

    // Recent Colors
    if (this.recentColors.length > 0) {
      items.push({
        type: 'custom',
        id: 'recent-colors',
        content: () => this.createColorGrid(this.editor.t('Recent Colors'), this.recentColors),
      });
    }

    // Default Colors
    items.push({
      type: 'custom',
      id: 'default-colors',
      content: () => this.createColorGrid(this.editor.t('Default Colors'), COLORS),
    });

    // Custom Color
    items.push({
      type: 'color',
      id: 'custom-color',
      onChange: (color) => {
        this.color = color.toString();
      },
    });

    return items;
  }

  private createColorGrid(title: string, colors: string[]): HTMLElement {
    const container = document.createElement('div');

    // Заголовок
    const titleElement = document.createElement('h3');
    titleElement.className = 'text-sm font-medium text-gray-700 mb-2';
    titleElement.textContent = title;

    // Сетка цветов
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-8 gap-2';

    // Кнопки для цветов
    colors.forEach((color) => {
      const button = this.createColorButton(color);
      grid.appendChild(button);
    });

    // Сборка структуры
    container.appendChild(titleElement);
    container.appendChild(grid);

    return container;
  }

  private createColorButton(color: string): HTMLElement {
    const button = document.createElement('button');
    button.className =
      'color-button w-8 h-8 rounded-lg border border-gray-200 overflow-hidden relative group';
    button.dataset.color = color;
    button.title = color;

    // Цвет фона
    const colorBackground = document.createElement('div');
    colorBackground.className = 'absolute inset-0';
    colorBackground.style.backgroundColor = color;

    // Эффект при наведении
    const hoverEffect = document.createElement('div');
    hoverEffect.className =
      'absolute inset-0 opacity-0 group-hover:opacity-10 bg-black transition-opacity';

    // Белая рамка для белого цвета
    if (color.toLowerCase() === '#ffffff') {
      const whiteBorder = document.createElement('div');
      whiteBorder.className = 'absolute inset-0 border border-gray-200 rounded-lg';
      button.appendChild(whiteBorder);
    }

    button.appendChild(colorBackground);
    button.appendChild(hoverEffect);

    return button;
  }

  private setupEventListeners(): void {
    const popupElement = this.popup.getElement();
    popupElement.addEventListener('click', this.handleColorButtonClick);
  }

  private handleColorButtonClick = (e: Event): void => {
    const button = (e.target as Element).closest('.color-button');
    if (button instanceof HTMLElement) {
      const color = button.dataset.color;
      if (color) {
        this.color = color;
        this.popup.setValue('custom-color', color);
      }
    }
  };

  private selectColor(color: string): void {
    // Add to recent colors if not already present
    if (!this.recentColors.includes(color)) {
      this.recentColors.unshift(color);
      if (this.recentColors.length > 8) {
        this.recentColors.pop();
      }
      localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(this.recentColors));
    }

    // Notify callback and close
    if (this.onSelect) {
      this.onSelect(color);
      this.popup.hide();
    }
  }

  private loadRecentColors(): void {
    try {
      const stored = localStorage.getItem(RECENT_COLORS_KEY);
      if (stored) {
        this.recentColors = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load recent colors:', error);
      this.recentColors = [];
    }
  }

  public show(onSelect: (color: string) => void): void {
    this.onSelect = onSelect;
    this.popup.show();
  }

  public destroy(): void {
    // Удаляем обработчики событий
    const popupElement = this.popup.getElement();
    if (popupElement) {
      popupElement.removeEventListener('click', this.handleColorButtonClick);
    }

    // Уничтожаем всплывающее окно
    this.popup.destroy();

    // Очищаем ссылки
    this.editor = null!;
    this.popup = null!;
    this.recentColors = [];
    this.onSelect = null;
    this.color = '';
  }
}