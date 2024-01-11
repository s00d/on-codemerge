import type { EditorCore } from "@/index";

export class DropdownMenu {
  private menuElement: HTMLElement;
  private visible: boolean = false;
  private arrow: HTMLElement;
  private button: HTMLDivElement;
  private dropdown: HTMLDivElement;
  private core: EditorCore;
  private onOpen: (() => void) | undefined;

  constructor(core: EditorCore, buttonText: string, title?: string, onOpen?: () => void) {
    this.core = core;
    this.onOpen = onOpen;
    this.dropdown = document.createElement('div');
    this.dropdown.className = 'dropdown';

    // Создаем кнопку для управления выпадающим списком
    this.button = document.createElement('div');
    this.button.innerHTML = buttonText + ' ';
    if(title) this.button.title = title;
    this.button.classList.add('on-codemerge-button');
    // this.button.style.padding = '8px 12px';
    this.button.style.cursor = 'pointer';

    // Добавляем элемент для стрелки
    this.arrow = document.createElement('span');
    this.arrow.textContent = '▼';
    this.arrow.style.display = 'inline-block';
    this.arrow.style.transition = 'transform 0.3s';
    this.button.appendChild(this.arrow);

    this.button.addEventListener('click', () => {
      this.toggleDropdown();
    });

    this.menuElement = document.createElement('div');
    this.menuElement.className = 'dropdown-menu';

    // Применение стилей к элементу меню
    this.applyStyles(this.menuElement, {
      position: 'absolute',
      backgroundColor: '#fff',
      border: '1px solid #ccc',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      zIndex: '1000',
      maxHeight: '200px',
      minWidth: '150px',
      overflowY: 'auto',

      opacity: '0',
      transform: 'scaleY(0)',
      transformOrigin: 'top',
      transition: 'opacity 0.3s, transform 0.3s',
      top: '45px',
      // Дополнительные стили
    });

    this.dropdown.appendChild(this.button)

    this.core?.generalElement.appendChild(this.menuElement);
  }

  handleOutsideClick = (event: MouseEvent) => {
    if (!this.dropdown.contains(event.target as HTMLElement) && this.visible) {
      this.hide();
    }
  };

  getButton() {
    return this.dropdown;
  }

  addItem(label: string, action: () => void, disabled = () => true): void {
    const item = document.createElement('div');
    item.textContent = label;

    // Применение стилей к пунктам меню
    this.applyStyles(item, {
      padding: '10px 16px',
      cursor: 'pointer',
      border: '1px solid #dcdcdc',
      // Дополнительные стили для пунктов меню
    });

    if(disabled()) {
      this.applyStyles(item, {
        padding: '10px 16px',
        cursor: 'not-allowed',
        border: '1px solid #dcdcdc',
        color: '#a0a0a0', // Серый цвет для текста отключенного элемента
        backgroundColor: '#f0f0f0', // Светло-серый фон для отключенного элемента
        // Дополнительные стили для пунктов меню
      });
    }

    item.addEventListener('click', () => {
      action();
      this.toggleDropdown();
    });

    this.menuElement.appendChild(item);
  }

  private applyStyles(element: HTMLElement, styles: {[key: string]: string}): void {
    Object.assign(element.style, styles);
  }

  show(): void {
    this.visible = true;
    const buttonWidth = this.button.offsetWidth;
    this.menuElement.style.width = `${buttonWidth}px`;


    const rect = this.button.getBoundingClientRect();
    this.menuElement.style.top = `${rect.bottom + window.scrollY}px`;
    this.menuElement.style.left = `${rect.left + window.scrollX}px`;

    // Анимация и стили при открытии
    this.menuElement.style.opacity = '1';
    this.menuElement.style.transform = 'scaleY(1)';
    this.arrow.style.transform = 'rotate(180deg)';
    this.core.restoreCurrentSelection();

    document.addEventListener('click', this.handleOutsideClick);

    if(this.onOpen) this.onOpen();
  }

  hide(): void {
    this.visible = false;
    this.menuElement.style.opacity = '0';
    this.menuElement.style.transform = 'scaleY(0)';
    this.arrow.style.transform = '';

    document.removeEventListener('click', this.handleOutsideClick);
  }

  toggleDropdown(): void {
    if (this.visible) {
     this.hide()
    } else {
      this.show()
    }
  }

  clearItems(): void {
    this.menuElement.innerHTML = '';
  }

  destroy(): void {
    this.hide(); // Закрываем выпадающее меню (если оно открыто)

    // Удаляем обработчик клика за пределами меню
    document.removeEventListener('click', this.handleOutsideClick);

    // Удаляем DOM элементы, созданные для меню
    this.menuElement.remove();
    this.button.remove();
    // @ts-ignore
    this.menuElement = null;
    // @ts-ignore
    this.button = null;
    // @ts-ignore
    this.arrow = null;
    // @ts-ignore
    this.onOpen = null;
  }
}
