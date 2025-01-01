import type { FieldConfig } from './FieldBuilder';
import { FieldBuilder } from './FieldBuilder';
import { ValidationManager } from './ValidationManager';
import { OptionManager } from './OptionManager';
import {
  createLink,
  createContainer,
  createButton,
  createSelectOption,
  createForm,
} from '../../../utils/helpers.ts';

export class FormManager {
  fieldBuilder: FieldBuilder;
  private optionManager: OptionManager;
  private validationManager: ValidationManager;
  private fieldsConfig: FieldConfig[] = []; // Хранит конфигурации полей

  constructor() {
    this.optionManager = new OptionManager();
    this.fieldBuilder = new FieldBuilder();
    this.validationManager = new ValidationManager();
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
  createForm(url: string, type: 'POST' | 'GET' = 'GET'): HTMLElement {
    const form = createForm('generated-form space-y-4', url, type);

    this.fieldsConfig.forEach((fieldConfig) => {
      let field: HTMLElement | null = null;

      // Если поле типа "button", используем createLink
      if (fieldConfig.type === 'button') {
        const target = fieldConfig.options?.target || '';
        field = createLink(fieldConfig.label, target, '_blank');
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
              const option = createSelectOption(optionValue, optionValue);
              selectElement.appendChild(option);
            });
          }
        }

        form.appendChild(field);
      }
    });

    const buttonContainer = createContainer('button-container flex gap-2');

    const submitButton = createButton('Submit', () => {}, 'primary');
    submitButton.type = 'submit';
    submitButton.className +=
      ' flex-1 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';

    const resetButton = createButton('Reset', () => {}, 'secondary');
    resetButton.type = 'reset';
    resetButton.className +=
      ' flex-1 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2';

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
