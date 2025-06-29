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
  type?: 'button' | 'checkbox' | 'radio' | 'custom' | 'divider' | 'group'; // Тип элемента
  className?: string; // Кастомный CSS-класс для кнопки
  closeOnClick?: boolean; // Закрывать ли меню после клика (по умолчанию true)
  subMenu?: MenuButton[]; // Вложенное меню (опционально)
  customHTML?: string; // Кастомный HTML (для type: 'custom')
  groupTitle?: string; // Заголовок группы (для type: 'group')
  variant?: 'default' | 'danger' | 'success' | 'warning'; // Вариант стиля
}

interface ContextMenuOptions {
  orientation?: 'vertical' | 'horizontal'; // Ориентация меню
  maxHeight?: number; // Максимальная высота меню
  maxWidth?: number; // Максимальная ширина меню
  closeOnClickOutside?: boolean; // Закрывать ли при клике вне меню
  closeOnEscape?: boolean; // Закрывать ли при нажатии Escape
  animation?: boolean; // Включить ли анимации
}

export class ContextMenu {
  private menu: HTMLElement;
  private editor: HTMLEditor;
  private activeElement: HTMLElement | null = null;
  private subMenus: ContextMenu[] = []; // Для управления вложенными меню
  private orientation: 'vertical' | 'horizontal';
  private buttons: MenuButton[] = [];
  private options: ContextMenuOptions;
  private isVisible = false;
  private longPressTimer: number | null = null;
  private longPressDelay = 500; // Задержка для долгого нажатия в миллисекундах
  private touchStartX = 0;
  private touchStartY = 0;

  constructor(editor: HTMLEditor, buttons: MenuButton[], options: ContextMenuOptions = {}) {
    this.orientation = options.orientation || 'vertical';
    this.buttons = buttons;
    this.editor = editor;
    this.options = {
      closeOnClickOutside: true,
      closeOnEscape: true,
      animation: true,
      maxHeight: 400,
      maxWidth: 300,
      ...options,
    };
    this.menu = this.createMenu();
    document.body.appendChild(this.menu);
    this.setupEventListeners();
  }

  private createMenu(): HTMLElement {
    const menu = document.createElement('div');
    menu.className = `context-menu ${this.orientation === 'horizontal' ? 'horizontal' : ''}`;

    if (this.options.maxHeight) {
      menu.style.maxHeight = `${this.options.maxHeight}px`;
    }
    if (this.options.maxWidth) {
      menu.style.maxWidth = `${this.options.maxWidth}px`;
    }

    this.buttons.forEach((button) => {
      if (button.type === 'divider') {
        // Добавляем разделитель
        const divider = document.createElement('div');
        divider.className = `menu-divider ${this.orientation === 'horizontal' ? 'horizontal' : ''}`;
        menu.appendChild(divider);
      } else if (button.type === 'group' && button.groupTitle) {
        // Добавляем группу
        const group = document.createElement('div');
        group.className = 'menu-group';

        const groupTitle = document.createElement('div');
        groupTitle.className = 'menu-group-title';
        groupTitle.textContent = button.groupTitle;
        group.appendChild(groupTitle);

        if (button.subMenu) {
          button.subMenu.forEach((subButton) => {
            const subElement = this.createMenuItem(subButton);
            if (subElement) group.appendChild(subElement);
          });
        }

        menu.appendChild(group);
      } else if (button.type === 'custom' && button.customHTML) {
        // Добавляем кастомный HTML
        const customElement = document.createElement('div');
        customElement.className = 'menu-custom';
        customElement.innerHTML = button.customHTML;
        menu.appendChild(customElement);
      } else {
        // Создаем элемент (кнопка, чекбокс или радиокнопка)
        const element = this.createMenuItem(button);
        if (element) menu.appendChild(element);
      }
    });

    return menu;
  }

  private createMenuItem(button: MenuButton): HTMLElement | null {
    const element = document.createElement('button');
    element.className = `menu-item ${button.className || ''}`;
    element.dataset.action = button.action || '';
    element.dataset.type = button.type || 'button';

    if (button.variant) {
      element.dataset.type = button.variant;
    }

    if (button.title) {
      element.title = button.title;
    }

    // Добавляем иконку и текст
    const icon = button.icon ? `<span class="menu-icon">${button.icon}</span>` : '';
    const label = button.label || button.title || '';
    const labelSpan = label ? `<span class="menu-label">${label}</span>` : '';
    const hotkey = button.hotkey ? `<span class="menu-hotkey">${button.hotkey}</span>` : '';
    const submenuIndicator = button.subMenu ? '<span class="menu-submenu-indicator">▶</span>' : '';

    if (button.type === 'checkbox' || button.type === 'radio') {
      const checkbox = `<span class="menu-${button.type}"></span>`;
      element.innerHTML = `${checkbox}${icon}${labelSpan}${hotkey}`;
      if (button.checked) {
        element.dataset.checked = 'true';
      }
    } else {
      element.innerHTML =
        button.iconPosition === 'right'
          ? `${labelSpan}${icon}${hotkey}${submenuIndicator}`
          : `${icon}${labelSpan}${hotkey}${submenuIndicator}`;
    }

    // Отключаем элемент, если нужно
    if (typeof button.disabled === 'function') {
      element.disabled = button.disabled();
    } else {
      element.disabled = button.disabled || false;
    }

    // Добавляем обработчик клика
    if (button.onClick) {
      element.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        button.onClick?.(this.activeElement);
        if (button.closeOnClick !== false) {
          this.hide();
        }
      });
    }

    // Добавляем вложенное меню, если есть
    if (button.subMenu) {
      const subMenu = new ContextMenu(this.editor, button.subMenu, {
        ...this.options,
        maxHeight: Math.min(this.options.maxHeight || 400, 300),
      });
      this.subMenus.push(subMenu);

      element.addEventListener('mouseenter', () => {
        // Закрываем другие подменю
        this.subMenus.forEach((menu) => {
          if (menu !== subMenu) menu.hide();
        });

        const rect = element.getBoundingClientRect();
        // Подменю всегда появляется справа от элемента
        const x = rect.right + 5;
        const y = rect.top;
        subMenu.show(element, x, y);
      });

      element.addEventListener('mouseleave', (e) => {
        // Проверяем, не перешел ли курсор в подменю
        setTimeout(() => {
          // Используем document.elementFromPoint для точного определения элемента под мышью
          const elementUnderMouse = document.elementFromPoint(e.clientX, e.clientY);

          // Проверяем, находится ли элемент под мышью в подменю или его дочерних элементах
          const isMouseOverSubMenu = subMenu.menu.contains(elementUnderMouse);

          // Также проверяем relatedTarget
          const isRelatedTargetInSubMenu = subMenu.menu.contains(e.relatedTarget as Node);

          // Проверяем, не находится ли мышь в области между меню (используя координаты viewport)
          const subMenuRect = subMenu.menu.getBoundingClientRect();
          const elementRect = element.getBoundingClientRect();

          // Создаем расширенную область между меню
          const bufferZone = {
            left: Math.min(elementRect.right, subMenuRect.left) - 10,
            right: Math.max(elementRect.right, subMenuRect.left) + 10,
            top: Math.min(elementRect.top, subMenuRect.top) - 10,
            bottom: Math.max(elementRect.bottom, subMenuRect.bottom) + 10,
          };

          const isInBufferZone =
            e.clientX >= bufferZone.left &&
            e.clientX <= bufferZone.right &&
            e.clientY >= bufferZone.top &&
            e.clientY <= bufferZone.bottom;

          // Дополнительная проверка: если мышь находится в пределах вертикальной области меню
          const isInVerticalRange =
            e.clientY >= Math.min(elementRect.top, subMenuRect.top) - 20 &&
            e.clientY <= Math.max(elementRect.bottom, subMenuRect.bottom) + 20;

          if (
            !isMouseOverSubMenu &&
            !isRelatedTargetInSubMenu &&
            !isInBufferZone &&
            !isInVerticalRange
          ) {
            subMenu.hide();
          }
        }, 50); // Увеличиваем задержку для более стабильной работы
      });

      // Добавляем обработчик mouseenter для подменю, чтобы оно оставалось открытым
      subMenu.menu.addEventListener('mouseenter', () => {
        // Подменю остается открытым при наведении на него
      });

      subMenu.menu.addEventListener('mouseleave', (e) => {
        // Проверяем, не перешел ли курсор обратно на родительский элемент
        setTimeout(() => {
          // Используем document.elementFromPoint для точного определения элемента под мышью
          const elementUnderMouse = document.elementFromPoint(e.clientX, e.clientY);

          // Проверяем, находится ли элемент под мышью в родительском элементе
          const isMouseOverElement = element.contains(elementUnderMouse);

          // Также проверяем relatedTarget
          const isRelatedTargetInElement = element.contains(e.relatedTarget as Node);

          // Проверяем буферную зону
          const subMenuRect = subMenu.menu.getBoundingClientRect();
          const elementRect = element.getBoundingClientRect();

          const bufferZone = {
            left: Math.min(elementRect.right, subMenuRect.left) - 10,
            right: Math.max(elementRect.right, subMenuRect.left) + 10,
            top: Math.min(elementRect.top, subMenuRect.top) - 10,
            bottom: Math.max(elementRect.bottom, subMenuRect.bottom) + 10,
          };

          const isInBufferZone =
            e.clientX >= bufferZone.left &&
            e.clientX <= bufferZone.right &&
            e.clientY >= bufferZone.top &&
            e.clientY <= bufferZone.bottom;

          // Дополнительная проверка вертикального диапазона
          const isInVerticalRange =
            e.clientY >= Math.min(elementRect.top, subMenuRect.top) - 20 &&
            e.clientY <= Math.max(elementRect.bottom, subMenuRect.bottom) + 20;

          if (
            !isMouseOverElement &&
            !isRelatedTargetInElement &&
            !isInBufferZone &&
            !isInVerticalRange
          ) {
            subMenu.hide();
          }
        }, 50);
      });
    }

    return element;
  }

  private setupEventListeners(): void {
    if (this.options.closeOnClickOutside) {
      document.addEventListener('click', this.handleClickOutside);
    }

    if (this.options.closeOnEscape) {
      document.addEventListener('keydown', this.handleEscapeKey);
    }

    // Обработка свайпов на мобильных устройствах
    let startY = 0;
    let startX = 0;

    this.menu.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
    });

    this.menu.addEventListener('touchmove', (e) => {
      e.preventDefault();
    });

    this.menu.addEventListener('touchend', (e) => {
      const endY = e.changedTouches[0].clientY;
      const endX = e.changedTouches[0].clientX;
      const deltaY = Math.abs(endY - startY);
      const deltaX = Math.abs(endX - startX);

      // Если свайп вниз или в сторону, закрываем меню
      if (deltaY > 50 || deltaX > 50) {
        this.hide();
      }
    });
  }

  private setupLongPressListeners(): void {
    // Удаляем старые обработчики, если они есть
    if (this.activeElement) {
      this.activeElement.removeEventListener('touchstart', this.handleTouchStart);
      this.activeElement.removeEventListener('touchmove', this.handleTouchMove);
      this.activeElement.removeEventListener('touchend', this.handleTouchEnd);
      this.activeElement.removeEventListener('touchcancel', this.handleTouchCancel);
    }

    // Добавляем новые обработчики для долгого нажатия на активный элемент
    if (this.activeElement) {
      this.activeElement.addEventListener('touchstart', this.handleTouchStart);
      this.activeElement.addEventListener('touchmove', this.handleTouchMove);
      this.activeElement.addEventListener('touchend', this.handleTouchEnd);
      this.activeElement.addEventListener('touchcancel', this.handleTouchCancel);
    }
  }

  private handleTouchStart = (e: TouchEvent): void => {
    e.preventDefault();
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;

    // Запускаем таймер для долгого нажатия
    this.longPressTimer = window.setTimeout(() => {
      this.showContextMenu(e.touches[0].clientX, e.touches[0].clientY);
    }, this.longPressDelay);
  };

  private handleTouchMove = (e: TouchEvent): void => {
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = Math.abs(currentX - this.touchStartX);
    const deltaY = Math.abs(currentY - this.touchStartY);

    // Если палец переместился больше чем на 10px, отменяем долгое нажатие
    if (deltaX > 10 || deltaY > 10) {
      this.cancelLongPress();
    }
  };

  private handleTouchEnd = (_e: TouchEvent): void => {
    this.cancelLongPress();
  };

  private handleTouchCancel = (_e: TouchEvent): void => {
    this.cancelLongPress();
  };

  private cancelLongPress(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  private showContextMenu(x: number, y: number): void {
    // Показываем контекстное меню в позиции касания
    if (this.activeElement) {
      this.show(this.activeElement, x, y);
    }
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
    this.isVisible = true;

    // Устанавливаем обработчики для долгого нажатия на активный элемент
    this.setupLongPressListeners();

    // Показываем меню и применяем начальные стили для анимации
    this.menu.style.display = 'flex';
    this.menu.style.flexDirection = this.orientation === 'horizontal' ? 'row' : 'column';

    if (this.options.animation) {
      this.menu.style.opacity = '0';
      this.menu.style.transform = 'translateY(-10px) scale(0.95)';
    }

    // Устанавливаем начальные координаты
    this.menu.style.left = `${x}px`;
    this.menu.style.top = `${y}px`;

    // Анимация открытия
    if (this.options.animation) {
      requestAnimationFrame(() => {
        this.menu.style.opacity = '1';
        this.menu.style.transform = 'translateY(0) scale(1)';
      });
    }

    // Корректировка позиции, если меню выходит за пределы экрана
    requestAnimationFrame(() => {
      this.adjustPosition();
    });
  }

  private adjustPosition(): void {
    const rect = this.menu.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const currentLeft = parseInt(this.menu.style.left);
    const currentTop = parseInt(this.menu.style.top);

    let newLeft = currentLeft;
    let newTop = currentTop;

    // Корректировка по горизонтали
    if (rect.right > windowWidth) {
      newLeft = currentLeft - (rect.right - windowWidth) - 10;
    }
    if (rect.left < 0) {
      newLeft = 10;
    }

    // Корректировка по вертикали
    if (rect.bottom > windowHeight) {
      newTop = currentTop - (rect.bottom - windowHeight) - 10;
    }
    if (rect.top < 0) {
      newTop = 10;
    }

    // Применяем новые координаты с анимацией
    if (newLeft !== currentLeft || newTop !== currentTop) {
      this.menu.style.left = `${newLeft}px`;
      this.menu.style.top = `${newTop}px`;
    }
  }

  public hide(): void {
    if (!this.isVisible) return;

    this.isVisible = false;

    // Отменяем долгое нажатие
    this.cancelLongPress();

    // Удаляем обработчики с активного элемента
    if (this.activeElement) {
      this.activeElement.removeEventListener('touchstart', this.handleTouchStart);
      this.activeElement.removeEventListener('touchmove', this.handleTouchMove);
      this.activeElement.removeEventListener('touchend', this.handleTouchEnd);
      this.activeElement.removeEventListener('touchcancel', this.handleTouchCancel);
    }

    // Закрываем все вложенные меню
    this.subMenus.forEach((subMenu) => subMenu.hide());

    if (this.options.animation) {
      // Анимация закрытия
      this.menu.style.opacity = '0';
      this.menu.style.transform = 'translateY(-10px) scale(0.95)';
      setTimeout(() => {
        this.menu.style.display = 'none';
        this.activeElement = null;
      }, 200);
    } else {
      this.menu.style.display = 'none';
      this.activeElement = null;
    }
  }

  public updateButtons(buttons: MenuButton[]): void {
    // Обновляем кнопки меню
    this.menu.innerHTML = '';
    this.buttons = buttons;
    this.menu.appendChild(this.createMenu());
  }

  public updateButtonState(action: string, state: Partial<MenuButton>): void {
    // Обновляем состояние конкретной кнопки
    const button = this.menu.querySelector(`[data-action="${action}"]`) as HTMLButtonElement;
    if (button) {
      Object.assign(button.dataset, state);

      if (state.disabled !== undefined) {
        button.disabled = typeof state.disabled === 'function' ? state.disabled() : state.disabled;
      }

      if (state.checked !== undefined) {
        button.dataset.checked = state.checked.toString();
      }
    }
  }

  public getElement(): HTMLElement {
    return this.menu;
  }

  public destroy(): void {
    // Отменяем долгое нажатие
    this.cancelLongPress();

    // Удаляем обработчики с активного элемента
    if (this.activeElement) {
      this.activeElement.removeEventListener('touchstart', this.handleTouchStart);
      this.activeElement.removeEventListener('touchmove', this.handleTouchMove);
      this.activeElement.removeEventListener('touchend', this.handleTouchEnd);
      this.activeElement.removeEventListener('touchcancel', this.handleTouchCancel);
    }

    // Удаляем обработчики событий
    if (this.options.closeOnClickOutside) {
      document.removeEventListener('click', this.handleClickOutside);
    }
    if (this.options.closeOnEscape) {
      document.removeEventListener('keydown', this.handleEscapeKey);
    }

    // Уничтожаем вложенные меню
    this.subMenus.forEach((subMenu) => subMenu.destroy());

    // Удаляем элемент из DOM
    if (this.menu.parentNode) {
      this.menu.parentNode.removeChild(this.menu);
    }
  }
}
