import type { Template } from '../types';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';

export class TemplateForm {
  private editor: HTMLEditor;
  private element: HTMLElement;
  private onSubmit: (data: { name: string; content: string }) => void;
  private template?: Template;

  constructor(
    editor: HTMLEditor,
    onSubmit: (data: { name: string; content: string }) => void,
    template?: Template
  ) {
    this.editor = editor;
    this.element = document.createElement('div');
    this.onSubmit = onSubmit;
    this.template = template;
    this.initialize();
  }

  private initialize(): void {
    // Создание формы
    const form = document.createElement('form');
    form.className = 'space-y-4';

    // Поле для имени шаблона
    const nameContainer = document.createElement('div');
    const nameLabel = document.createElement('label');
    nameLabel.className = 'block text-sm font-medium text-gray-700';
    nameLabel.textContent = this.editor.t('Name');

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'template-name mt-1 block w-full rounded-md border-gray-300 shadow-sm';
    nameInput.value = this.template?.name || '';
    nameInput.required = true;

    nameContainer.appendChild(nameLabel);
    nameContainer.appendChild(nameInput);

    // Поле для содержимого шаблона
    const contentContainer = document.createElement('div');
    const contentLabel = document.createElement('label');
    contentLabel.className = 'block text-sm font-medium text-gray-700';
    contentLabel.textContent = this.editor.t('Content');

    const contentInput = document.createElement('textarea');
    contentInput.className =
      'template-content mt-1 block w-full rounded-md border-gray-300 shadow-sm h-40';
    contentInput.textContent = this.template?.content || '';
    contentInput.required = true;

    contentContainer.appendChild(contentLabel);
    contentContainer.appendChild(contentInput);

    // Сборка структуры формы
    form.appendChild(nameContainer);
    form.appendChild(contentContainer);

    // Обработчик отправки формы
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.onSubmit({
        name: nameInput.value,
        content: contentInput.value,
      });
    });

    // Добавление формы в основной элемент
    this.element.appendChild(form);
  }

  public getElement(): HTMLElement {
    return this.element;
  }
}
