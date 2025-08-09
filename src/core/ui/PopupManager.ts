import { PopupHeader } from './PopupHeader';
import { PopupFooter, type PopupFooterButton } from './PopupFooter';
import type { HTMLEditor } from '../HTMLEditor.ts';

export interface PopupItem {
  type:
    | 'input'
    | 'checkbox'
    | 'list'
    | 'textarea'
    | 'radio'
    | 'date'
    | 'range'
    | 'file'
    | 'number'
    | 'password'
    | 'email'
    | 'url'
    | 'color'
    | 'time'
    | 'datetime-local'
    | 'text'
    | 'custom'
    | 'button'
    | 'divider'
    | 'progress'
    | 'loader'; // Тип элемента
  label?: string; // Подпись к элементу
  icon?: string; // Иконка для элемента
  className?: string;
  placeholder?: string; // Плейсхолдер для input, textarea
  options?: string[]; // Опции для списка (если type === 'list' или 'radio')
  value?: string | boolean | number; // Значение по умолчанию
  id: string; // Уникальный идентификатор элемента
  onChange?: (value: string | boolean | number, event?: Event) => void; // Колбек при изменении значения
  min?: number; // Минимальное значение для range, number, date, time, datetime-local
  max?: number; // Максимальное значение для range, number, date, time, datetime-local
  step?: number; // Шаг для range, number, date, time, datetime-local
  accept?: string; // Типы файлов для file (например, "image/*")
  content?: HTMLElement | (() => HTMLElement);
  text?: string;
  buttonVariant?: 'primary' | 'secondary' | 'danger';
}

export interface PopupOptions {
  title?: string;
  className?: string;
  items?: PopupItem[]; // Массив элементов для создания содержимого
  closeOnClickOutside?: boolean;
  buttons?: PopupFooterButton[];
}

export class PopupManager {
  private popup: HTMLElement;
  private header: HTMLElement | null = null;
  private content: HTMLElement;
  private overlay: HTMLElement;
  private footer: PopupFooter | null = null;
  private isVisible = false;
  private boundDocumentKeydown?: (e: KeyboardEvent) => void;

  constructor(editor: HTMLEditor, options: PopupOptions = {}) {
    const { className = '', closeOnClickOutside = true, items = [] } = options;

    this.popup = this.createPopup(className);
    this.content = this.createContent();
    this.overlay = this.createOverlay();

    if (options.title) {
      this.header = new PopupHeader(options.title, () => this.hide()).getElement();
      this.popup.appendChild(this.header);
    }

    this.popup.appendChild(this.content);

    if (options.buttons) {
      this.footer = new PopupFooter(options.buttons);
      this.popup.appendChild(this.footer.getElement());
    }

    // Создаем содержимое на основе items
    if (items.length > 0) {
      this.setContent(this.createContentFromItems(items));
    }

    editor.getInnerContainer().appendChild(this.overlay);
    editor.getInnerContainer().appendChild(this.popup);

    if (closeOnClickOutside) {
      this.overlay.addEventListener('mousedown', (e) => {
        // Не даем событию уйти за пределы редактора
        e.stopPropagation();
        if (this.isVisible && !this.popup.contains(e.target as Node)) {
          this.hide();
        }
      });
    }

    // Храним ссылку на обработчик, чтобы можно было удалить
    this.boundDocumentKeydown = (e: KeyboardEvent) => {
      if (this.isVisible && e.key === 'Escape') {
        this.hide();
      }
    };
    document.addEventListener('keydown', this.boundDocumentKeydown);
  }

  private createPopup(className: string): HTMLElement {
    const popup = document.createElement('div');
    popup.className = `popup ${className}`;
    popup.style.display = `none`;
    return popup;
  }

  private createContent(): HTMLElement {
    const content = document.createElement('div');
    content.className = 'popup-content';
    return content;
  }

  private createContentFromItems(items: PopupItem[]): HTMLElement {
    const container = document.createElement('div');
    container.className = 'popup-items-container';

    items.forEach((item) => {
      const itemContainer = document.createElement('div');
      itemContainer.className = `popup-item ${item.className || ''}`; // Добавляем класс из PopupItem

      if (item.label) {
        const label = document.createElement('label');
        label.className = 'popup-item-label';
        label.textContent = item.label;
        itemContainer.appendChild(label);
      }

      let inputElement: HTMLElement;

      switch (item.type) {
        case 'progress':
          inputElement = document.createElement('div');
          inputElement.className = `popup-progress ${item.className || ''}`;
          const progressBar = document.createElement('div');
          progressBar.className = 'popup-progress-bar';
          progressBar.style.width = `${item.value || 0}%`;
          inputElement.appendChild(progressBar);
          break;
        case 'loader':
          inputElement = document.createElement('div');
          inputElement.className = `popup-loader ${item.className || ''}`;
          const spinner = document.createElement('div');
          spinner.className = 'popup-loader-spinner';
          inputElement.appendChild(spinner);
          break;
        case 'input':
          inputElement = document.createElement('input');
          inputElement.setAttribute('type', 'text');
          inputElement.className = `popup-item-input ${item.className || ''}`; // Добавляем класс из PopupItem
          inputElement.setAttribute('placeholder', item.placeholder || '');
          inputElement.setAttribute('value', (item.value as string) || '');
          break;
        case 'text':
          inputElement = document.createElement('div');
          inputElement.className = `popup-item-input ${item.className || ''}`; // Добавляем класс из PopupItem
          inputElement.innerText = (item.value as string) || '';
          inputElement.setAttribute('placeholder', item.placeholder || '');
          break;
        case 'checkbox':
          inputElement = document.createElement('input');
          inputElement.setAttribute('type', 'checkbox');
          inputElement.className = `popup-item-input ${item.className || ''}`; // Добавляем класс из PopupItem
          if (item.value) {
            (inputElement as HTMLInputElement).checked = true;
          }
          break;
        case 'list':
          inputElement = document.createElement('select');
          inputElement.className = `popup-item-input ${item.className || ''}`;
          item.options?.forEach((option) => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            if (item.value && option === item.value) {
              optionElement.selected = true;
            }
            inputElement.appendChild(optionElement);
          });

          break;
        case 'textarea':
          inputElement = document.createElement('textarea');
          inputElement.className = `popup-item-input ${item.className || ''}`; // Добавляем класс из PopupItem
          inputElement.setAttribute('placeholder', item.placeholder || '');
          inputElement.textContent = (item.value as string) || '';
          break;
        case 'radio':
          inputElement = document.createElement('div');
          inputElement.className = `popup-item-input ${item.className || ''}`; // Добавляем класс из PopupItem
          item.options?.forEach((option) => {
            const radioContainer = document.createElement('div');
            radioContainer.className = 'popup-radio-container';
            const radioInput = document.createElement('input');
            radioInput.setAttribute('type', 'radio');
            radioInput.setAttribute('name', item.id);
            radioInput.setAttribute('value', option);
            radioInput.className = 'popup-radio-input';
            if (item.value === option) {
              radioInput.checked = true;
            }
            const radioLabel = document.createElement('label');
            radioLabel.className = 'popup-radio-label';
            radioLabel.textContent = option;
            radioContainer.appendChild(radioInput);
            radioContainer.appendChild(radioLabel);
            inputElement.appendChild(radioContainer);
          });
          break;
        case 'date':
          inputElement = document.createElement('input');
          inputElement.setAttribute('type', 'date');
          inputElement.className = `popup-item-input ${item.className || ''}`; // Добавляем класс из PopupItem
          inputElement.setAttribute('value', (item.value as string) || '');
          break;
        case 'range':
          inputElement = document.createElement('input');
          inputElement.setAttribute('type', 'range');
          inputElement.className = `popup-item-input ${item.className || ''}`; // Добавляем класс из PopupItem
          inputElement.setAttribute('min', item.min?.toString() || '0');
          inputElement.setAttribute('max', item.max?.toString() || '100');
          inputElement.setAttribute('step', item.step?.toString() || '1');
          inputElement.setAttribute('value', (item.value as string) || '50');
          break;
        case 'file':
          inputElement = document.createElement('input');
          inputElement.setAttribute('type', 'file');
          inputElement.className = `popup-item-input ${item.className || ''}`; // Добавляем класс из PopupItem
          if (item.accept) {
            inputElement.setAttribute('accept', item.accept);
          }
          break;
        case 'number':
          inputElement = document.createElement('input');
          inputElement.setAttribute('type', 'number');
          inputElement.className = `popup-item-input ${item.className || ''}`; // Добавляем класс из PopupItem
          inputElement.setAttribute('value', (item.value as string) || '');
          if (item.min !== undefined) {
            inputElement.setAttribute('min', item.min.toString());
          }
          if (item.max !== undefined) {
            inputElement.setAttribute('max', item.max.toString());
          }
          if (item.step !== undefined) {
            inputElement.setAttribute('step', item.step.toString());
          }
          break;
        case 'password':
          inputElement = document.createElement('input');
          inputElement.setAttribute('type', 'password');
          inputElement.className = `popup-item-input ${item.className || ''}`; // Добавляем класс из PopupItem
          inputElement.setAttribute('placeholder', item.placeholder || '');
          break;
        case 'email':
          inputElement = document.createElement('input');
          inputElement.setAttribute('type', 'email');
          inputElement.className = `popup-item-input ${item.className || ''}`; // Добавляем класс из PopupItem
          inputElement.setAttribute('placeholder', item.placeholder || '');
          break;
        case 'url':
          inputElement = document.createElement('input');
          inputElement.setAttribute('type', 'url');
          inputElement.className = `popup-item-input ${item.className || ''}`; // Добавляем класс из PopupItem
          inputElement.setAttribute('placeholder', item.placeholder || '');
          break;
        case 'color':
          inputElement = document.createElement('div');
          inputElement.className = `color-picker-container ${item.className || ''}`; // Добавляем класс из PopupItem

          // Заголовок
          const title = document.createElement('h3');
          title.className = 'text-sm font-medium text-gray-700 mb-2';
          title.textContent = 'Custom Color';
          inputElement.appendChild(title);

          // Контейнер для элементов
          const colorContainer = document.createElement('div');
          colorContainer.className = 'flex items-center gap-2';
          inputElement.appendChild(colorContainer);

          // Поле выбора цвета
          const colorPicker = document.createElement('input');
          colorPicker.type = 'color';
          colorPicker.className = 'custom-color';
          colorPicker.value = (item.value || '#000000').toString();
          colorContainer.appendChild(colorPicker);

          // Текстовое поле для ввода цвета
          const colorInput = document.createElement('input');
          colorInput.type = 'text';
          colorInput.className = 'color-input';
          colorInput.placeholder = '#000000';
          colorInput.pattern = '^#[0-9A-Fa-f]{6}$';
          colorInput.value = (item.value || '#000000').toString();
          colorContainer.appendChild(colorInput);

          // Обработчики событий
          colorPicker.addEventListener('input', (e) => {
            colorInput.value = (e.target as HTMLInputElement).value.toUpperCase();
          });

          colorInput.addEventListener('input', (e) => {
            const color = (e.target as HTMLInputElement).value.toUpperCase();
            if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
              colorPicker.value = color;
            }
          });
          break;
        case 'time':
          inputElement = document.createElement('input');
          inputElement.setAttribute('type', 'time');
          inputElement.className = `popup-item-input ${item.className || ''}`; // Добавляем класс из PopupItem
          inputElement.setAttribute('value', (item.value as string) || '');
          break;
        case 'datetime-local':
          inputElement = document.createElement('input');
          inputElement.setAttribute('type', 'datetime-local');
          inputElement.className = `popup-item-input ${item.className || ''}`; // Добавляем класс из PopupItem
          inputElement.setAttribute('value', (item.value as string) || '');
          break;
        case 'button':
          inputElement = document.createElement('button');
          inputElement.className = `popup-button ${item.buttonVariant || 'primary'} ${item.className || ''}`; // Добавляем класс из PopupItem

          if (item.icon) {
            inputElement.innerHTML = item.icon;
          }

          inputElement.insertAdjacentHTML('beforeend', item.text || 'Button');

          if (item.onChange) {
            inputElement.addEventListener('click', () => item.onChange!(item.value as string));
          }
          break;
        case 'custom':
          if (item.content) {
            inputElement = typeof item.content === 'function' ? item.content() : item.content;
          } else {
            throw new Error('Custom type requires a content property.');
          }
          break;
        case 'divider':
          inputElement = document.createElement('div');
          inputElement.className = `popup-divider ${item.className || ''}`; // Добавляем класс из PopupItem
          inputElement.style.borderTop = '1px solid #e5e7eb'; // Стиль для горизонтальной линии
          inputElement.style.margin = '8px 0'; // Отступы сверху и снизу
          break;
        default:
          throw new Error(`Unsupported item type: ${item.type}`);
      }

      if (
        item.onChange &&
        item.type !== 'button' &&
        item.type !== 'progress' &&
        item.type !== 'loader'
      ) {
        inputElement.addEventListener('change', (e) => {
          let value: string | boolean | number;
          if (item.type === 'checkbox') {
            value = (e.target as HTMLInputElement).checked;
          } else if (item.type === 'range' || item.type === 'number') {
            value = parseFloat((e.target as HTMLInputElement).value);
          } else {
            value = (e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
          }

          item.onChange!(value, e);
        });

        inputElement.addEventListener('input', (e) => {
          let value: string | boolean | number;
          if (item.type === 'checkbox') {
            value = (e.target as HTMLInputElement).checked;
          } else if (item.type === 'range' || item.type === 'number') {
            value = parseFloat((e.target as HTMLInputElement).value);
          } else {
            value = (e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
          }

          item.onChange!(value, e);
        });
      }
      inputElement.id = item.id;
      itemContainer.appendChild(inputElement);
      container.appendChild(itemContainer);
    });

    return container;
  }

  public visibleShow(id: string): void {
    const loader = this.popup.querySelector(`#${id}`) as HTMLElement;
    if (loader) {
      loader.style.display = 'block';
    }
  }

  public visibleHide(id: string): void {
    const loader = this.popup.querySelector(`#${id}`) as HTMLElement;
    if (loader) {
      loader.style.display = 'none';
    }
  }

  /**
   * Получает значение элемента попапа по его ID.
   * @param id - Уникальный идентификатор элемента.
   * @returns Значение элемента или null, если элемент не найден.
   */
  public getValue(id: string): string | boolean | number | null {
    const element = this.popup.querySelector(`#${id}`) as HTMLElement;

    if (!element) {
      console.warn(`Element with id "${id}" not found.`);
      return null;
    }

    // Обработка типа 'color'
    if (element.classList.contains('color-picker-container')) {
      const colorPicker = element.querySelector('.custom-color') as HTMLInputElement;
      return colorPicker ? colorPicker.value : null;
    }

    // Обработка остальных типов
    switch (element.tagName.toLowerCase()) {
      case 'input':
        const inputElement = element as HTMLInputElement;
        if (inputElement.type === 'checkbox') {
          return inputElement.checked;
        } else if (inputElement.type === 'range' || inputElement.type === 'number') {
          return parseFloat(inputElement.value);
        } else {
          return inputElement.value;
        }
      case 'textarea':
        return (element as HTMLTextAreaElement).value;
      case 'select':
        return (element as HTMLSelectElement).value;
      default:
        console.warn(`Unsupported element type for id "${id}".`);
        return null;
    }
  }

  public setValue(id: string, value: string | boolean | number): void {
    const element = this.popup.querySelector(`#${id}`) as HTMLElement;

    if (!element) {
      console.warn(`Element with id "${id}" not found.`);
      return;
    }

    // Обработка типа 'color'
    if (element.classList.contains('color-picker-container')) {
      const colorPicker = element.querySelector('.custom-color') as HTMLInputElement;
      const colorInput = element.querySelector('.color-input') as HTMLInputElement;

      if (colorPicker && colorInput) {
        const colorValue = value.toString().toUpperCase();
        if (/^#[0-9A-Fa-f]{6}$/.test(colorValue)) {
          colorPicker.value = colorValue;
          colorInput.value = colorValue;
        } else {
          console.warn(
            `Invalid color value for id "${id}". Expected a hex color (e.g., "#FF0000").`
          );
        }
      }
      return;
    }

    // Обработка остальных типов
    switch (element.tagName.toLowerCase()) {
      case 'input':
        const inputElement = element as HTMLInputElement;
        if (inputElement.type === 'checkbox') {
          inputElement.checked = Boolean(value);
        } else if (inputElement.type === 'range' || inputElement.type === 'number') {
          inputElement.value = String(value);
        } else {
          inputElement.value = value as string;
        }
        break;
      case 'textarea':
        (element as HTMLTextAreaElement).value = value as string;
        break;
      case 'select':
        (element as HTMLSelectElement).value = value as string;
        break;
      default:
        console.warn(`Unsupported element type for id "${id}".`);
    }
  }

  public setFocus(id: string): void {
    const element = this.popup.querySelector(`#${id}`) as HTMLElement;

    if (!element) {
      console.warn(`Element with id "${id}" not found.`);
      return;
    }

    if (element.focus) {
      element.focus();
    } else {
      console.warn(`Element with id "${id}" does not support focus.`);
    }
  }

  private createOverlay(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay'; // Применяем SCSS класс
    return overlay;
  }

  public rerender(items: PopupItem[]): void {
    // Очищаем текущее содержимое
    this.content.innerHTML = '';

    // Создаем новое содержимое на основе переданных items
    const newContent = this.createContentFromItems(items);

    // Добавляем новое содержимое в контейнер
    this.content.appendChild(newContent);
  }

  public updateFooterButtonCallback(buttonLabel: string, newCallback: () => void): void {
    if (this.footer) {
      this.footer.updateButtonCallback(buttonLabel, newCallback);
    } else {
      console.warn('Footer is not initialized. Cannot update button callback.');
    }
  }

  public setItems(items: PopupItem[]): void {
    this.setContent(this.createContentFromItems(items));
  }

  public setContent(content: HTMLElement | string): void {
    if (typeof content === 'string') {
      this.content.innerHTML = content;
    } else {
      this.content.innerHTML = '';
      this.content.appendChild(content);
    }
  }

  public show(x?: number, y?: number): void {
    this.popup.style.display = 'flex';
    this.overlay.style.display = 'block';
    this.isVisible = true;

    document.body.classList.add('popup-open');

    if (typeof x === 'number' && typeof y === 'number') {
      this.popup.style.position = 'fixed';
      this.popup.style.left = `${x}px`;
      this.popup.style.top = `${y}px`;

      // Adjust position if popup goes outside viewport
      const rect = this.popup.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        this.popup.style.left = `${x - rect.width}px`;
      }
      if (rect.bottom > window.innerHeight) {
        this.popup.style.top = `${y - rect.height}px`;
      }
    } else {
      this.popup.style.position = 'fixed';
      this.popup.style.left = '50%';
      this.popup.style.top = '50%';
      this.popup.style.transform = 'translate(-50%, -50%)';
    }
  }

  public hide(): void {
    this.popup.style.display = 'none';
    this.overlay.style.display = 'none';
    this.isVisible = false;

    document.body.classList.remove('popup-open');
  }

  public isOpen(): boolean {
    return this.isVisible;
  }

  public getElement(): HTMLElement {
    return this.popup;
  }

  public destroy(): void {
    // Снимаем глобальные обработчики
    if (this.boundDocumentKeydown) {
      document.removeEventListener('keydown', this.boundDocumentKeydown);
      this.boundDocumentKeydown = undefined;
    }

    this.popup.remove();
  }
}
