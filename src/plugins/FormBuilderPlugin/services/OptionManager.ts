import { createButton, createContainer, createInputField } from '../../../utils/helpers';

export class OptionManager {
  private optionsContainer: HTMLDivElement | null = null;
  private optionInputs: HTMLInputElement[] = [];

  // Устанавливает контейнер для опций
  setOptionsContainer(container: HTMLDivElement): void {
    this.optionsContainer = container;
  }

  // Добавляет новую опцию
  addOption(optionValue: string = ''): void {
    if (!this.optionsContainer) return;

    const optionContainer = createContainer('option-container mb-2'); // Используем существующий хелпер

    const optionInput = createInputField('text', 'Option Value', optionValue); // Используем существующий хелпер
    optionInput.className = 'option-input';

    // Добавляем опцию в глобальный массив
    this.optionInputs.push(optionInput);

    const removeOptionButton = createButton(
      'Remove',
      () => {
        optionContainer.remove();
        // Удаляем опцию из глобального массива
        this.optionInputs = this.optionInputs.filter((input) => input !== optionInput);
      },
      'danger'
    ); // Используем существующий хелпер

    optionContainer.appendChild(optionInput);
    optionContainer.appendChild(removeOptionButton);
    this.optionsContainer.appendChild(optionContainer); // Добавляем опцию в контейнер
  }

  // Возвращает все опции
  getOptions(): string[] {
    return this.optionInputs.map((input) => input.value);
  }

  // Очищает все опции
  clearOptions(): void {
    if (this.optionsContainer) {
      this.optionsContainer.innerHTML = '';
    }
    this.optionInputs = [];
  }
}
