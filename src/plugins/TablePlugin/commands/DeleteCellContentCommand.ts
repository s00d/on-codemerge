import type { HTMLEditor } from '../../../core/HTMLEditor';
import type { Command } from '../../../core/commands/Command';

export class DeleteCellContentCommand implements Command {
  private cell: HTMLElement;
  private previousContent: string = '';

  constructor(_editor: HTMLEditor, cell: HTMLElement) {
    this.cell = cell;
  }

  execute(): void {
    // Сохраняем содержимое для отмены
    this.previousContent = this.cell.textContent || '';

    // Очищаем ячейку
    this.cell.textContent = '';
  }

  undo(): void {
    // Восстанавливаем содержимое
    this.cell.textContent = this.previousContent;
  }
}
