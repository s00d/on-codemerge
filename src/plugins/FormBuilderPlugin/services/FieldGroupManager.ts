import {
  createContainer,
  createFieldset,
  createInputField,
  createLabel,
} from '../../../utils/helpers';

export class FieldGroupManager {
  createFieldset(legend: string, fields: HTMLElement[]): HTMLElement {
    const fieldset = createFieldset(legend);
    fields.forEach((field) => {
      fieldset.appendChild(field);
    });
    return fieldset;
  }

  createRadioGroup(name: string, options: string[]): HTMLElement {
    const container = createContainer();

    options.forEach((optionValue) => {
      const label = createLabel(optionValue);
      const input = createInputField('radio', '', optionValue);
      input.setAttribute('name', name);
      label.appendChild(input);
      container.appendChild(label);
    });

    return container;
  }
}
