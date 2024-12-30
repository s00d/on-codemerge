import type { HTMLEditor } from '../HTMLEditor.ts';

type DisabledFn = () => boolean;

interface MenuButton {
  label?: string; // Название кнопки (опционально для кастомных элементов)
  title?: string; // Название кнопки (опционально для кастомных элементов)
  icon?: string; // Иконка кнопки (HTML или SVG, опционально)
  iconPosition?: 'left' | 'right'; // Позиция иконки (слева или справа)
  action?: string; // Действие кнопки (например, "edit", "remove", опционально)
  onClick?: (activeElement: HTMLElement | null) => any; // Обработчик события при клике (опционально)
  disabled?: boolean | DisabledFn; // Отключена ли кнопка
  hotkey?: string; // Горячая клавиша (например, "Ctrl+S")
  checked?: boolean; // Для чекбоксов и радиокнопок
  type?: 'button' | 'checkbox' | 'radio' | 'custom' | 'divider'; // Тип элемента (кнопка, чекбокс, радиокнопка, кастомный)
  className?: string; // Кастомный CSS-класс для кнопки
  closeOnClick?: boolean; // Закрывать ли меню после клика (по умолчанию true)
  subMenu?: MenuButton[]; // Вложенное меню (опционально)
  customHTML?: string; // Кастомный HTML (для type: 'custom')
}

interface ContextMenuOptions {
  orientation?: 'vertical' | 'horizontal'; // Ориентация меню
}

export class ContextMenu {
  private menu: HTMLElement;
  private editor: HTMLEditor;
  private activeElement: HTMLElement | null = null;
  private subMenus: ContextMenu[] = []; // Для управления вложенными меню
  private orientation: 'vertical' | 'horizontal';
  private buttons: MenuButton[] = [];

  constructor(editor: HTMLEditor, buttons: MenuButton[], options: ContextMenuOptions = {}) {
    this.orientation = options.orientation || 'vertical';
    this.buttons = buttons;
    this.editor = editor;
    this.menu = this.createMenu();
    editor.getInnerContainer().appendChild(this.menu);
    this.setupEventListeners();
  }

  private createMenu(): HTMLElement {
    const menu = document.createElement('div');
    menu.className = `context-menu ${this.orientation === 'horizontal' ? 'horizontal' : ''}`;

    this.buttons.forEach((button) => {
      if (button.type === 'divider') {
        // Добавляем разделитель
        const divider = document.createElement('div');
        divider.className = 'menu-divider';
        menu.appendChild(divider);
      } else if (button.type === 'custom' && button.customHTML) {
        // Добавляем кастомный HTML
        const customElement = document.createElement('div');
        customElement.innerHTML = button.customHTML;
        menu.appendChild(customElement);
      } else {
        // Создаем элемент (кнопка, чекбокс или радиокнопка)
        const element = document.createElement('button');
        element.className = `menu-item ${button.className || ''}`;
        element.dataset.action = button.action || '';

        if (button.title) {
          element.title = button.title || '';
        }

        // Добавляем иконку и текст
        const icon = button.icon ? `<span class="menu-icon">${button.icon}</span>` : '';
        const label = button.label ? `<span class="menu-label">${button.label || ''}</span> ` : '';

        element.innerHTML = button.iconPosition === 'right' ? `${label}${icon}` : `${icon}${label}`;

        // Отключаем элемент, если нужно
        if (typeof button.disabled === 'function') {
          element.disabled = button.disabled();
        } else {
          element.disabled = button.disabled || false;
        }

        // Добавляем обработчик клика
        if (button.onClick) {
          element.addEventListener('click', () => {
            button.onClick?.(this.activeElement);
            if (button.closeOnClick !== false) {
              this.hide();
            }
          });
        }

        // Добавляем горячую клавишу
        if (button.hotkey) {
          document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === button.hotkey?.toLowerCase()) {
              button.onClick?.(this.activeElement);
              this.hide();
            }
          });
        }

        // Добавляем вложенное меню, если есть
        if (button.subMenu) {
          const subMenu = new ContextMenu(this.editor, button.subMenu);
          this.subMenus.push(subMenu);
          element.addEventListener('mouseenter', () => {
            subMenu.show(element, element.offsetWidth, 0);
          });
          element.addEventListener('mouseleave', () => {
            subMenu.hide();
          });
        }

        menu.appendChild(element);
      }
    });

    return menu;
  }

  private setupEventListeners(): void {
    // Скрытие меню при клике вне его области
    document.addEventListener('click', this.handleClickOutside);

    // Закрытие меню при нажатии на Escape
    document.addEventListener('keydown', this.handleEscapeKey);
  }

  private handleClickOutside = (e: MouseEvent): void => {
    if (!this.menu.contains(e.target as Node)) {
      this.hide();
    }
  };

  private handleEscapeKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      this.hide();
    }
  };

  public show(element: HTMLElement, x: number, y: number): void {
    this.activeElement = element;
    this.menu.style.left = `${x}px`;
    this.menu.style.top = `${y}px`;
    this.menu.style.display = 'flex';

    // Анимация открытия
    this.menu.style.opacity = '0';
    this.menu.style.transform = 'translateY(-10px)';
    setTimeout(() => {
      this.menu.style.opacity = '1';
      this.menu.style.transform = 'translateY(0)';
    }, 10);

    // Корректировка позиции, если меню выходит за пределы экрана
    const rect = this.menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      this.menu.style.left = `${x - rect.width}px`;
    }
    if (rect.bottom > window.innerHeight) {
      this.menu.style.top = `${y - rect.height}px`;
    }
  }

  public hide(): void {
    // Анимация закрытия
    this.menu.style.opacity = '0';
    this.menu.style.transform = 'translateY(-10px)';
    setTimeout(() => {
      this.menu.style.display = 'none';
    }, 200);

    // Закрываем все вложенные меню
    this.subMenus.forEach((subMenu) => subMenu.hide());
    this.activeElement = null;
  }

  public updateButtons(buttons: MenuButton[]): void {
    // Обновляем кнопки меню
    this.menu.innerHTML = '';
    this.buttons = buttons;
    this.menu.appendChild(this.createMenu());
  }

  public updateButtonState(action: string, state: Partial<MenuButton>): void {
    // Обновляем состояние конкретной кнопки
    const button = this.menu.querySelector(`[data-action="${action}"]`);
    if (button) {
      if (state.label !== undefined) {
        button.querySelector('.menu-label')!.textContent = state.label;
      }
      if (state.icon !== undefined) {
        button.querySelector('.menu-icon')!.innerHTML = state.icon;
      }
      if (state.disabled !== undefined) {
        if (typeof state.disabled === 'function') {
          (button as HTMLButtonElement).disabled = state.disabled();
        } else {
          (button as HTMLButtonElement).disabled = state.disabled;
        }
      }
      if (state.checked !== undefined && button instanceof HTMLInputElement) {
        button.checked = state.checked;
      }
    }
  }

  public getElement(): HTMLElement {
    return this.menu;
  }

  public destroy(): void {
    // Удаляем обработчики событий
    document.removeEventListener('click', this.handleClickOutside);
    document.removeEventListener('keydown', this.handleEscapeKey);

    // Уничтожаем вложенные меню
    this.subMenus.forEach((subMenu) => subMenu.destroy());
    this.subMenus = [];

    // Удаляем элемент меню из DOM
    if (this.menu.parentElement) {
      this.menu.parentElement.removeChild(this.menu);
    }

    // Очищаем ссылки
    this.menu = null!;
    this.editor = null!;
    this.activeElement = null;
    this.buttons = [];
  }
}
