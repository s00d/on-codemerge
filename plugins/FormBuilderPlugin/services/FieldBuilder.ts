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
        ...options,
      },
      validation: {
        ...this.getDefaultValidation(type),
        ...validation,
      },
    };
  }

  /**
   * Генерирует уникальный ID для поля
   */
  private generateFieldId(): string {
    return `field_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
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
      image: '',
    };

    return placeholders[type] || '';
  }

  /**
   * Получает опции по умолчанию для типа поля
   */
  private getDefaultOptions(type: FieldType): Partial<FieldOptions> {
    if (type === 'email') {
      return { autocomplete: 'email' };
    }
    if (type === 'password') {
      return { autocomplete: 'current-password' };
    }
    if (type === 'tel') {
      return { autocomplete: 'tel' };
    }
    if (type === 'url') {
      return { autocomplete: 'url' };
    }
    if (type === 'file') {
      return { accept: '*/*' };
    }
    if (type === 'range') {
      return { min: 0, max: 100, step: 1 };
    }
    if (type === 'number') {
      return { min: 0, step: 1 };
    }
    return {};
  }

  /**
   * Получает валидацию по умолчанию для типа поля
   */
  private getDefaultValidation(type: FieldType): ValidationRules {
    if (type === 'email') {
      return { required: true, email: true };
    }
    if (type === 'password') {
      return { required: true, minLength: 6 };
    }
    if (type === 'tel') {
      return { pattern: '^[+]?[0-9\\s\\-\\(\\)]{10,}$' };
    }
    if (type === 'url') {
      return { url: true };
    }
    if (type === 'number') {
      return { numeric: true };
    }
    return {};
  }
}
