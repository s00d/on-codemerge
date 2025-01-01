import type { FieldConfig } from './FieldBuilder';
import { FieldBuilder } from './FieldBuilder';
import { ValidationManager } from './ValidationManager';
import { OptionManager } from './OptionManager';
import { ButtonManager } from './ButtonManager';

export class FormManager {
  fieldBuilder: FieldBuilder;
  private optionManager: OptionManager;
  private validationManager: ValidationManager;
  private buttonManager: ButtonManager;
  private fieldsConfig: FieldConfig[] = []; // Хранит конфигурации полей

  constructor() {
    this.optionManager = new OptionManager();
    this.fieldBuilder = new FieldBuilder();
    this.validationManager = new ValidationManager();
    this.buttonManager = new ButtonManager();
  }

  // Добавляет поле в форму
  addField(fieldConfig: FieldConfig): void {
    this.fieldsConfig.push(fieldConfig);
  }

  // Удаляет поле по индексу
  removeField(index: number): void {
    if (index >= 0 && index < this.fieldsConfig.length) {
      this.fieldsConfig.splice(index, 1);
    }
  }

  // Возвращает текущий список полей
  getFields(): FieldConfig[] {
    return this.fieldsConfig;
  }

  clearFields(): void {
    this.fieldsConfig = [];
  }

  // Создает и возвращает форму на основе текущего конфига
  createForm(url: string, type = 'GET'): HTMLElement {
    const form = document.createElement('form');
    form.className = 'generated-form space-y-4';
    form.action = url;
    form.method = type;

    this.fieldsConfig.forEach((fieldConfig) => {
      let field: HTMLElement | null = null;

      // Если поле типа "button", используем ButtonManager
      if (fieldConfig.type === 'button') {
        const target = fieldConfig.options?.target || '';
        field = this.buttonManager.createButton(fieldConfig.label, target);
      } else {
        // Для остальных полей используем FieldBuilder
        field = this.fieldBuilder.createField(fieldConfig);
      }

      if (field) {
        if (fieldConfig.validation) {
          this.validationManager.addValidation(field, fieldConfig.validation);
        }

        // Если поле типа "select", добавляем опции
        if (fieldConfig.type === 'select' && fieldConfig.options?.options) {
          const selectElement = field.querySelector('select');
          if (selectElement) {
            fieldConfig.options.options.forEach((optionValue) => {
              const option = document.createElement('option');
              option.value = optionValue;
              option.textContent = optionValue;
              selectElement.appendChild(option);
            });
          }
        }

        form.appendChild(field);
      }
    });

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container flex gap-2'; // Используем flexbox с отступом между кнопками

    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.textContent = 'Submit';
    submitButton.className =
      'submit-button flex-1 bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';

    const resetButton = document.createElement('button');
    resetButton.type = 'reset';
    resetButton.textContent = 'Reset';
    resetButton.className =
      'reset-button flex-1 bg-gray-500 text-white p-2 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2';

    buttonContainer.appendChild(submitButton);
    buttonContainer.appendChild(resetButton);

    form.appendChild(buttonContainer);

    return form;
  }

  // Устанавливает контейнер для опций
  setOptionsContainer(container: HTMLDivElement): void {
    this.optionManager.setOptionsContainer(container);
  }

  // Добавляет новую опцию
  addOption(optionValue: string = ''): void {
    this.optionManager.addOption(optionValue);
  }

  // Возвращает все опции
  getOptions(): string[] {
    return this.optionManager.getOptions();
  }

  // Очищает все опции
  clearOptions(): void {
    this.optionManager.clearOptions();
  }
}
