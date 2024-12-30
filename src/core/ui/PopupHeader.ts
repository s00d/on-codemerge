import { closeIcon } from '../../icons';

export class PopupHeader {
  private element: HTMLElement;

  constructor(title: string, onClose: () => void) {
    this.element = this.createHeader(title, onClose);
  }

  private createHeader(title: string, onClose: () => void): HTMLElement {
    // Основной контейнер
    const header = document.createElement('div');
    header.className = 'popup-header';

    // Контейнер для заголовка и кнопки закрытия
    const headerContainer = document.createElement('div');
    headerContainer.className = 'popup-header-container';

    // Заголовок
    const titleElement = document.createElement('h3');
    titleElement.className = 'popup-header-title';
    titleElement.textContent = title;

    // Кнопка закрытия
    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.innerHTML = closeIcon;

    // Добавление обработчика события
    closeButton.addEventListener('click', onClose);

    // Сборка структуры
    headerContainer.appendChild(titleElement);
    headerContainer.appendChild(closeButton);
    header.appendChild(headerContainer);

    return header;
  }

  public getElement(): HTMLElement {
    return this.element;
  }
}
