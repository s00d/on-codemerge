import type { Template } from '../types';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';
import {
  createContainer,
  createForm,
  createInputField,
  createLabel,
  createTextarea,
} from '../../../utils/helpers.ts';

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
    this.element = createContainer();
    this.onSubmit = onSubmit;
    this.template = template;
    this.initialize();
  }

  private initialize(): void {
    // Создание формы
    const form = createForm('space-y-4');
    // Поле для имени шаблона
    const nameContainer = createContainer();
    const nameLabel = createLabel(this.editor.t('Name'));
    nameLabel.className = 'block text-sm font-medium text-gray-700';

    const nameInput = createInputField('text', 'Template Name', this.template?.name || '');
    nameInput.className = 'template-name mt-1 block w-full rounded-md border-gray-300 shadow-sm';
    nameInput.required = true;

    nameContainer.appendChild(nameLabel);
    nameContainer.appendChild(nameInput);

    // Поле для содержимого шаблона
    const contentContainer = createContainer();
    const contentLabel = createLabel(this.editor.t('Content'));
    contentLabel.className = 'block text-sm font-medium text-gray-700';

    const contentInput = createTextarea(this.editor.t('Content'), this.template?.content || '');
    contentInput.className =
      'template-content mt-1 block w-full rounded-md border-gray-300 shadow-sm h-40';
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
