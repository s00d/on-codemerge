import { PopupManager } from '../../../core/ui/PopupManager';
import type { HTMLEditor } from '../../../app';
import type { FormTemplate } from '../types';
import { TemplateManager } from '../services/TemplateManager';
import {
  createContainer,
  createInputField,
  createLabel,
  createSelectField,
  createCheckbox,
} from '../../../utils/helpers';

export interface FormPopupOptions {
  method: 'GET' | 'POST';
  action: string;
  hasSubmitButton: boolean;
  template?: FormTemplate;
}

export class FormPopup {
  private readonly editor: HTMLEditor;
  private popup: PopupManager | null = null;
  private templateManager: TemplateManager;
  private callback: ((options: FormPopupOptions) => void) | null = null;

  // Ссылки на элементы
  private methodSelect: HTMLSelectElement | null = null;
  private actionInput: HTMLInputElement | null = null;
  private submitButtonCheckbox: HTMLInputElement | null = null;
  private templateSelect: HTMLSelectElement | null = null;

  constructor(editor: HTMLEditor) {
    this.editor = editor;
    this.templateManager = new TemplateManager(editor);
  }

  private createContent(): HTMLElement {
    const container = createContainer('p-4 space-y-4');

    // Template selection
    const templateSection = createContainer('template-section');
    const templateLabel = createLabel(this.editor.t('Template (optional):'));
    this.templateSelect = createSelectField(
      this.getTemplateOptions(),
      '',
      (value) => this.handleTemplateChange(value)
    );
    templateSection.appendChild(templateLabel);
    templateSection.appendChild(this.templateSelect);
    container.appendChild(templateSection);

    // Form method
    const methodSection = createContainer('method-section');
    const methodLabel = createLabel(this.editor.t('Method:'));
    this.methodSelect = createSelectField(
      [
        { value: 'GET', label: 'GET' },
        { value: 'POST', label: 'POST' },
      ],
      'POST',
      () => {}
    );
    methodSection.appendChild(methodLabel);
    methodSection.appendChild(this.methodSelect);
    container.appendChild(methodSection);

    // Form action
    const actionSection = createContainer('action-section');
    const actionLabel = createLabel(this.editor.t('Action URL:'));
    this.actionInput = createInputField(
      'text',
      this.editor.t('Enter form action URL'),
      '',
      () => {}
    ) as HTMLInputElement;
    actionSection.appendChild(actionLabel);
    actionSection.appendChild(this.actionInput);
    container.appendChild(actionSection);

    // Submit button option
    const submitSection = createContainer('submit-section');
    const submitLabel = createLabel('label');
    submitLabel.className = 'flex items-center gap-2';

    this.submitButtonCheckbox = createCheckbox(
      this.editor.t('Include submit button'),
      true,
      () => {}
    ) as HTMLInputElement;
    this.submitButtonCheckbox.id = 'submitButton';

    submitLabel.appendChild(this.submitButtonCheckbox);
    submitSection.appendChild(submitLabel);
    container.appendChild(submitSection);

    return container;
  }

  private getTemplateOptions(): Array<{ value: string; label: string }> {
    const templates = this.templateManager.getTemplates();
    const options = [{ value: '', label: this.editor.t('No template') }];

    templates.forEach(template => {
      options.push({
        value: template.id,
        label: template.name
      });
    });

    return options;
  }

  private handleTemplateChange(templateId: string): void {
    if (!templateId) return;

    const template = this.templateManager.getTemplate(templateId);
    if (template) {
      // Автозаполняем поля из шаблона
      if (this.methodSelect) {
        this.methodSelect.value = template.config.method;
      }
      if (this.actionInput) {
        this.actionInput.value = template.config.action;
      }
    }
  }

  private handleCreate(): void {
    if (!this.callback) return;

    const options: FormPopupOptions = {
      method: (this.methodSelect?.value as 'GET' | 'POST') || 'POST',
      action: this.actionInput?.value || '',
      hasSubmitButton: this.submitButtonCheckbox?.checked || false,
    };

    // Если выбран шаблон, добавляем его
    if (this.templateSelect?.value) {
      const template = this.templateManager.getTemplate(this.templateSelect.value);
      if (template) {
        options.template = template;
      }
    }

    this.callback(options);
    this.popup?.hide();
  }

  public show(callback: (options: FormPopupOptions) => void): void {
    this.callback = callback;
    if (!this.popup) {
      this.popup = new PopupManager(this.editor, {
        title: this.editor.t('Create Form'),
        className: 'form-popup',
        closeOnClickOutside: true,
        buttons: [
          {
            label: this.editor.t('Create'),
            variant: 'primary',
            onClick: () => this.handleCreate(),
          },
          {
            label: this.editor.t('Cancel'),
            variant: 'secondary',
            onClick: () => this.popup!.hide(),
          },
        ],
        items: [
          {
            type: 'custom',
            id: 'form-content',
            content: () => this.createContent(),
          },
        ],
      });
    }
    this.popup.show();
  }

  public destroy(): void {
    if (this.popup) {
      this.popup.destroy();
      this.popup = null;
    }
    this.callback = null;
  }
}
