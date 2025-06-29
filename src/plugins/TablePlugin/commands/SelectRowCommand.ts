import type { HTMLEditor } from '../../../core/HTMLEditor';
import type { Command } from '../../../core/commands/Command';

export class SelectRowCommand implements Command {
  private cell: HTMLElement;

  constructor(_editor: HTMLEditor, cell: HTMLElement) {
    this.cell = cell;
  }

  execute(): void {
    // Выделяем строку, содержащую данную ячейку
    const row = this.cell.parentElement;
    if (row) {
      const cells = row.querySelectorAll('.table-cell, .table-header-cell');
      cells.forEach((cell) => {
        cell.classList.add('selected');
      });
    }
  }

  undo(): void {
    // Убираем выделение со строки
    const row = this.cell.parentElement;
    if (row) {
      const cells = row.querySelectorAll('.table-cell, .table-header-cell');
      cells.forEach((cell) => {
        cell.classList.remove('selected');
      });
    }
  }
}
