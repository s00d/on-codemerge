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

    const optionContainer = document.createElement('div');
    optionContainer.className = 'option-container mb-2';

    const optionInput = document.createElement('input');
    optionInput.type = 'text';
    optionInput.placeholder = 'Option Value';
    optionInput.className = 'option-input';
    optionInput.value = optionValue;

    // Добавляем опцию в глобальный массив
    this.optionInputs.push(optionInput);

    const removeOptionButton = document.createElement('button');
    removeOptionButton.className = 'remove-option-button';
    removeOptionButton.textContent = 'Remove';
    removeOptionButton.addEventListener('click', () => {
      optionContainer.remove();
      // Удаляем опцию из глобального массива
      this.optionInputs = this.optionInputs.filter((input) => input !== optionInput);
    });

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
