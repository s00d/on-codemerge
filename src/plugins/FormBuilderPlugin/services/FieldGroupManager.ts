export class FieldGroupManager {
  createFieldset(legend: string, fields: HTMLElement[]): HTMLElement {
    const fieldset = document.createElement('fieldset');
    const legendElement = document.createElement('legend');
    legendElement.textContent = legend;
    fieldset.appendChild(legendElement);

    fields.forEach((field) => {
      fieldset.appendChild(field);
    });

    return fieldset;
  }

  createRadioGroup(name: string, options: string[]): HTMLElement {
    const container = document.createElement('div');
    options.forEach((optionValue) => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.setAttribute('type', 'radio');
      input.setAttribute('name', name);
      input.setAttribute('value', optionValue);
      label.appendChild(input);
      label.appendChild(document.createTextNode(optionValue));
      container.appendChild(label);
    });

    return container;
  }
}
