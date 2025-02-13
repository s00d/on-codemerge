import type { Template } from '../types';
import { formatDate } from '../utils/formatters';
import { editIcon, deleteIcon } from '../../../icons';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';
import { createButton, createContainer } from '../../../utils/helpers.ts';

export class TemplatesList {
  private editor: HTMLEditor;
  private element: HTMLElement;
  private templates: Template[] = [];
  private onSelect: (template: Template) => void;
  private onEdit: (template: Template) => void;
  private onDelete: (template: Template) => void;

  constructor(
    editor: HTMLEditor,
    onSelect: (template: Template) => void,
    onEdit: (template: Template) => void,
    onDelete: (template: Template) => void
  ) {
    this.editor = editor;
    this.element = createContainer();
    this.onSelect = onSelect;
    this.onEdit = onEdit;
    this.onDelete = onDelete;
  }

  public setTemplates(templates: Template[]): void {
    this.templates = templates;
    this.render();
  }

  private render(): void {
    // Очистка контейнера
    this.element.innerHTML = '';

    if (this.templates.length === 0) {
      // Отображение сообщения, если шаблонов нет
      const emptyMessage = createContainer(
        'text-center text-gray-500 py-4',
        'No templates yet. Click "New Template" to create one.'
      );
      this.element.appendChild(emptyMessage);
      return;
    }

    // Контейнер для списка шаблонов
    const listContainer = createContainer('space-y-2');

    // Создание элементов для каждого шаблона
    this.templates.forEach((template) => {
      const templateItem = this.createTemplateItem(template);
      listContainer.appendChild(templateItem);
    });

    // Добавление списка в основной контейнер
    this.element.appendChild(listContainer);

    // Настройка обработчиков событий
    this.setupEventListeners();
  }

  private createTemplateItem(template: Template): HTMLElement {
    const templateItem = createContainer('template-item');
    templateItem.dataset.templateId = template.id;

    const templateContent = createContainer(
      'flex items-center justify-between p-3 rounded-lg cursor-pointer'
    );

    // Левая часть: название и дата обновления
    const templateInfo = createContainer('div');
    const templateName = createContainer('font-medium', template.name);
    const templateDate = createContainer(
      'ext-xs text-gray-500',
      this.editor.t('Updated') + ` ${formatDate(template.updatedAt)}`
    );

    templateInfo.appendChild(templateName);
    templateInfo.appendChild(templateDate);

    // Правая часть: кнопки редактирования и удаления
    const templateActions = createContainer('flex items-center gap-2');
    const editButton = createButton('', () => {});
    editButton.className = 'edit-button p-1 text-gray-500 hover:text-gray-700 rounded';
    editButton.innerHTML = editIcon;

    const deleteButton = createButton('', () => {});
    deleteButton.className = 'delete-button p-1 text-gray-500 hover:text-red-600 rounded';
    deleteButton.innerHTML = deleteIcon;

    templateActions.appendChild(editButton);
    templateActions.appendChild(deleteButton);

    // Сборка структуры
    templateContent.appendChild(templateInfo);
    templateContent.appendChild(templateActions);
    templateItem.appendChild(templateContent);

    return templateItem;
  }

  private setupEventListeners(): void {
    this.element.addEventListener('click', (e) => {
      const target = e.target as Element;
      const templateEl = target.closest('[data-template-id]');
      if (!templateEl) return;

      const id = templateEl.getAttribute('data-template-id');
      if (!id) return;

      const template = this.templates.find((t) => t.id === id);
      if (!template) return;

      if (target.closest('.delete-button')) {
        this.onDelete(template);
      } else if (target.closest('.edit-button')) {
        this.onEdit(template);
      } else {
        this.onSelect(template);
      }
    });
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public destroy(): void {
    // Удаление обработчиков событий
    this.element.removeEventListener('click', this.setupEventListeners);

    // Удаление элемента из DOM
    if (this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }

    // Очистка ссылок
    this.editor = null!;
    this.element = null!;
    this.templates = [];
    this.onSelect = null!;
    this.onEdit = null!;
    this.onDelete = null!;
  }
}
