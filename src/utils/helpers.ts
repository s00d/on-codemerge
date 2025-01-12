type Callback = (value: string) => void;
type CallbackChecked = (isChecked: boolean) => void;
type FileChecked = (files: FileList | null) => void;

export function createInputField(
  type: string = 'text',
  placeholder: string = '',
  defaultValue: string = '',
  onChange?: Callback | null
): HTMLInputElement {
  const input = document.createElement('input');
  input.type = type;
  input.placeholder = placeholder;
  input.value = defaultValue;
  input.className =
    'form-input w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all';

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
  onChange?: Callback | null
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
  onChange?: CallbackChecked | null
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
  onClick: (e: MouseEvent) => void,
  variant: 'primary' | 'secondary' | 'danger' = 'primary'
): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = text;
  button.type = 'button';
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

export function createContainer(
  className: string = '',
  content: null | string = null
): HTMLDivElement {
  const container = document.createElement('div');
  container.className = className;

  if (content) {
    container.textContent = content;
  }

  return container;
}

export function createP(className: string = '', content: null | string = null): HTMLDivElement {
  const container = document.createElement('p');
  container.className = className;

  if (content) {
    container.textContent = content;
  }

  return container;
}

export function createSpan(className: string = '', content: null | string = null): HTMLSpanElement {
  const container = document.createElement('span');
  container.className = className;

  if (content) {
    container.textContent = content;
  }

  return container;
}

export function createKbd(className: string = '', content: null | string = null): HTMLElement {
  const container = document.createElement('kbd');
  container.className = className;

  if (content) {
    container.textContent = content;
  }

  return container;
}

export function createLink(
  text: string,
  href: string = '#',
  target: '_blank' | '_self' | '_parent' | '_top' = '_self',
  className: string = 'text-blue-500 hover:text-blue-700 underline'
): HTMLAnchorElement {
  const link = document.createElement('a');
  link.textContent = text;
  link.href = href;
  link.target = target;
  link.className = className;

  return link;
}

export function createTextarea(
  placeholder: string = '',
  defaultValue: string = '',
  onChange?: Callback | null
): HTMLTextAreaElement {
  const textarea = document.createElement('textarea');
  textarea.placeholder = placeholder;
  textarea.value = defaultValue;
  textarea.className =
    'form-textarea w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  if (onChange) {
    textarea.addEventListener('input', (e) => {
      onChange((e.target as HTMLTextAreaElement).value);
    });
  }

  return textarea;
}

export function createFileInput(
  multiple: boolean = false,
  onChange?: FileChecked | null
): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = multiple;
  input.className =
    'form-input w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  if (onChange) {
    input.addEventListener('change', (e) => {
      onChange((e.target as HTMLInputElement).files);
    });
  }

  return input;
}

export function createFieldset(legend: string = ''): HTMLFieldSetElement {
  const fieldset = document.createElement('fieldset');
  if (legend) {
    const legendElement = document.createElement('legend');
    legendElement.textContent = legend;
    fieldset.appendChild(legendElement);
  }
  return fieldset;
}

export function createForm(
  className: string = '',
  action: string | 'POST' | 'GET' | null = null,
  method: string | null = null
): HTMLFormElement {
  const form = document.createElement('form');
  if (action) form.action = action;
  if (method) form.method = method;
  form.className = className;
  return form;
}

export function createSelectOption(value: string, text: string): HTMLOptionElement {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = text;
  return option;
}

export function createLineBreak(
  className: string = '',
  content: null | string = null
): HTMLBRElement {
  const br = document.createElement('br');
  br.className = className;

  if (content) {
    br.textContent = content;
  }

  return br;
}

export function createHr(className: string = '', content: null | string = null): HTMLHRElement {
  const hr = document.createElement('hr');
  hr.className = className;

  if (content) {
    hr.textContent = content;
  }

  return hr;
}

export function createH(
  type: 'h1' | 'h2' | 'h3' | 'h4',
  className: string = '',
  content: null | string = null
): HTMLHeadingElement {
  const hr = document.createElement(type);
  hr.className = className;

  if (content) {
    hr.textContent = content;
  }

  return hr;
}

export function createIframe(
  className: string = '',
  content: null | string = null
): HTMLIFrameElement {
  const iframe = document.createElement('iframe');
  iframe.className = className;

  if (content) {
    iframe.textContent = content;
  }

  return iframe;
}

export function createVideo(
  className: string = '',
  content: null | string = null
): HTMLVideoElement {
  const video = document.createElement('video');
  video.className = className;

  if (content) {
    video.textContent = content;
  }

  return video;
}

export function createPre(className: string = '', content: null | string = null): HTMLPreElement {
  const pre = document.createElement('pre');
  pre.className = className;

  if (content) {
    pre.textContent = content;
  }

  return pre;
}

export function createSup(className: string = '', content: null | string = null): HTMLElement {
  const sup = document.createElement('sup');
  sup.className = className;

  if (content) {
    sup.textContent = content;
  }

  return sup;
}

export function createCode(className: string = '', content: null | string = null): HTMLElement {
  const code = document.createElement('code');
  code.className = className;

  if (content) {
    code.textContent = content;
  }

  return code;
}

export function createImg(className: string = '', src: null | string = null): HTMLImageElement {
  const img = document.createElement('img');
  img.className = className;

  if (src) {
    img.src = src;
  }

  return img;
}

export function createOl(className: string = ''): HTMLOListElement {
  const ol = document.createElement('ol');
  ol.className = className;

  return ol;
}

export function createLi(className: string = ''): HTMLLIElement {
  const li = document.createElement('li');
  li.className = className;

  return li;
}

export function createUl(className: string = ''): HTMLUListElement {
  const ul = document.createElement('ul');
  ul.className = className;

  return ul;
}

export function createTh(className: string = ''): HTMLTableCellElement {
  const th = document.createElement('th');
  th.className = className;

  return th;
}

export function createCanvas(): HTMLCanvasElement {
  return document.createElement('canvas');
}
