import type { Command } from '../../../core/commands/Command';
import type { HTMLEditor } from '../../../app';

export class DeleteFormCommand implements Command {
  private formElement: HTMLElement;

  constructor(_editor: HTMLEditor, formElement: HTMLElement) {
    this.formElement = formElement;
  }

  execute(): void {
    // Удаляем форму из DOM
    this.formElement.remove();

    // Можно добавить логирование или другие действия
    console.log('Form deleted');
  }
}
