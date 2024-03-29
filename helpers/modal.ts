import type { EditorCoreInterface } from "../src/types";

type InputType = 'block'  | 'checkbox' | 'color' | 'date' | 'datetime-local' |
  'email' | 'file' | 'hidden' | 'image' | 'month' | 'number' |
  'password' | 'radio' | 'range' | 'reset' | 'search' |
  'submit' | 'tel' | 'text' | 'time' | 'url' | 'week' | 'textarea' | 'select';

interface openParams {
  label: string,
  hideLabel?: boolean,
  value?: string,
  type?: InputType,
  rows?: number,
  options?: {value: string, label: string}[]
  data?: {name: string, value: string}[]
  div?: HTMLDivElement
  onChange?: (val: any) => void
}

export class Modal {
  private modalElement: HTMLElement;
  private overlayElement: HTMLElement;
  private contentElement: HTMLElement;
  private closeButton: HTMLButtonElement|null = null;
  private saveButton: HTMLButtonElement|null = null;
  private inputElements: Map<string, HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement|HTMLButtonElement|HTMLDivElement> = new Map();
  private saveCallback: (data: {[key: string]: string | boolean}) => void = () => {};
  private onClose: () => void = () => {};


  constructor(core: EditorCoreInterface, width?: string) {
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

    this.overlayElement = this.createOverlay();
    this.modalElement.appendChild(this.overlayElement);

    this.contentElement = this.createContent(width)
    this.modalElement.appendChild(this.contentElement);

    core.generalElement.appendChild(this.modalElement);
  }

  private createOverlay() {
    const overlayElement = document.createElement('div');
    overlayElement.className = 'on-modal-overlay';
    this.applyStyles(overlayElement, {
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

    return overlayElement;
  }

  private createContent(width: string | undefined) {
    const contentElement = document.createElement('div');
    contentElement.className = 'on-modal-content';
    this.applyStyles(contentElement, {
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


    return contentElement;
  }

  private applyStyles(element: HTMLElement, styles: {[key: string]: string}): void {
    Object.assign(element.style, styles);
  }

  private createHeader(title?: string): void {
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

      this.closeButton = document.createElement('button');
      this.closeButton.textContent = 'X';
      this.applyStyles(this.closeButton, {
        padding: '5px 10px',
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontSize: '1.2rem',
      });
      this.closeButton.addEventListener('click', this.close.bind(this));

      headerElement.appendChild(titleElement);
      headerElement.appendChild(this.closeButton);
      this.contentElement.appendChild(headerElement);
    }
  }

  private createInputWrapper() {
    const inputWrapper = document.createElement('div');
    this.applyStyles(inputWrapper, {
      padding: '10px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '10px',
    });
    return inputWrapper;
  }

  private createSelectField(field: openParams) {
    const input = document.createElement('select');
    field.options?.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.textContent = option.label;
      if (field.value === option.value) {
        optionElement.selected = true;
      }
      input.appendChild(optionElement);
    });

    if(field.onChange) {
      input.addEventListener('input', (e) => {
        field.onChange!((e.target as HTMLInputElement).value)
      })
    }

    this.applyStyles(input, {
      flex: '1',
      padding: '5px',
      border: '1px solid #ddd',
      borderRadius: '4px',
    });

    return input;
  }

  private createTextAreaField(field: openParams) {
    const input = document.createElement('textarea');
    input.rows = field.rows ?? 5;
    input.placeholder = field.label;
    if(field.onChange) {
      input.addEventListener('input', (e) => {
        field.onChange!((e.target as HTMLInputElement).value)
      })
    }

    this.applyStyles(input, {
      flex: '1',
      padding: '5px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      resize: 'vertical', // Позволяет пользователю изменять размер textarea
    });
    input.textContent = field.value || '';
    return input;
  }

  private createInputFieldOfType(field: openParams) {
    const input = document.createElement('input');
    input.type = field.type ?? 'text';
    input.value = field.value || '';
    input.placeholder = field.label;
    if(field.onChange) {
      input.addEventListener('input', (e) => {
        field.onChange!((e.target as HTMLInputElement).value)
      })
    }
    this.applyStyles(input, {
      flex: '1',
      padding: '5px',
      border: '1px solid #ddd',
      borderRadius: '4px',
    });
    return input;
  }

  private createSaveButton() {
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    this.applyStyles(saveButton, {
      padding: '10px 20px',
      backgroundColor: '#377cff',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      marginTop: '20px',
    });

    saveButton.addEventListener('click', this.save.bind(this));

    return saveButton;
  }


  open(fields: openParams[], saveCallback: (data: {[key: string]: string | boolean}) => void, title?: string, onClose = () => {}): void {
    this.saveCallback = saveCallback;
    this.onClose = onClose;

    this.inputElements.clear();
    this.contentElement.innerHTML = '';

    this.createHeader(title)

    fields.forEach(field => {
      const inputWrapper = this.createInputWrapper();

      const label = document.createElement('label');
      if(!field.hideLabel) {
        label.textContent = field.label;
        this.applyStyles(label, {
          marginRight: '10px',
        });
      }

      let input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLButtonElement | HTMLDivElement;
      if (field.type === 'block') {
        input = field.div!;
      } else if (field.type === 'select') {
       input = this.createSelectField(field);
      } else if (field.type === 'textarea') {
        input = this.createTextAreaField(field);
      } else {
        input = this.createInputFieldOfType(field);
      }


      input.id = 'input-' + Math.random().toString(36).substring(2, 11)

      if(!field.hideLabel) {
        inputWrapper.appendChild(label);
      }
      inputWrapper.appendChild(input);
      this.contentElement.appendChild(inputWrapper);

      this.inputElements.set(field.label, input);
    });

    this.saveButton = this.createSaveButton();

    this.contentElement.appendChild(this.saveButton);

    this.modalElement.style.display = 'block';
    this.overlayElement.style.display = 'block';
  }

  save(): void {
    const data: {[key: string]: string | boolean} = {};

    this.inputElements.forEach((input, label) => {
      if(input instanceof HTMLDivElement) return;
      data[label] = input.type === 'checkbox' ? (input as HTMLInputElement).checked : input.value;
    });

    this.modalElement.style.display = 'none';
    this.overlayElement.style.display = 'none';

    if (this.saveCallback) {
      this.saveCallback(data);
    }
  }

  close() {
    this.modalElement.style.display = 'none';
    this.overlayElement.style.display = 'none';

    this.onClose()
  }

  destroy(): void {
    // Добавьте здесь код для уничтожения ресурсов, закрытия модального окна и очистки ссылок.
    this.close(); // Закрыть модальное окно
    this.inputElements.clear(); // Очистить коллекцию элементов ввода
    this.modalElement.remove(); // Удалить модальное окно из DOM
    this.overlayElement.remove(); // Удалить оверлей из DOM

    if(this.closeButton) {
      this.closeButton.removeEventListener('click', this.save);
      this.closeButton = null;
    }
    if(this.saveButton) {
      this.saveButton.removeEventListener('click', this.save);
      this.saveButton = null;
    }
    // @ts-ignore
    this.modalElement = null; // Сбросить ссылку на модальное окно
    // @ts-ignore
    this.overlayElement = null; // Сбросить ссылку на оверлей
    // @ts-ignore
    this.contentElement = null; // Сбросить ссылку на контент модального окна
    // @ts-ignore
    this.saveCallback = null; // Сбросить коллбэк для закрытия
  }
}
