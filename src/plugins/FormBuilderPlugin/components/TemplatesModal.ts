import { PopupManager } from '../../../core/ui/PopupManager';
import type { HTMLEditor } from '../../../app';
import type { FormTemplate } from '../types';
import { TemplateManager } from '../services/TemplateManager';
import {
  createContainer,
  createButton,
  createLabel,
  createInputField,
} from '../../../utils/helpers';

export class TemplatesModal {
  private editor: HTMLEditor;
  private popup: PopupManager;
  private templateManager: TemplateManager;
  private callback: ((template: FormTemplate) => void) | null = null;
  private searchInput: HTMLInputElement | null = null;
  private templatesContainer: HTMLElement | null = null;
  private selectedCategory: string = 'all';

  constructor(editor: HTMLEditor) {
    this.editor = editor;
    this.templateManager = new TemplateManager(editor);
    this.templateManager.initialize();

    this.popup = new PopupManager(editor, {
      title: editor.t('Form Templates'),
      className: 'templates-modal',
      closeOnClickOutside: true,
      buttons: [
        {
          label: editor.t('Cancel'),
          variant: 'secondary',
          onClick: () => this.popup.hide(),
        },
      ],
      items: [
        {
          type: 'custom',
          id: 'templates-content',
          content: () => this.createContent(),
        },
      ],
    });
  }

  private createContent(): HTMLElement {
    const container = createContainer('templates-modal-content');

    // Поиск
    const searchContainer = createContainer('search-container');
    const searchLabel = createLabel('Search templates:');
    this.searchInput = createInputField('text', 'Search templates...', '', (_value) => {
      this.renderTemplates();
    });
    searchContainer.appendChild(searchLabel);
    searchContainer.appendChild(this.searchInput);
    container.appendChild(searchContainer);

    // Фильтр по категориям
    const filterContainer = createContainer('filter-container');
    const filterLabel = createLabel('Category:');
    const categorySelect = createInputField('select', '', 'all', (value) => {
      this.selectedCategory = value;
      this.renderTemplates();
    });

    const categories = this.templateManager.getCategories();
    const categoryNames = this.templateManager.getCategoryNames();

    categorySelect.innerHTML = '<option value="all">All Categories</option>';
    categories.forEach((category) => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = categoryNames[category];
      categorySelect.appendChild(option);
    });

    filterContainer.appendChild(filterLabel);
    filterContainer.appendChild(categorySelect);
    container.appendChild(filterContainer);

    // Контейнер для шаблонов
    this.templatesContainer = createContainer('templates-grid');
    container.appendChild(this.templatesContainer);

    this.renderTemplates();

    return container;
  }

  private renderTemplates(): void {
    if (!this.templatesContainer) return;

    this.templatesContainer.innerHTML = '';

    const templates = this.templateManager.getTemplates();
    const filteredTemplates = templates.filter((template) => {
      const matchesCategory =
        this.selectedCategory === 'all' || template.category === this.selectedCategory;
      const matchesSearch =
        !this.searchInput?.value ||
        template.name.toLowerCase().includes(this.searchInput.value.toLowerCase()) ||
        template.description.toLowerCase().includes(this.searchInput.value.toLowerCase());

      return matchesCategory && matchesSearch;
    });

    if (filteredTemplates.length === 0) {
      const noTemplates = createContainer('no-templates');
      noTemplates.textContent = this.editor.t('No templates found');
      this.templatesContainer.appendChild(noTemplates);
      return;
    }

    filteredTemplates.forEach((template) => {
      const templateCard = this.createTemplateCard(template);
      this.templatesContainer!.appendChild(templateCard);
    });
  }

  private createTemplateCard(template: FormTemplate): HTMLElement {
    const card = createContainer('template-card');

    const header = createContainer('template-card-header');
    const title = createContainer('template-card-title');
    title.textContent = template.name;
    const category = createContainer('template-card-category');
    category.textContent = this.templateManager.getCategoryNames()[template.category];
    header.appendChild(title);
    header.appendChild(category);

    const description = createContainer('template-card-description');
    description.textContent = template.description;

    const fieldsInfo = createContainer('template-card-fields');
    fieldsInfo.textContent = `${template.config.fields.length} fields`;

    const useButton = createButton(
      this.editor.t('Use Template'),
      () => this.selectTemplate(template),
      'primary'
    );

    card.appendChild(header);
    card.appendChild(description);
    card.appendChild(fieldsInfo);
    card.appendChild(useButton);

    return card;
  }

  private selectTemplate(template: FormTemplate): void {
    this.callback?.(template);
    this.popup.hide();
  }

  public show(callback: (template: FormTemplate) => void): void {
    this.callback = callback;
    this.popup.show();
  }

  public destroy(): void {
    this.popup.destroy();
    this.callback = null;
    this.searchInput = null;
    this.templatesContainer = null;
  }
}
