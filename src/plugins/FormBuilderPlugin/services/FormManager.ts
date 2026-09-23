import type { FieldConfig, FormConfig, FieldType, FieldOptions } from '../types';
import type { EditorAPI, ViewSpec } from '@on-codemerge/sdk';
import { h } from '@on-codemerge/sdk';

export class FormManager {
  private fieldsConfig: FieldConfig[] = [];
  private currentFormId: string | null = null;
  private currentFormAction = '';
  private currentFormMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' =
    'POST';
  private readonly editor: EditorAPI;

  constructor(editor: EditorAPI) {
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
          value: this.editor.t('formBuilder.newCheckbox'),
          checked: false,
        };
      }

      field = {
        id: fieldId,
        type: typeOrField,
        label: this.editor.t('formBuilder.newField'),
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
        id: (options?.id ?? typeOrField.id) || this.generateFieldId(),
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
    this.fieldsConfig.forEach((fieldItem, i) => {
      fieldItem.position = i;
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
   * Form ViewSpec (editor widget + preview).
   */
  createForm(formConfig: FormConfig): ViewSpec {
    const { id, method, action, className, fields } = formConfig;
    return h(
      'form',
      {
        class: `${className ?? 'generated-form'} not-prose`,
        attrs: { id, method, action },
      },
      [
        ...fields.map((field) => this.fieldView(field)),
        h(
          'button',
          { class: 'submit-button', attrs: { type: 'submit' } },
          this.editor.t('formBuilder.submit')
        ),
      ]
    );
  }

  private fieldCommonAttrs(
    field: FieldConfig
  ): Record<string, string | number | boolean | null | undefined> {
    const { options, validation } = field;
    return {
      placeholder: options?.placeholder,
      value: options?.value,
      class: options?.className,
      readonly: options?.readonly ? true : undefined,
      disabled: options?.disabled ? true : undefined,
      size: options?.size,
      maxlength: options?.maxlength,
      minlength: options?.minlength,
      min: options?.min,
      max: options?.max,
      step: options?.step,
      autocomplete: options?.autocomplete,
      required: validation?.required ? true : undefined,
      pattern: validation?.pattern,
      'data-validation': validation ? JSON.stringify(validation) : undefined,
    };
  }

  private fieldView(field: FieldConfig): ViewSpec {
    const { id, type, label, options, validation } = field;
    const name = options?.name ?? id;
    const wrapClass = `form-field${validation?.required ? ' required-field' : ''}`;
    const labelNode = label ? h('label', { attrs: { for: id } }, label) : null;
    const simpleInput = (
      inputType: string,
      extra: Record<string, string | number | boolean | null | undefined> = {}
    ) =>
      h('div', { class: wrapClass }, [
        labelNode,
        h('input', {
          attrs: { type: inputType, id, name, ...this.fieldCommonAttrs(field), ...extra },
        }),
      ]);

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
      case 'range': {
        return simpleInput(type);
      }
      case 'textarea': {
        return h('div', { class: wrapClass }, [
          labelNode,
          h('textarea', {
            attrs: {
              id,
              name,
              rows: options?.rows,
              cols: options?.cols,
              ...this.fieldCommonAttrs(field),
            },
          }),
        ]);
      }
      case 'select': {
        return h('div', { class: wrapClass }, [
          labelNode,
          h(
            'select',
            {
              attrs: {
                id,
                name,
                multiple: options?.multiple ? true : undefined,
                ...this.fieldCommonAttrs(field),
              },
            },
            ...(options?.options ?? []).map((opt) => h('option', { attrs: { value: opt } }, opt))
          ),
        ]);
      }
      case 'checkbox': {
        const text = (options?.value ?? label) || '';
        return h('div', { class: wrapClass }, [
          h('div', { class: 'checkbox-container' }, [
            h('input', {
              attrs: {
                type: 'checkbox',
                id,
                name,
                checked: options?.checked ? true : undefined,
                ...this.fieldCommonAttrs(field),
              },
            }),
            text ? h('label', { attrs: { for: id } }, text) : null,
          ]),
        ]);
      }
      case 'radio': {
        return h(
          'div',
          { class: wrapClass },
          ...(options?.options ?? []).flatMap((option, index) => {
            const radioId = `${id}_${index}`;
            return [
              h('input', {
                attrs: {
                  type: 'radio',
                  id: radioId,
                  name,
                  value: option,
                  checked: options?.value === option ? true : undefined,
                  ...this.fieldCommonAttrs(field),
                },
              }),
              h('label', { attrs: { for: radioId } }, option),
            ];
          })
        );
      }
      case 'file': {
        return simpleInput('file', {
          accept: options?.accept,
          multiple: options?.multiple ? true : undefined,
        });
      }
      case 'hidden': {
        return h('input', {
          attrs: { type: 'hidden', id, name, ...this.fieldCommonAttrs(field) },
        });
      }
      case 'image': {
        return h('input', {
          attrs: {
            type: 'image',
            id,
            name,
            src: options?.src,
            alt: options?.alt,
            ...this.fieldCommonAttrs(field),
          },
        });
      }
      case 'button':
      case 'submit':
      case 'reset': {
        return h(
          'button',
          { attrs: { type, id, name, ...this.fieldCommonAttrs(field) } },
          label || type
        );
      }
      default: {
        return simpleInput('text');
      }
    }
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
    if (element.tagName !== 'FORM') {
      return null;
    }

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
      type: type as FieldConfig['type'],
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
          ? Number((input as HTMLInputElement).step)
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
          ? Number((input as HTMLInputElement).step)
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
      const label = document.querySelector(`label[for="${input.id}"]`);
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
      this.editor.t('formBuilder.untitledField')
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
      id: this.currentFormId ?? this.generateFormId(),
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
