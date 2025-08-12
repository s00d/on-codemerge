import type { Command } from '../../../core/commands/Command';
import type { HTMLEditor } from '../../../app';
import type { FormConfig } from '../types';
import { FormManager } from '../services/FormManager';
import { createLineBreak } from '../../../utils/helpers';

export class DuplicateFormCommand implements Command {
  private formElement: HTMLElement;
  private formManager: FormManager;
  private editor: HTMLEditor;

  constructor(editor: HTMLEditor, formElement: HTMLElement) {
    this.formElement = formElement;
    this.formManager = new FormManager(editor);
    this.editor = editor;
  }

  execute(): void {
    // Парсим существующую форму
    const formConfig = this.formManager.parseForm(this.formElement);
    if (!formConfig) {
      console.error('Failed to parse form configuration');
      return;
    }

    // Создаем копию с новыми ID
    const duplicatedConfig = this.createDuplicatedConfig(formConfig);

    // Создаем HTML дублированной формы
    const formHtml = this.formManager.createForm(duplicatedConfig);

    // Вставляем дублированную форму после исходной формы
    this.formElement.insertAdjacentHTML('afterend', formHtml);

    // Добавляем перенос строки
    this.editor.insertContent(createLineBreak());

    console.log('Form duplicated');
  }

  private createDuplicatedConfig(formConfig: FormConfig): FormConfig {
    return {
      ...formConfig,
      id: `form_${Date.now()}_duplicate`,
      fields: formConfig.fields.map((field) => ({
        ...field,
        id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      })),
    };
  }
}
