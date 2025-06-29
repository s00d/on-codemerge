import type { HTMLEditor } from '../../../core/HTMLEditor';
import type { Command } from '../../../core/commands/Command';

export class ClearTableCommand implements Command {
  private table: HTMLElement;
  private previousContents: Map<string, string> = new Map();

  constructor(_editor: HTMLEditor, table: HTMLElement) {
    this.table = table;
  }

  execute(): void {
    // Сохраняем содержимое всех ячеек
    const cells = this.table.querySelectorAll('.table-cell, .table-header-cell');
    cells.forEach((cell, index) => {
      const inputElement = cell.querySelector('input, textarea');
      if (inputElement) {
        this.previousContents.set(
          index.toString(),
          (inputElement as HTMLInputElement | HTMLTextAreaElement).value
        );
        (inputElement as HTMLInputElement | HTMLTextAreaElement).value = '';
      } else {
        this.previousContents.set(index.toString(), cell.textContent || '');
        cell.textContent = '';
      }
    });
    console.log('Table cleared');
  }

  undo(): void {
    // Восстанавливаем содержимое всех ячеек
    const cells = this.table.querySelectorAll('.table-cell, .table-header-cell');
    cells.forEach((cell, index) => {
      const content = this.previousContents.get(index.toString());
      if (content !== undefined) {
        const inputElement = cell.querySelector('input, textarea');
        if (inputElement) {
          (inputElement as HTMLInputElement | HTMLTextAreaElement).value = content;
        } else {
          cell.textContent = content;
        }
      }
    });
  }
}
