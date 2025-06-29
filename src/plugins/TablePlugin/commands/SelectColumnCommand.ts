import type { HTMLEditor } from '../../../core/HTMLEditor';
import type { Command } from '../../../core/commands/Command';

export class SelectColumnCommand implements Command {
  private cell: HTMLElement;

  constructor(_editor: HTMLEditor, cell: HTMLElement) {
    this.cell = cell;
  }

  execute(): void {
    // Выделяем столбец, содержащий данную ячейку
    const table = this.cell.closest('.html-editor-table') as HTMLElement;
    if (!table) return;

    const row = this.cell.parentElement;
    if (!row) return;

    // Находим индекс столбца
    const cells = row.querySelectorAll('.table-cell, .table-header-cell');
    const columnIndex = Array.from(cells).indexOf(this.cell);

    if (columnIndex !== -1) {
      // Выделяем все ячейки в этом столбце
      const allRows = table.querySelectorAll('.table-header-row, .table-row');
      allRows.forEach((row) => {
        const cells = row.querySelectorAll('.table-cell, .table-header-cell');
        if (cells[columnIndex]) {
          cells[columnIndex].classList.add('selected');
        }
      });
    }
  }

  undo(): void {
    // Убираем выделение со столбца
    const table = this.cell.closest('.html-editor-table') as HTMLElement;
    if (!table) return;

    const row = this.cell.parentElement;
    if (!row) return;

    const cells = row.querySelectorAll('.table-cell, .table-header-cell');
    const columnIndex = Array.from(cells).indexOf(this.cell);

    if (columnIndex !== -1) {
      const allRows = table.querySelectorAll('.table-header-row, .table-row');
      allRows.forEach((row) => {
        const cells = row.querySelectorAll('.table-cell, .table-header-cell');
        if (cells[columnIndex]) {
          cells[columnIndex].classList.remove('selected');
        }
      });
    }
  }
}
