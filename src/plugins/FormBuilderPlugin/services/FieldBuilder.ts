import {
  createButton,
  createCheckbox,
  createContainer,
  createFileInput,
  createInputField,
  createLabel,
  createSelectField,
  createTextarea,
} from '../../../utils/helpers.ts';

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

export class FieldBuilder {
  createField(config: FieldConfig): HTMLElement | null {
    const { type, label, options, validation } = config;
    const fieldContainer = createContainer('form-field');

    const labelElement = createLabel(label, options?.id);

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
        inputElement = createInputField(type, options?.placeholder, options?.value);
        break;
      case 'textarea':
        inputElement = createTextarea(options?.placeholder, options?.value);
        break;
      case 'select':
        inputElement = createSelectField(
          options?.options?.map((opt) => ({ value: opt, label: opt })) || [],
          options?.value
        );
        if (options?.multiple) {
          inputElement.setAttribute('multiple', 'true');
        }
        break;
      case 'checkbox':
      case 'radio':
        inputElement = createCheckbox(label, options?.value === 'true');
        if (options?.name) {
          inputElement.setAttribute('name', options.name);
        }
        break;
      case 'file':
        inputElement = createFileInput(options?.multiple);
        break;
      case 'button':
      case 'submit':
      case 'reset':
        inputElement = createButton(label, () => {}, type as 'primary' | 'secondary' | 'danger');
        break;
      default:
        return null;
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
