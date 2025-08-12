import type { FieldConfig, FormConfig, FieldType, FieldOptions } from '../types';
import type { HTMLEditor } from '../../../app';

export class FormManager {
  private fieldsConfig: FieldConfig[] = [];
  private currentFormId: string | null = null;
  private currentFormAction: string = '';
  private currentFormMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' =
    'POST';
  private editor: HTMLEditor;

  constructor(editor: HTMLEditor) {
    this.editor = editor;
  }

  /**
   * Добавляет поле в форму
   */
  addField(typeOrField: FieldType | FieldConfig, options?: Partial<FieldConfig>): void {
    let field: FieldConfig;

    if (typeof typeOrField === 'string') {
      // Создаем поле по типу
      const fieldId = `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Базовые опции для всех полей
      let baseOptions: FieldOptions = {
        name: fieldId,
        placeholder: '',
      };

      // Специальные опции для checkbox
      if (typeOrField === 'checkbox') {
        baseOptions = {
          name: fieldId,
          placeholder: '',
          value: this.editor.t('New Checkbox'),
          checked: false,
        };
      }

      field = {
        id: fieldId,
        type: typeOrField,
        label: this.editor.t('New Field'),
        options: baseOptions,
        validation: {
          required: false,
        },
        position: this.fieldsConfig.length,
        ...options,
      };
    } else {
      // Используем готовый FieldConfig
      field = {
        ...typeOrField,
        ...options,
        id: options?.id || typeOrField.id || this.generateFieldId(),
        position: this.fieldsConfig.length,
      };
    }

    this.fieldsConfig.push(field);
  }

  /**
   * Обновляет поле по ID
   */
  updateField(fieldId: string, updates: Partial<FieldConfig>): boolean {
    const index = this.fieldsConfig.findIndex((field) => field.id === fieldId);
    if (index !== -1) {
      const currentField = this.fieldsConfig[index];

      // Если обновляются опции, правильно объединяем их
      if (updates.options && currentField.options) {
        updates.options = { ...currentField.options, ...updates.options };
      }

      this.fieldsConfig[index] = { ...currentField, ...updates };
      return true;
    }
    return false;
  }

  /**
   * Удаляет поле по ID
   */
  removeField(fieldId: string): boolean {
    const index = this.fieldsConfig.findIndex((field) => field.id === fieldId);
    if (index !== -1) {
      this.fieldsConfig.splice(index, 1);
      // Обновляем позиции
      this.fieldsConfig.forEach((field, i) => {
        field.position = i;
      });
      return true;
    }
    return false;
  }
  /**
   * Перемещает поле
   */
  moveField(fieldId: string, newPosition: number): boolean {
    const currentIndex = this.fieldsConfig.findIndex((field) => field.id === fieldId);
    if (currentIndex === -1 || newPosition < 0 || newPosition >= this.fieldsConfig.length) {
      return false;
    }

    const field = this.fieldsConfig.splice(currentIndex, 1)[0];
    this.fieldsConfig.splice(newPosition, 0, field);

    // Обновляем позиции
    this.fieldsConfig.forEach((field, i) => {
      field.position = i;
    });

    return true;
  }

  /**
   * Возвращает поле по ID
   */
  getField(fieldId: string): FieldConfig | undefined {
    return this.fieldsConfig.find((field) => field.id === fieldId);
  }

  /**
   * Возвращает текущий список полей
   */
  getFields(): FieldConfig[] {
    return [...this.fieldsConfig];
  }

  /**
   * Очищает все поля
   */
  clearFields(): void {
    this.fieldsConfig = [];
    this.currentFormId = null;
  }

  /**
   * Создает конфигурацию формы
   */
  createFormConfig(action: string, method: 'POST' | 'GET' = 'GET'): FormConfig {
    return {
      id: this.generateFormId(),
      method,
      action,
      className: 'generated-form',
      fields: this.getFields(),
    };
  }

  /**
   * Создает и возвращает HTML форму
   */
  createForm(formConfig: FormConfig): string {
    const { id, method, action, className, fields } = formConfig;

    let formHtml = `<form id="${id}" method="${method}" action="${action}" class="${className}">`;

    fields.forEach((field) => {
      formHtml += this.createFieldHTML(field);
    });

    formHtml += `<button type="submit" class="submit-button">${this.editor.t('Submit')}</button>`;
    formHtml += '</form>';

    return formHtml;
  }

  /**
   * Create field HTML
   */
  private createFieldHTML(field: FieldConfig): string {
    const { id, type, label, options, validation } = field;

    let fieldHtml = `<div class="form-field${validation?.required ? ' required-field' : ''}">`;

    if (label) {
      fieldHtml += `<label for="${id}">${label}</label>`;
    }

    // Build common attributes
    const commonAttrs = this.buildCommonAttributes(field);

    switch (type) {
      case 'text':
      case 'email':
      case 'password':
      case 'number':
      case 'tel':
      case 'url':
      case 'date':
      case 'time':
      case 'datetime-local':
      case 'month':
      case 'week':
      case 'color':
      case 'range':
        fieldHtml += `<input type="${type}" id="${id}" name="${options?.name || id}"${commonAttrs}>`;
        break;

      case 'textarea':
        const rows = options?.rows ? ` rows="${options.rows}"` : '';
        const cols = options?.cols ? ` cols="${options.cols}"` : '';
        fieldHtml += `<textarea id="${id}" name="${options?.name || id}"${commonAttrs}${rows}${cols}></textarea>`;
        break;

      case 'select':
        const multiple = options?.multiple ? ' multiple' : '';
        fieldHtml += `<select id="${id}" name="${options?.name || id}"${commonAttrs}${multiple}>`;
        if (options?.options) {
          options.options.forEach((option) => {
            fieldHtml += `<option value="${option}">${option}</option>`;
          });
        }
        fieldHtml += '</select>';
        break;

      case 'checkbox':
        const checked = options?.checked ? ' checked' : '';
        const checkboxText = options?.value || label || '';
        if (checkboxText) {
          fieldHtml += `<div class="checkbox-container">`;
          fieldHtml += `<input type="checkbox" id="${id}" name="${options?.name || id}"${commonAttrs}${checked}>`;
          fieldHtml += `<label for="${id}">${checkboxText}</label>`;
          fieldHtml += `</div>`;
        } else {
          fieldHtml += `<input type="checkbox" id="${id}" name="${options?.name || id}"${commonAttrs}${checked}>`;
        }
        break;

      case 'radio':
        if (options?.options) {
          options.options.forEach((option, index) => {
            const radioId = `${id}_${index}`;
            const checked = options?.value === option ? ' checked' : '';
            fieldHtml += `<input type="radio" id="${radioId}" name="${options?.name || id}" value="${option}"${commonAttrs}${checked}>`;
            fieldHtml += `<label for="${radioId}">${option}</label>`;
          });
        }
        break;

      case 'file':
        const accept = options?.accept ? ` accept="${options.accept}"` : '';
        const fileMultiple = options?.multiple ? ' multiple' : '';
        fieldHtml += `<input type="file" id="${id}" name="${options?.name || id}"${commonAttrs}${accept}${fileMultiple}>`;
        break;

      case 'hidden':
        fieldHtml += `<input type="hidden" id="${id}" name="${options?.name || id}"${commonAttrs}>`;
        break;

      case 'image':
        const src = options?.src ? ` src="${options.src}"` : '';
        const alt = options?.alt ? ` alt="${options.alt}"` : '';
        fieldHtml += `<input type="image" id="${id}" name="${options?.name || id}"${commonAttrs}${src}${alt}>`;
        break;

      case 'button':
      case 'submit':
      case 'reset':
        fieldHtml += `<button type="${type}" id="${id}" name="${options?.name || id}"${commonAttrs}>${label || type}</button>`;
        break;

      default:
        fieldHtml += `<input type="text" id="${id}" name="${options?.name || id}"${commonAttrs}>`;
    }

    fieldHtml += '</div>';
    return fieldHtml;
  }

  /**
   * Build common attributes for form fields
   */
  private buildCommonAttributes(field: FieldConfig): string {
    const { options, validation } = field;
    let attrs = '';

    // Placeholder
    if (options?.placeholder) {
      attrs += ` placeholder="${options.placeholder}"`;
    }

    // Value
    if (options?.value) {
      attrs += ` value="${options.value}"`;
    }

    // CSS class
    if (options?.className) {
      attrs += ` class="${options.className}"`;
    }

    // Readonly
    if (options?.readonly) {
      attrs += ' readonly';
    }

    // Disabled
    if (options?.disabled) {
      attrs += ' disabled';
    }

    // Size
    if (options?.size) {
      attrs += ` size="${options.size}"`;
    }

    // Max length
    if (options?.maxlength) {
      attrs += ` maxlength="${options.maxlength}"`;
    }

    // Min length
    if (options?.minlength) {
      attrs += ` minlength="${options.minlength}"`;
    }

    // Min value (for number, range, date inputs)
    if (options?.min !== undefined) {
      attrs += ` min="${options.min}"`;
    }

    // Max value (for number, range, date inputs)
    if (options?.max !== undefined) {
      attrs += ` max="${options.max}"`;
    }

    // Step value (for number, range inputs)
    if (options?.step !== undefined) {
      attrs += ` step="${options.step}"`;
    }

    // Autocomplete
    if (options?.autocomplete) {
      attrs += ` autocomplete="${options.autocomplete}"`;
    }

    // Required
    if (validation?.required) {
      attrs += ' required';
    }

    // Pattern
    if (validation?.pattern) {
      attrs += ` pattern="${validation.pattern}"`;
    }

    // Validation data attribute
    if (validation) {
      attrs += ` data-validation="${JSON.stringify(validation)}"`;
    }

    return attrs;
  }

  /**
   * Загружает конфигурацию формы
   */
  loadFormConfig(config: FormConfig): void {
    this.clearFields();
    this.currentFormId = config.id;
    this.currentFormAction = config.action || '';
    this.currentFormMethod = config.method || 'POST';
    this.fieldsConfig = [...config.fields];
  }
  /**
   * Генерирует уникальный ID для поля
   */
  private generateFieldId(): string {
    return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Генерирует уникальный ID для формы
   */
  private generateFormId(): string {
    return `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Методы для работы с опциями (для обратной совместимости)
  /**
   * Parse form element
   */
  parseForm(element: HTMLElement): FormConfig | null {
    if (element.tagName !== 'FORM') return null;

    const form = element as HTMLFormElement;
    const fields: FieldConfig[] = [];

    // Parse form fields
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach((input, index) => {
      const field = this.parseField(
        input as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
        index
      );
      if (field) {
        fields.push(field);
      }
    });

    return {
      id: form.id || `form_${Date.now()}`,
      method: form.method as 'GET' | 'POST',
      action: form.action,
      className: form.className,
      fields,
    };
  }

  /**
   * Parse field element
   */
  private parseField(
    input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
    index: number
  ): FieldConfig | null {
    let type: string;

    if (input.tagName === 'TEXTAREA') {
      type = 'textarea';
    } else if (input.tagName === 'SELECT') {
      type = 'select';
    } else {
      type = input.type || 'text';
    }

    // Skip submit/reset buttons
    if (type === 'submit' || type === 'reset') {
      return null;
    }

    const field: FieldConfig = {
      id: input.id || `field_${Date.now()}_${index}`,
      type: type as any,
      label: this.getFieldLabel(input),
      options: {
        name: input.name,
        id: input.id,
        placeholder: (input as HTMLInputElement | HTMLTextAreaElement).placeholder,
        value: input.value,
        className: input.className,
        readonly: (input as HTMLInputElement | HTMLTextAreaElement).readOnly,
        disabled: input.disabled,
        multiple: (input as HTMLSelectElement).multiple,
        min: (input as HTMLInputElement).min
          ? parseInt((input as HTMLInputElement).min)
          : undefined,
        max: (input as HTMLInputElement).max
          ? parseInt((input as HTMLInputElement).max)
          : undefined,
        step: (input as HTMLInputElement).step
          ? parseFloat((input as HTMLInputElement).step)
          : undefined,
        rows: (input as HTMLTextAreaElement).rows,
        cols: (input as HTMLTextAreaElement).cols,
        accept: (input as HTMLInputElement).accept,
        size: (input as HTMLInputElement).size,
        maxlength: (input as HTMLInputElement | HTMLTextAreaElement).maxLength,
        minlength: (input as HTMLInputElement | HTMLTextAreaElement).minLength,
        src: (input as HTMLInputElement).src,
        alt: (input as HTMLInputElement).alt,
      },
      validation: {
        required: input.required,
        pattern: (input as HTMLInputElement).pattern,
        minLength: (input as HTMLInputElement | HTMLTextAreaElement).minLength,
        maxLength: (input as HTMLInputElement | HTMLTextAreaElement).maxLength,
        min: (input as HTMLInputElement).min
          ? parseInt((input as HTMLInputElement).min)
          : undefined,
        max: (input as HTMLInputElement).max
          ? parseInt((input as HTMLInputElement).max)
          : undefined,
        step: (input as HTMLInputElement).step
          ? parseFloat((input as HTMLInputElement).step)
          : undefined,
      },
      position: index,
    };

    // Parse select options
    if (type === 'select') {
      const select = input as HTMLSelectElement;
      const options: string[] = [];
      select.querySelectorAll('option').forEach((option) => {
        options.push(option.value);
      });
      field.options = { ...field.options!, options };
    }

    return field;
  }

  /**
   * Get field label
   */
  private getFieldLabel(input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): string {
    // Try to find label by for attribute
    if (input.id) {
      const label = this.editor.getDOMContext().querySelector(`label[for="${input.id}"]`);
      if (label) {
        return label.textContent || '';
      }
    }

    // Try to find label as previous sibling
    let element = input.previousElementSibling;
    while (element) {
      if (element.tagName === 'LABEL') {
        return element.textContent || '';
      }
      element = element.previousElementSibling;
    }

    // Use placeholder or name as fallback
    return (
      (input as HTMLInputElement | HTMLTextAreaElement).placeholder ||
      input.name ||
      this.editor.t('Untitled Field')
    );
  }
  /**
   * Обновляет action URL формы
   */
  updateFormAction(action: string): void {
    this.currentFormAction = action;
  }

  /**
   * Обновляет метод формы
   */
  updateFormMethod(method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'): void {
    this.currentFormMethod = method;
  }

  /**
   * Получает текущий action URL формы
   */
  getFormAction(): string {
    return this.currentFormAction;
  }

  /**
   * Получает текущий метод формы
   */
  getFormMethod(): 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' {
    return this.currentFormMethod;
  }

  /**
   * Возвращает текущую конфигурацию формы
   */
  getFormConfig(): FormConfig {
    return {
      id: this.currentFormId || this.generateFormId(),
      method: this.currentFormMethod,
      action: this.currentFormAction,
      className: 'generated-form',
      fields: this.getFields(),
    };
  }

  /**
   * Загружает форму из HTMLElement
   */
  loadForm(element: HTMLElement): void {
    const config = this.parseForm(element);
    if (config) {
      this.loadFormConfig(config);
    }
  }
}
