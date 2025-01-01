export class FieldBuilder {
  createField(config: FieldConfig): HTMLElement | null {
    const { type, label, options, validation } = config;
    const fieldContainer = document.createElement('div');
    fieldContainer.className = 'form-field';

    const labelElement = document.createElement('label');
    labelElement.textContent = label;

    let inputElement: HTMLElement | null = null;

    switch (type) {
      case 'text':
      case 'email':
      case 'password':
      case 'number':
      case 'color':
      case 'date':
      case 'time':
      case 'range':
        inputElement = document.createElement('input');
        inputElement.setAttribute('type', type);
        break;
      case 'textarea':
        inputElement = document.createElement('textarea');
        break;
      case 'select':
        inputElement = document.createElement('select');
        if (options?.multiple) {
          inputElement.setAttribute('multiple', 'true');
        }
        options?.options?.forEach((optionValue: string) => {
          const option = document.createElement('option');
          option.value = optionValue;
          option.textContent = optionValue;
          inputElement?.appendChild(option);
        });
        break;
      case 'checkbox':
      case 'radio':
        inputElement = document.createElement('input');
        inputElement.setAttribute('type', type);
        if (options?.name) {
          inputElement.setAttribute('name', options.name);
        }
        break;
      case 'file':
        inputElement = document.createElement('input');
        inputElement.setAttribute('type', 'file');
        if (options?.multiple) {
          inputElement.setAttribute('multiple', 'true');
        }
        break;
      case 'button':
      case 'submit':
      case 'reset':
        inputElement = document.createElement('button');
        inputElement.setAttribute('type', type);
        inputElement.textContent = label;
        break;
      default:
        return null;
    }

    if (options?.value) {
      inputElement?.setAttribute('value', options.value);
    }
    if (options?.placeholder) {
      inputElement?.setAttribute('placeholder', options.placeholder);
    }
    if (options?.autocomplete) {
      inputElement?.setAttribute('autocomplete', options.autocomplete);
    }
    if (options?.readonly) {
      inputElement?.setAttribute('readonly', 'true');
    }
    if (options?.disabled) {
      inputElement?.setAttribute('disabled', 'true');
    }
    if (validation?.pattern) {
      inputElement?.setAttribute('pattern', validation.pattern);
    }
    if (validation?.minLength) {
      inputElement?.setAttribute('minlength', validation.minLength.toString());
    }
    if (validation?.maxLength) {
      inputElement?.setAttribute('maxlength', validation.maxLength.toString());
    }
    if (validation?.min) {
      inputElement?.setAttribute('min', validation.min.toString());
    }
    if (validation?.max) {
      inputElement?.setAttribute('max', validation.max.toString());
    }
    if (options?.className) {
      inputElement?.classList.add(options.className);
    }
    if (options?.id) {
      inputElement?.setAttribute('id', options.id);
    }

    fieldContainer.appendChild(labelElement);
    if (inputElement) {
      fieldContainer.appendChild(inputElement);
    }

    return fieldContainer;
  }
}

export interface FieldConfig {
  type: string;
  label: string;
  options?: {
    target?: string;
    placeholder?: string;
    autocomplete?: string;
    readonly?: boolean;
    disabled?: boolean;
    multiple?: boolean;
    name?: string;
    value?: string;
    className?: string;
    id?: string;
    options?: string[];
  };
  validation?: {
    required?: boolean;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
}
