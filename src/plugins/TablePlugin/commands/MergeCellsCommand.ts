// TableCommands.ts (дополнение)
import type { Command } from '../../../core/commands/Command.ts';

export class MergeCellsCommand implements Command {
  private cell: HTMLElement;
  private direction: 'horizontal' | 'vertical';

  constructor(
    _table: HTMLElement,
    cell: HTMLElement,
    direction: 'horizontal' | 'vertical' = 'horizontal'
  ) {
    this.cell = cell;
    this.direction = direction;
  }

  execute(): void {
    if (this.direction === 'horizontal') {
      this.mergeRight();
    } else {
      this.mergeDown();
    }
  }

  private mergeRight() {
    const row = this.cell.parentElement as HTMLElement;
    if (!row) return;
    const cells = Array.from(row.querySelectorAll('.table-cell, .table-header-cell'));
    const index = cells.indexOf(this.cell);
    const nextCell = cells[index + 1] as HTMLElement | undefined;
    if (!nextCell) return;

    // Объединяем содержимое
    this.cell.textContent = (this.cell.textContent || '') + ' ' + (nextCell.textContent || '');

    // Увеличиваем colspan
    const currentColspan = parseInt(this.cell.dataset.colspan || '1', 10);
    const nextColspan = parseInt(nextCell.dataset.colspan || '1', 10);
    this.cell.dataset.colspan = String(currentColspan + nextColspan);

    nextCell.remove();
  }

  private mergeDown() {
    const row = this.cell.parentElement as HTMLElement;
    const table = row.parentElement as HTMLElement;
    if (!row || !table) return;

    // Определяем индекс строки и столбца
    const rows = Array.from(table.querySelectorAll('.table-row, .table-header-row'));
    const rowIndex = rows.indexOf(row);
    const cells = Array.from(row.querySelectorAll('.table-cell, .table-header-cell'));
    const cellIndex = cells.indexOf(this.cell);

    // Следующая строка
    const nextRow = rows[rowIndex + 1] as HTMLElement | undefined;
    if (!nextRow) return;
    const nextCells = Array.from(nextRow.querySelectorAll('.table-cell, .table-header-cell'));
    const belowCell = nextCells[cellIndex] as HTMLElement | undefined;
    if (!belowCell) return;

    // Объединяем содержимое
    this.cell.textContent = (this.cell.textContent || '') + ' ' + (belowCell.textContent || '');

    // Увеличиваем rowspan
    const currentRowspan = parseInt(this.cell.dataset.rowspan || '1', 10);
    const belowRowspan = parseInt(belowCell.dataset.rowspan || '1', 10);
    this.cell.dataset.rowspan = String(currentRowspan + belowRowspan);

    belowCell.remove();
  }
}
