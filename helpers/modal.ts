import type { EditorCore } from "@/index";

type InputType = 'button' | 'checkbox' | 'color' | 'date' | 'datetime-local' |
  'email' | 'file' | 'hidden' | 'image' | 'month' | 'number' |
  'password' | 'radio' | 'range' | 'reset' | 'search' |
  'submit' | 'tel' | 'text' | 'time' | 'url' | 'week' | 'textarea';

export class Modal {
  private modalElement: HTMLElement;
  private overlayElement: HTMLElement;
  private contentElement: HTMLElement;
  private inputElements: Map<string, HTMLInputElement|HTMLTextAreaElement> = new Map();
  private closeCallback: (data: {[key: string]: string | boolean}) => void = () => {};

  constructor(core: EditorCore, width?: string) {
    this.modalElement = document.createElement('div');
    this.modalElement.className = 'on-modal';
    this.applyStyles(this.modalElement, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      padding: '20px',
      zIndex: '1001',
      display: 'none'
    });

    this.overlayElement = document.createElement('div');
    this.overlayElement.className = 'on-modal-overlay';
    this.applyStyles(this.overlayElement, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      zIndex: '1000',
      display: 'none',
      opacity: '0.8'
    });
    this.modalElement.appendChild(this.overlayElement);

    this.contentElement = document.createElement('div');
    this.contentElement.className = 'on-modal-content';
    this.applyStyles(this.contentElement, {
      zIndex: '1001',
      backgroundColor: '#fff', // Белый фон
      padding: '20px',         // Отступы внутри контента
      border: '1px solid #ddd', // Тонкая серая граница
      borderRadius: '8px',     // Скругленные углы
      maxWidth: '600px',       // Максимальная ширина модального окна
      margin: '0 auto',        // Автоматические отступы для центрирования
      textAlign: 'center',     // Текст по центру
      boxSizing: 'border-box', // Учитывать границы и padding в ширине и высоте
      width: width ? width : 'unset',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      position: 'fixed',
    });


    this.modalElement.appendChild(this.contentElement);

    // document.body.appendChild(this.modalElement);
    core.generalElement.appendChild(this.modalElement);
  }

  private applyStyles(element: HTMLElement, styles: {[key: string]: string}): void {
    Object.assign(element.style, styles);
  }

  open(fields: { label: string, hideLabel?: boolean, value?: string, type?: InputType, rows?: number }[], callback: (data: {[key: string]: string | boolean}) => void, title?: string): void {
    this.closeCallback = callback;

    this.inputElements.clear();
    this.contentElement.innerHTML = '';

    if (title) {
      const headerElement = document.createElement('div');
      headerElement.className = 'on-modal-header';
      this.applyStyles(headerElement, {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px', // Отступ от заголовка к содержимому
      });

      const titleElement = document.createElement('h3');
      titleElement.textContent = title; // Замените на нужный заголовок
      this.applyStyles(titleElement, {
        flex: '1',
        textAlign: 'left',
        margin: '0', // Убрать стандартные отступы у заголовка
      });

      const closeButton = document.createElement('button');
      closeButton.textContent = 'X';
      this.applyStyles(closeButton, {
        padding: '5px 10px',
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontSize: '1.2rem',
      });
      closeButton.addEventListener('click', () => this.close());

      headerElement.appendChild(titleElement);
      headerElement.appendChild(closeButton);
      this.contentElement.appendChild(headerElement);
    }

    fields.forEach(field => {
      const inputWrapper = document.createElement('div');
      this.applyStyles(inputWrapper, {
        padding: '10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
      });

      const label = document.createElement('label');
      if(!field.hideLabel) {
        label.textContent = field.label;
        this.applyStyles(label, {
          marginRight: '10px',
        });
      }

      let input: HTMLInputElement | HTMLTextAreaElement;
      if (field.type === 'textarea') {
        input = document.createElement('textarea');
        input.rows = field.rows ?? 5;
        input.placeholder = field.label;

        this.applyStyles(input, {
          flex: '1',
          padding: '5px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          resize: 'vertical', // Позволяет пользователю изменять размер textarea
        });
        input.textContent = field.value || '';
      } else {
        input = document.createElement('input');
        input.type = field.type ?? 'text';
        input.value = field.value || '';
        input.placeholder = field.label;
        this.applyStyles(input, {
          flex: '1',
          padding: '5px',
          border: '1px solid #ddd',
          borderRadius: '4px',
        });
      }

      input.id = 'input-' + Math.random().toString(36).substring(2, 11)

      if(!field.hideLabel) {
        inputWrapper.appendChild(label);
      }
      inputWrapper.appendChild(input);
      this.contentElement.appendChild(inputWrapper);

      this.inputElements.set(input.id, input);
    });

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Save';
    this.applyStyles(closeButton, {
      padding: '10px 20px',
      backgroundColor: '#377cff',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      marginTop: '20px',
    });

    closeButton.addEventListener('click', () => this.close());

    this.contentElement.appendChild(closeButton);

    this.modalElement.style.display = 'block';
    this.overlayElement.style.display = 'block';
  }

  close(): void {
    const data: {[key: string]: string | boolean} = {};

    this.inputElements.forEach((input, label) => {
      data[label] = input.type === 'checkbox' ? (input as HTMLInputElement).checked : input.value;
    });

    this.modalElement.style.display = 'none';
    this.overlayElement.style.display = 'none';

    if (this.closeCallback) {
      this.closeCallback(data);
    }
  }

  destroy(): void {
    // Добавьте здесь код для уничтожения ресурсов, закрытия модального окна и очистки ссылок.
    this.close(); // Закрыть модальное окно
    this.inputElements.clear(); // Очистить коллекцию элементов ввода
    this.modalElement.remove(); // Удалить модальное окно из DOM
    this.overlayElement.remove(); // Удалить оверлей из DOM
    // @ts-ignore
    this.modalElement = null; // Сбросить ссылку на модальное окно
    // @ts-ignore
    this.overlayElement = null; // Сбросить ссылку на оверлей
    // @ts-ignore
    this.contentElement = null; // Сбросить ссылку на контент модального окна
    // @ts-ignore
    this.closeCallback = null; // Сбросить коллбэк для закрытия
  }
}
