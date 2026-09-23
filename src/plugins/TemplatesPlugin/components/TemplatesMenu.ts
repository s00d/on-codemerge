import { PopupController, h } from '@on-codemerge/sdk';
import type { DisposableScope, EditorAPI, ViewSpec } from '@on-codemerge/sdk';
import type { TemplateManager } from '../services/TemplateManager';
import type { Template } from '../types';
import { formatDate } from '../utils/formatters';
import { deleteIcon, editIcon } from '../../../icons';

/** Templates chrome — PopupController + ViewSpec (no destroy/hide). */
export class TemplatesMenu {
  private readonly popups: PopupController;
  private readonly editor: EditorAPI;
  private readonly manager: TemplateManager;
  private onSelect: ((template: Template) => void) | null = null;

  constructor(manager: TemplateManager, editor: EditorAPI, scope: DisposableScope) {
    this.editor = editor;
    this.manager = manager;
    this.popups = new PopupController((o) => editor.ui.popup.open(o), scope);
  }

  private listView(): ViewSpec {
    const templates = this.manager.getTemplates();
    if (templates.length === 0) {
      return h(
        'div',
        { class: 'text-center text-gray-500 py-4' },
        this.editor.t('templates.noTemplatesYetClickNewTemplateToCreateOne') ||
          'No templates yet. Click "New Template" to create one.'
      );
    }

    return h(
      'div',
      { class: 'space-y-2' },
      ...templates.map((template) =>
        h(
          'div',
          {
            class: 'template-item',
            attrs: { 'data-template-id': template.id },
            on: {
              click: () => {
                this.handleSelect(template);
              },
            },
          },
          h('div', { class: 'flex items-center justify-between p-3 rounded-lg cursor-pointer' }, [
            h('div', null, [
              h('div', { class: 'font-medium' }, template.name),
              h(
                'div',
                { class: 'text-xs text-gray-500' },
                `${this.editor.t('common.updated')} ${formatDate(template.updatedAt)}`
              ),
            ]),
            h('div', { class: 'flex items-center gap-2' }, [
              h('button', {
                class: 'edit-button p-1 text-gray-500 hover:text-gray-700 rounded',
                attrs: { type: 'button', title: this.editor.t('common.edit') },
                props: { innerHTML: editIcon },
                on: {
                  click: (e) => {
                    e.stopPropagation();
                    this.showEditForm(template);
                  },
                },
              }),
              h('button', {
                class: 'delete-button p-1 text-gray-500 hover:text-red-600 rounded',
                attrs: { type: 'button', title: this.editor.t('common.delete') },
                props: { innerHTML: deleteIcon },
                on: {
                  click: (e) => {
                    e.stopPropagation();
                    this.handleDelete(template);
                  },
                },
              }),
            ]),
          ])
        )
      )
    );
  }

  private openMain(): void {
    this.popups.open({
      title: this.editor.t('common.templates'),
      className: 'templates-menu',
      size: 'lg',
      closeOnClickOutside: true,
      buttons: [
        {
          label: this.editor.t('templates.newTemplate'),
          variant: 'primary',
          onClick: () => {
            this.showNewForm();
            return true;
          },
        },
      ],
      items: [{ type: 'view', id: 'templates-content', view: () => this.listView() }],
    });
  }

  private openForm(
    title: string,
    initial: { name: string; content: string },
    submitLabel: string,
    onSave: (data: { name: string; content: string }) => void
  ): void {
    this.popups.open({
      title: this.editor.t(title),
      className: 'templates-menu',
      size: 'lg',
      closeOnClickOutside: true,
      items: [
        {
          type: 'input',
          id: 'name',
          label: this.editor.t('common.name'),
          placeholder: this.editor.t('templates.templateName'),
          value: initial.name,
        },
        {
          type: 'textarea',
          id: 'content',
          label: this.editor.t('common.content'),
          placeholder: this.editor.t('common.content'),
          value: initial.content,
        },
      ],
      buttons: [
        {
          label: this.editor.t('common.cancel'),
          variant: 'secondary',
          onClick: () => {
            this.openMain();
            return true;
          },
        },
        {
          label: this.editor.t(submitLabel),
          variant: 'primary',
          onClick: (values) => {
            const name = String(values.name ?? '').trim();
            const content = String(values.content ?? '');
            if (!name) {
              return true;
            }
            onSave({ name, content });
            return true;
          },
        },
      ],
    });
  }

  private showNewForm(): void {
    this.openForm('New Template', { name: '', content: '' }, 'Save', (data) => {
      this.manager.saveTemplate(data);
      this.openMain();
    });
  }

  private showEditForm(template: Template): void {
    this.openForm(
      'Edit Template',
      { name: template.name, content: template.content },
      'Update',
      (data) => {
        this.manager.updateTemplate(template.id, data);
        this.openMain();
      }
    );
  }

  private handleSelect(template: Template): void {
    this.onSelect?.(template);
    this.popups.close();
  }

  private handleDelete(template: Template): void {
    if (confirm(this.editor.t('templates.areYouSureYouWantToDeleteThisTemplate'))) {
      this.manager.deleteTemplate(template.id);
      this.openMain();
    }
  }

  public show(onSelect: (template: Template) => void): void {
    this.onSelect = onSelect;
    this.openMain();
  }
}
