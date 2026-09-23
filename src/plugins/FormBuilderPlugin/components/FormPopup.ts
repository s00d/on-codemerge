import { PopupController } from '@on-codemerge/sdk';
import type { DisposableScope, EditorAPI } from '@on-codemerge/sdk';
import type { FormTemplate } from '../types';
import { TemplateManager } from '../services/TemplateManager';

export interface FormPopupOptions {
  method: 'GET' | 'POST';
  action: string;
  hasSubmitButton: boolean;
  template?: FormTemplate;
}

/** Create-form chrome — declarative popup items only. */
export class FormPopup {
  private readonly editor: EditorAPI;
  private readonly popups: PopupController;
  private readonly templateManager: TemplateManager;
  private callback: ((options: FormPopupOptions) => void) | null = null;
  private selectedTemplateId = '';

  constructor(editor: EditorAPI, scope: DisposableScope) {
    this.editor = editor;
    this.popups = new PopupController((o) => editor.ui.popup.open(o), scope);
    this.templateManager = new TemplateManager(editor);
  }

  private templateLabels(): string[] {
    return [
      this.editor.t('templates.noTemplate'),
      ...this.templateManager.getTemplates().map((t) => t.name),
    ];
  }

  private templateIdForLabel(label: string): string {
    if (label === this.editor.t('templates.noTemplate')) {
      return '';
    }
    return this.templateManager.getTemplates().find((t) => t.name === label)?.id ?? '';
  }

  private open(defaults?: { method: string; action: string }): void {
    this.popups.open({
      title: this.editor.t('formBuilder.createForm'),
      className: 'form-popup',
      closeOnClickOutside: true,
      items: [
        {
          type: 'list',
          id: 'template',
          label: this.editor.t('templates.templateOptional'),
          options: this.templateLabels(),
          value: this.editor.t('templates.noTemplate'),
          onChange: (value) => {
            this.selectedTemplateId = this.templateIdForLabel(String(value));
            const template = this.selectedTemplateId
              ? this.templateManager.getTemplate(this.selectedTemplateId)
              : null;
            if (!template) {
              return;
            }
            this.open({
              method: template.config.method,
              action: template.config.action,
            });
          },
        },
        {
          type: 'list',
          id: 'method',
          label: this.editor.t('formBuilder.method2'),
          options: ['GET', 'POST'],
          value: defaults?.method ?? 'POST',
        },
        {
          type: 'url',
          id: 'action',
          label: this.editor.t('formBuilder.actionUrl2'),
          placeholder: this.editor.t('formBuilder.enterFormActionUrl') || '',
          value: defaults?.action ?? '',
        },
        {
          type: 'checkbox',
          id: 'hasSubmitButton',
          label: this.editor.t('formBuilder.includeSubmitButton'),
          value: true,
        },
      ],
      buttons: [
        {
          label: this.editor.t('common.cancel'),
          variant: 'secondary',
          onClick: () => {},
        },
        {
          label: this.editor.t('common.create'),
          variant: 'primary',
          onClick: (values) => {
            if (!this.callback) {
              return;
            }
            const options: FormPopupOptions = {
              method: (String(values.method) as 'GET' | 'POST') || 'POST',
              action: String(values.action ?? ''),
              hasSubmitButton: Boolean(values.hasSubmitButton),
            };
            const templateLabel = String(values.template ?? '');
            const templateId = this.templateIdForLabel(templateLabel);
            if (templateId) {
              const template = this.templateManager.getTemplate(templateId);
              if (template) {
                options.template = template;
              }
            }
            this.callback(options);
          },
        },
      ],
    });
  }

  public show(callback: (options: FormPopupOptions) => void): void {
    this.callback = callback;
    this.selectedTemplateId = '';
    this.open();
  }
}
