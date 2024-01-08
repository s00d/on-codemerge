type InputType = 'button' | 'checkbox' | 'color' | 'date' | 'datetime-local' |
  'email' | 'file' | 'hidden' | 'image' | 'month' | 'number' |
  'password' | 'radio' | 'range' | 'reset' | 'search' |
  'submit' | 'tel' | 'text' | 'time' | 'url' | 'week';

export class Modal {
  private modalElement: HTMLElement;
  private overlayElement: HTMLElement;
  private contentElement: HTMLElement;
  private inputElements: Map<string, HTMLInputElement> = new Map();
  private closeCallback: (data: {[key: string]: string | boolean}) => void = () => {};

  constructor() {
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
    this.overlayElement.className = 'on-modal-content';
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

      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      position: 'fixed',
    });

    this.modalElement.appendChild(this.contentElement);

    document.body.appendChild(this.modalElement);
  }

  private applyStyles(element: HTMLElement, styles: {[key: string]: string}): void {
    Object.assign(element.style, styles);
  }

  open(fields: { label: string; value?: string, type?: InputType }[], callback: (data: {[key: string]: string | boolean}) => void): void {
    this.closeCallback = callback;

    this.inputElements.clear();
    this.contentElement.innerHTML = '';

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
      label.textContent = field.label;
      this.applyStyles(label, {
        marginRight: '10px',
      });

      const input = document.createElement('input');
      input.type = field.type ?? 'text';
      input.value = field.value || '';
      this.applyStyles(input, {
        flex: '1',
        padding: '5px',
        border: '1px solid #ddd',
        borderRadius: '4px',
      });

      inputWrapper.appendChild(label);
      inputWrapper.appendChild(input);
      this.contentElement.appendChild(inputWrapper);

      this.inputElements.set(field.label, input);
    });

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    this.applyStyles(closeButton, {
      padding: '10px 20px',
      backgroundColor: '#f5f5f5',
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
      data[label] = input.type === 'checkbox' ? input.checked : input.value;
    });

    this.modalElement.style.display = 'none';
    this.overlayElement.style.display = 'none';

    if (this.closeCallback) {
      this.closeCallback(data);
    }
  }
}
