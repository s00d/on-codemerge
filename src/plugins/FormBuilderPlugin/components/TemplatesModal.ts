import { PopupController, foreign, h, mount } from '@on-codemerge/sdk';
import type { DisposableScope, EditorAPI, MountHandle, ViewSpec } from '@on-codemerge/sdk';
import type { FormTemplate } from '../types';
import { TemplateManager } from '../services/TemplateManager';

/** Form templates picker — ViewSpec grid; search/filter keep focus via mount.update. */
export class TemplatesModal {
  private readonly editor: EditorAPI;
  private readonly popups: PopupController;
  private readonly templateManager: TemplateManager;
  private callback: ((template: FormTemplate) => void) | null = null;
  private search = '';
  private selectedCategory = 'all';

  constructor(editor: EditorAPI, scope: DisposableScope) {
    this.editor = editor;
    this.popups = new PopupController((o) => editor.ui.popup.open(o), scope);
    this.templateManager = new TemplateManager(editor);
    this.templateManager.initialize();
  }

  private filtered(): FormTemplate[] {
    return this.templateManager.getTemplates().filter((template) => {
      const matchesCategory =
        this.selectedCategory === 'all' || template.category === this.selectedCategory;
      const q = this.search.toLowerCase();
      const matchesSearch =
        !q ||
        template.name.toLowerCase().includes(q) ||
        template.description.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }

  private gridView(): ViewSpec {
    const templates = this.filtered();
    const categoryNames = this.templateManager.getCategoryNames();

    if (templates.length === 0) {
      return h('div', { class: 'no-templates' }, this.editor.t('templates.noTemplatesFound'));
    }

    return h(
      'div',
      { class: 'templates-grid' },
      ...templates.map((template) =>
        h('div', { class: 'template-card' }, [
          h('div', { class: 'template-card-header' }, [
            h('div', { class: 'template-card-title' }, template.name),
            h(
              'div',
              { class: 'template-card-category' },
              categoryNames[template.category] ?? template.category
            ),
          ]),
          h('div', { class: 'template-card-description' }, template.description),
          h('div', { class: 'template-card-fields' }, `${template.config.fields.length} fields`),
          h(
            'button',
            {
              class: 'ocm-popup__btn ocm-popup__btn--primary',
              attrs: { type: 'button' },
              on: {
                click: () => {
                  this.selectTemplate(template);
                },
              },
            },
            this.editor.t('templates.useTemplate')
          ),
        ])
      )
    );
  }

  private bodyView(): ViewSpec {
    const categories = this.templateManager.getCategories();
    const categoryNames = this.templateManager.getCategoryNames();

    return foreign((host, scope) => {
      host.className = 'templates-modal-content';
      let grid: MountHandle | null = null;
      const refreshGrid = () => grid?.update(this.gridView());

      const shell = mount(
        host,
        h('div', { class: 'templates-shell' }, [
          h('div', { class: 'search-container' }, [
            h('label', null, 'Search templates:'),
            h('input', {
              class: 'w-full p-2 border rounded',
              attrs: { type: 'text', placeholder: 'Search templates...' },
              props: { value: this.search },
              on: {
                input: (e) => {
                  const t = e.target;
                  if (!(t instanceof HTMLInputElement)) {
                    return;
                  }
                  this.search = t.value;
                  refreshGrid();
                },
              },
            }),
          ]),
          h('div', { class: 'filter-container' }, [
            h('label', null, 'Category:'),
            h(
              'select',
              {
                class: 'w-full p-2 border rounded',
                props: { value: this.selectedCategory },
                on: {
                  change: (e) => {
                    const t = e.target;
                    if (!(t instanceof HTMLSelectElement)) {
                      return;
                    }
                    this.selectedCategory = t.value;
                    refreshGrid();
                  },
                },
              },
              h('option', { attrs: { value: 'all' } }, 'All Categories'),
              ...categories.map((category) =>
                h('option', { attrs: { value: category } }, categoryNames[category] ?? category)
              )
            ),
          ]),
          foreign((gridHost, gScope) => {
            grid = mount(gridHost, this.gridView());
            gScope.own(grid);
          }),
        ])
      );
      scope.own(shell);
    });
  }

  private selectTemplate(template: FormTemplate): void {
    this.callback?.(template);
    this.popups.close();
  }

  public show(callback: (template: FormTemplate) => void): void {
    this.callback = callback;
    this.search = '';
    this.selectedCategory = 'all';
    this.popups.open({
      title: this.editor.t('templates.formTemplates'),
      className: 'templates-modal',
      size: 'lg',
      closeOnClickOutside: true,
      items: [{ type: 'view', id: 'templates-content', view: () => this.bodyView() }],
      buttons: [
        {
          label: this.editor.t('common.cancel'),
          variant: 'secondary',
          onClick: () => {},
        },
      ],
    });
  }
}
