import type { HTMLEditor } from '../../../core/HTMLEditor';
import type { Command } from '../../../core/commands/Command';

export class PasteCellCommand implements Command {
  private cell: HTMLElement;
  private previousContent: string = '';

  constructor(_editor: HTMLEditor, cell: HTMLElement) {
    this.cell = cell;
  }

  execute(): void {
    // Сохраняем предыдущее содержимое для отмены
    this.previousContent = this.cell.textContent || '';

    // Вставляем содержимое из буфера обмена
    navigator.clipboard
      .readText()
      .then((text) => {
        this.cell.textContent = text;
      })
      .catch((err) => {
        console.error('Failed to read clipboard:', err);
      });
  }

  undo(): void {
    // Восстанавливаем предыдущее содержимое
    this.cell.textContent = this.previousContent;
  }
}
