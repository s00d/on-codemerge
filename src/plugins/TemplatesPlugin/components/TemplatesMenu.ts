import { PopupManager } from '../../../core/ui/PopupManager';
import type { TemplateManager } from '../services/TemplateManager';
import type { Template } from '../types';
import { TemplatesList } from './TemplatesList';
import { TemplateForm } from './TemplateForm';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';

export class TemplatesMenu {
  private popup: PopupManager;
  private editor: HTMLEditor;
  private manager: TemplateManager;
  private list: TemplatesList;
  private onSelect: ((template: Template) => void) | null = null;

  constructor(manager: TemplateManager, editor: HTMLEditor) {
    this.editor = editor;
    this.manager = manager;
    this.list = new TemplatesList(
      this.editor,
      (template) => this.handleSelect(template),
      (template) => this.showEditForm(template),
      (template) => this.handleDelete(template)
    );

    // Initialize main popup
    this.popup = this.createMainPopup();
    this.updateContent();
  }

  private createMainPopup(): PopupManager {
    return new PopupManager(this.editor, {
      title: this.editor.t('Templates'),
      className: 'templates-menu',
      closeOnClickOutside: true,
      buttons: [
        {
          label: this.editor.t('New Template'),
          variant: 'primary',
          onClick: () => this.showNewForm(),
        },
      ],
      items: [
        {
          type: 'custom',
          id: 'templates-content',
          content: () => this.list.getElement(),
        },
      ],
    });
  }

  private updateContent(): void {
    const templates = this.manager.getTemplates();
    this.list.setTemplates(templates);
    this.popup.setContent(this.list.getElement());
  }

  private showNewForm(): void {
    const form = new TemplateForm(this.editor, (data) => {
      this.manager.saveTemplate(data);
      this.popup.hide();
      this.popup = this.createMainPopup();
      this.updateContent();
      this.popup.show();
    });

    this.popup = new PopupManager(this.editor, {
      title: this.editor.t('New'),
      className: 'templates-menu',
      closeOnClickOutside: true,
      buttons: [
        {
          label: this.editor.t('Cancel'),
          variant: 'secondary',
          onClick: () => {
            this.popup = this.createMainPopup();
            this.updateContent();
            this.popup.show();
          },
        },
        {
          label: this.editor.t('Save'),
          variant: 'primary',
          onClick: () => {
            const formEl = form.getElement().querySelector('form');
            if (formEl) {
              const submitEvent = new Event('submit', {
                bubbles: true,
                cancelable: true,
              });
              formEl.dispatchEvent(submitEvent);
            }
          },
        },
      ],
      items: [
        {
          type: 'custom',
          id: 'template-form',
          content: () => form.getElement(),
        },
      ],
    });

    this.popup.show();
  }

  private showEditForm(template: Template): void {
    const form = new TemplateForm(
      this.editor,
      (data) => {
        this.manager.updateTemplate(template.id, data);
        this.popup.hide();
        this.popup = this.createMainPopup();
        this.updateContent();
        this.popup.show();
      },
      template
    );

    this.popup = new PopupManager(this.editor, {
      title: this.editor.t('Edit'),
      className: 'templates-menu',
      closeOnClickOutside: true,
      buttons: [
        {
          label: this.editor.t('Cancel'),
          variant: 'secondary',
          onClick: () => {
            this.popup = this.createMainPopup();
            this.updateContent();
            this.popup.show();
          },
        },
        {
          label: this.editor.t('Update'),
          variant: 'primary',
          onClick: () => {
            const formEl = form.getElement().querySelector('form');
            if (formEl) {
              const submitEvent = new Event('submit', {
                bubbles: true,
                cancelable: true,
              });
              formEl.dispatchEvent(submitEvent);
            }
          },
        },
      ],
      items: [
        {
          type: 'custom',
          id: 'template-form',
          content: () => form.getElement(),
        },
      ],
    });

    this.popup.show();
  }

  private handleSelect(template: Template): void {
    this.onSelect?.(template);
    this.popup.hide();
  }

  private handleDelete(template: Template): void {
    if (confirm(this.editor.t('Are you sure you want to delete this template?'))) {
      this.manager.deleteTemplate(template.id);
      this.updateContent();
    }
  }

  public show(onSelect: (template: Template) => void): void {
    this.onSelect = onSelect;
    this.updateContent();
    this.popup.show();
  }

  public destroy(): void {
    // Уничтожение всплывающего окна
    if (this.popup) {
      this.popup.hide(); // Скрыть всплывающее окно
      if (typeof this.popup.destroy === 'function') {
        this.popup.destroy(); // Если есть метод destroy, вызвать его
      }
      this.popup = null!; // Очистить ссылку
    }

    // Уничтожение списка шаблонов
    if (this.list) {
      this.list.destroy();
      this.list = null!; // Очистить ссылку
    }

    // Очистка ссылок на другие объекты
    this.editor = null!;
    this.manager = null!;
    this.onSelect = null;
  }
}
