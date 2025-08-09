import type { FieldConfig, FieldType, FieldOptions, ValidationRules } from '../types';

export class FieldBuilder {
  /**
   * Создает поле с предустановленными настройками
   */
  createPresetField(
    type: FieldType, 
    label: string, 
    options?: Partial<FieldOptions>, 
    validation?: ValidationRules
  ): FieldConfig {
    const id = this.generateFieldId();

    return {
      id,
      type,
      label,
      options: {
        id,
        name: id,
        className: 'form-input',
        placeholder: this.getDefaultPlaceholder(type),
        ...this.getDefaultOptions(type),
        ...options
      },
      validation: {
        ...this.getDefaultValidation(type),
        ...validation
      }
    };
  }

  /**
   * Генерирует уникальный ID для поля
   */
  private generateFieldId(): string {
    return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get default placeholder for field type
   */
  private getDefaultPlaceholder(type: FieldType): string {
    const placeholders: Record<FieldType, string> = {
      text: 'Enter text',
      textarea: 'Enter text',
      email: 'example@email.com',
      password: 'Enter password',
      number: 'Enter number',
      tel: '+1 (555) 123-4567',
      url: 'https://example.com',
      date: 'Select date',
      time: 'Select time',
      'datetime-local': 'Select date and time',
      month: 'Select month',
      week: 'Select week',
      color: '#000000',
      range: 'Select value',
      select: 'Select option',
      checkbox: '',
      radio: '',
      button: '',
      submit: '',
      reset: '',
      file: 'Choose file',
      hidden: '',
      image: ''
    };

    return placeholders[type] || '';
  }

  /**
   * Получает опции по умолчанию для типа поля
   */
  private getDefaultOptions(type: FieldType): Partial<FieldOptions> {
    switch (type) {
      case 'email':
        return { autocomplete: 'email' };
      case 'password':
        return { autocomplete: 'current-password' };
      case 'tel':
        return { autocomplete: 'tel' };
      case 'url':
        return { autocomplete: 'url' };
      case 'file':
        return { accept: '*/*' };
      case 'range':
        return { min: 0, max: 100, step: 1 };
      case 'number':
        return { min: 0, step: 1 };
      default:
        return {};
    }
  }

  /**
   * Получает валидацию по умолчанию для типа поля
   */
  private getDefaultValidation(type: FieldType): ValidationRules {
    switch (type) {
      case 'email':
        return { required: true, email: true };
      case 'password':
        return { required: true, minLength: 6 };
      case 'tel':
        return { pattern: '^[+]?[0-9\\s\\-\\(\\)]{10,}$' };
      case 'url':
        return { url: true };
      case 'number':
        return { numeric: true };
      default:
        return {};
    }
  }
}
