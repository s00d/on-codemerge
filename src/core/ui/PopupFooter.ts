export interface PopupFooterButton {
  label: string;
  variant?: 'primary' | 'secondary';
  onClick: () => void;
}

export class PopupFooter {
  private element: HTMLElement;
  private buttonElements: Map<string, HTMLElement>; // Храним кнопки в Map

  constructor(buttons: PopupFooterButton[]) {
    this.buttonElements = new Map();
    this.element = this.createFooter(buttons);
  }

  private createFooter(buttons: PopupFooterButton[]): HTMLElement {
    // Основной контейнер
    const footer = document.createElement('div');
    footer.className = 'popup-footer';

    // Контейнер для кнопок
    const footerItems = document.createElement('div');
    footerItems.className = 'popup-footer-items';

    // Создание кнопок
    buttons.forEach((button) => {
      const buttonElement = this.createButton(button);
      footerItems.appendChild(buttonElement);
      this.buttonElements.set(button.label, buttonElement); // Сохраняем кнопку в Map
    });

    // Сборка структуры
    footer.appendChild(footerItems);

    return footer;
  }

  private createButton(button: PopupFooterButton): HTMLElement {
    const buttonElement = document.createElement('button');
    buttonElement.className = this.getButtonClasses(button.variant);
    buttonElement.textContent = button.label;

    // Добавление обработчика события
    buttonElement.addEventListener('click', button.onClick);

    return buttonElement;
  }

  private getButtonClasses(variant: 'primary' | 'secondary' = 'secondary'): string {
    const baseClasses = 'popup-footer-button';
    return variant === 'primary'
      ? `${baseClasses} popup-footer-button-primary`
      : `${baseClasses} popup-footer-button-secondary`;
  }

  public updateButtonCallback(buttonLabel: string, newCallback: () => void): void {
    // Находим кнопку по названию
    const buttonElement = this.buttonElements.get(buttonLabel);

    if (buttonElement) {
      // Удаляем старый обработчик события
      buttonElement.replaceWith(buttonElement.cloneNode(true)); // Удаляем все обработчики

      // Создаем новую кнопку с обновленным колбеком
      const newButton = this.createButton({
        label: buttonLabel,
        onClick: newCallback,
        variant: buttonElement.classList.contains('popup-footer-button-primary')
          ? 'primary'
          : 'secondary',
      });

      // Заменяем старую кнопку на новую
      buttonElement.replaceWith(newButton);

      // Обновляем кнопку в Map
      this.buttonElements.set(buttonLabel, newButton);
    } else {
      console.warn(`Button with label "${buttonLabel}" not found.`);
    }
  }

  public getElement(): HTMLElement {
    return this.element;
  }
}
