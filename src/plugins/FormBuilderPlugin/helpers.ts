export function createInputField(
  type: string = 'text',
  placeholder: string = '',
  defaultValue: string = '',
  onChange?: (value: string) => void
): HTMLInputElement {
  const input = document.createElement('input');
  input.type = type;
  input.placeholder = placeholder;
  input.value = defaultValue;
  input.className =
    'form-input w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500    border bg-white border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all';

  if (onChange) {
    input.addEventListener('input', (e) => {
      onChange((e.target as HTMLInputElement).value);
    });
  }

  return input;
}

export function createSelectField(
  options: { value: string; label: string }[],
  defaultValue: string = '',
  onChange?: (value: string) => void
): HTMLSelectElement {
  const select = document.createElement('select');
  select.className =
    'form-select w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  options.forEach((option) => {
    const opt = document.createElement('option');
    opt.value = option.value;
    opt.textContent = option.label;
    select.appendChild(opt);
  });

  select.value = defaultValue;

  if (onChange) {
    select.addEventListener('change', (e) => {
      onChange((e.target as HTMLSelectElement).value);
    });
  }

  return select;
}

export function createCheckbox(
  labelText: string | null,
  isChecked: boolean = false,
  onChange?: (isChecked: boolean) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'flex items-center';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = isChecked;
  checkbox.className = 'form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out';

  if (onChange) {
    checkbox.addEventListener('change', (e) => {
      onChange((e.target as HTMLInputElement).checked);
    });
  }

  const label = document.createElement('label');
  label.textContent = labelText ?? '';
  label.className = 'ml-2 text-sm text-gray-700';

  container.appendChild(checkbox);
  if (labelText) container.appendChild(label);

  return container;
}

export function createLabel(text: string, forId: string = ''): HTMLLabelElement {
  const label = document.createElement('label');
  label.textContent = text;
  label.className = 'block text-sm font-medium text-gray-700 mb-1';
  if (forId) {
    label.htmlFor = forId;
  }

  return label;
}

// Хелпер для создания кнопки
export function createButton(
  text: string,
  onClick: () => void,
  variant: 'primary' | 'secondary' | 'danger' = 'primary'
): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = text;
  button.className = `px-4 py-2 rounded-md text-sm font-medium ${
    variant === 'primary'
      ? 'bg-blue-500 text-white hover:bg-blue-600'
      : variant === 'secondary'
        ? 'bg-gray-300 text-gray-700 hover:bg-gray-400'
        : 'bg-red-500 text-white hover:bg-red-600'
  }`;

  button.addEventListener('click', onClick);

  return button;
}

export function createContainer(className: string = ''): HTMLDivElement {
  const container = document.createElement('div');
  container.className = className;

  return container;
}
