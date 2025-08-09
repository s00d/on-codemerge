import type { FormConfig, FieldConfig } from '../types';
import type { HTMLEditor } from '../../../app';

export class FormPreview {
  private readonly container: HTMLElement;
  private editor: HTMLEditor;

  constructor(container: HTMLElement, editor: HTMLEditor) {
    this.container = container;
    this.editor = editor;
  }

  /**
   * Create preview form
   */
  createPreview(formConfig: FormConfig): void {
    if (!this.container) return;

    this.container.innerHTML = '';

    const form = document.createElement('form');
    form.className = formConfig.className || 'generated-form';
    form.method = formConfig.method;
    form.action = formConfig.action;

    formConfig.fields.forEach((field) => {
      const fieldElement = this.createFieldElement(field);
      if (fieldElement) {
        form.appendChild(fieldElement);
      }
    });

    // Add submit button
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.className = 'submit-button';
    submitButton.textContent = this.editor.t('Submit');
    form.appendChild(submitButton);

    this.container.appendChild(form);
  }

  /**
   * Create field element
   */
  private createFieldElement(field: FieldConfig): HTMLElement | null {
    const { id, type, label, options, validation } = field;

    const fieldContainer = document.createElement('div');
    fieldContainer.className = `form-field${validation?.required ? ' required-field' : ''}`;

    // Create label
    if (label) {
      const labelElement = document.createElement('label');
      labelElement.htmlFor = id;
      labelElement.textContent = label;
      fieldContainer.appendChild(labelElement);
    }

    // Create input element
    let inputElement: HTMLElement;

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
        inputElement = document.createElement('input');
        inputElement.setAttribute('type', type);
        inputElement.id = id;
        inputElement.setAttribute('name', options?.name || id);
        this.applyCommonAttributes(inputElement, field);
        break;

      case 'textarea':
        inputElement = document.createElement('textarea');
        inputElement.id = id;
        inputElement.setAttribute('name', options?.name || id);
        this.applyCommonAttributes(inputElement, field);

        if (options?.rows) {
          inputElement.setAttribute('rows', options.rows.toString());
        }
        if (options?.cols) {
          inputElement.setAttribute('cols', options.cols.toString());
        }
        break;

      case 'select':
        inputElement = document.createElement('select');
        inputElement.id = id;
        inputElement.setAttribute('name', options?.name || id);
        this.applyCommonAttributes(inputElement, field);

        if (options?.multiple) {
          inputElement.setAttribute('multiple', '');
        }

        if (options?.options) {
          options.options.forEach((option) => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            inputElement.appendChild(optionElement);
          });
        }
        break;

      case 'checkbox':
        inputElement = document.createElement('input');
        inputElement.setAttribute('type', 'checkbox');
        inputElement.id = id;
        inputElement.setAttribute('name', options?.name || id);
        this.applyCommonAttributes(inputElement, field);

        if (options?.checked) {
          inputElement.setAttribute('checked', '');
        }

        // Добавляем текст рядом с чекбоксом
        const checkboxText = options?.value || field.label || '';
        if (checkboxText) {
          const checkboxContainer = document.createElement('div');
          checkboxContainer.className = 'checkbox-container';

          const labelElement = document.createElement('label');
          labelElement.htmlFor = id;
          labelElement.textContent = checkboxText;

          checkboxContainer.appendChild(inputElement);
          checkboxContainer.appendChild(labelElement);
          fieldContainer.appendChild(checkboxContainer);
          return fieldContainer;
        } else {
          // Если нет текста, просто добавляем чекбокс
          fieldContainer.appendChild(inputElement);
          return fieldContainer;
        }
        break;

      case 'radio':
        if (options?.options) {
          const radioContainer = document.createElement('div');
          options.options.forEach((option, index) => {
            const radioId = `${id}_${index}`;

            const radioInput = document.createElement('input');
            radioInput.setAttribute('type', 'radio');
            radioInput.id = radioId;
            radioInput.setAttribute('name', options?.name || id);
            radioInput.value = option;
            this.applyCommonAttributes(radioInput, field);

            if (options?.value === option) {
              radioInput.setAttribute('checked', '');
            }

            const radioLabel = document.createElement('label');
            radioLabel.htmlFor = radioId;
            radioLabel.textContent = option;

            radioContainer.appendChild(radioInput);
            radioContainer.appendChild(radioLabel);
          });
          return radioContainer;
        }
        return null;

      case 'file':
        inputElement = document.createElement('input');
        inputElement.setAttribute('type', 'file');
        inputElement.id = id;
        inputElement.setAttribute('name', options?.name || id);
        this.applyCommonAttributes(inputElement, field);

        if (options?.accept) {
          inputElement.setAttribute('accept', options.accept);
        }
        if (options?.multiple) {
          inputElement.setAttribute('multiple', '');
        }
        break;

      case 'hidden':
        inputElement = document.createElement('input');
        inputElement.setAttribute('type', 'hidden');
        inputElement.id = id;
        inputElement.setAttribute('name', options?.name || id);
        this.applyCommonAttributes(inputElement, field);
        break;

      case 'image':
        inputElement = document.createElement('input');
        inputElement.setAttribute('type', 'image');
        inputElement.id = id;
        inputElement.setAttribute('name', options?.name || id);
        this.applyCommonAttributes(inputElement, field);

        if (options?.src) {
          inputElement.setAttribute('src', options.src);
        }
        if (options?.alt) {
          inputElement.setAttribute('alt', options.alt);
        }
        break;

      case 'button':
      case 'submit':
      case 'reset':
        inputElement = document.createElement('button');
        inputElement.setAttribute('type', type);
        inputElement.id = id;
        inputElement.setAttribute('name', options?.name || id);
        this.applyCommonAttributes(inputElement, field);
        inputElement.textContent = label || type;
        break;

      default:
        inputElement = document.createElement('input');
        inputElement.setAttribute('type', 'text');
        inputElement.id = id;
        inputElement.setAttribute('name', options?.name || id);
        this.applyCommonAttributes(inputElement, field);
    }

    fieldContainer.appendChild(inputElement);
    return fieldContainer;
  }

  /**
   * Apply common attributes to form elements
   */
  private applyCommonAttributes(element: HTMLElement, field: FieldConfig): void {
    const { options, validation } = field;

    // Placeholder
    if (options?.placeholder) {
      element.setAttribute('placeholder', options.placeholder);
    }

    // Value
    if (options?.value) {
      element.setAttribute('value', options.value);
    }

    // CSS class
    if (options?.className) {
      element.setAttribute('class', options.className);
    }

    // Readonly
    if (options?.readonly) {
      element.setAttribute('readonly', '');
    }

    // Disabled
    if (options?.disabled) {
      element.setAttribute('disabled', '');
    }

    // Size
    if (options?.size) {
      element.setAttribute('size', options.size.toString());
    }

    // Max length
    if (options?.maxlength) {
      element.setAttribute('maxlength', options.maxlength.toString());
    }

    // Min length
    if (options?.minlength) {
      element.setAttribute('minlength', options.minlength.toString());
    }

    // Min value
    if (options?.min !== undefined) {
      element.setAttribute('min', options.min.toString());
    }

    // Max value
    if (options?.max !== undefined) {
      element.setAttribute('max', options.max.toString());
    }

    // Step value
    if (options?.step !== undefined) {
      element.setAttribute('step', options.step.toString());
    }

    // Autocomplete
    if (options?.autocomplete) {
      element.setAttribute('autocomplete', options.autocomplete);
    }

    // Required
    if (validation?.required) {
      element.setAttribute('required', '');
    }

    // Pattern
    if (validation?.pattern) {
      element.setAttribute('pattern', validation.pattern);
    }

    // Validation data attribute
    if (validation) {
      element.setAttribute('data-validation', JSON.stringify(validation));
    }
  }
}
