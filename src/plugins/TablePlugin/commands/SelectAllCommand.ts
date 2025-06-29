import type { HTMLEditor } from '../../../core/HTMLEditor';
import type { Command } from '../../../core/commands/Command';

export class SelectAllCommand implements Command {
  private table: HTMLElement;

  constructor(_editor: HTMLEditor, table: HTMLElement) {
    this.table = table;
  }

  execute(): void {
    // Выделяем все ячейки таблицы напрямую
    const cells = this.table.querySelectorAll('.table-cell, .table-header-cell');
    cells.forEach((cell) => {
      cell.classList.add('selected');
    });
  }

  undo(): void {
    // Убираем выделение со всех ячеек
    const cells = this.table.querySelectorAll('.table-cell, .table-header-cell');
    cells.forEach((cell) => {
      cell.classList.remove('selected');
    });
  }
}
