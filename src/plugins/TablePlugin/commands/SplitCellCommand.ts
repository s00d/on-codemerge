import type { Command } from '../../../core/commands/Command.ts';

export class SplitCellCommand implements Command {
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
      this.splitRight();
    } else {
      this.splitDown();
    }
  }

  private splitRight() {
    const row = this.cell.parentElement as HTMLElement;
    if (!row) return;
    const colspan = parseInt(this.cell.dataset.colspan || '1', 10);
    if (colspan <= 1) return;

    this.cell.dataset.colspan = '1';

    for (let i = 1; i < colspan; i++) {
      const newCell = document.createElement('div');
      newCell.className = this.cell.className;
      newCell.contentEditable = 'true';
      newCell.textContent = '';
      row.insertBefore(newCell, this.cell.nextSibling);
    }
  }

  private splitDown() {
    const row = this.cell.parentElement as HTMLElement;
    const table = row.parentElement as HTMLElement;
    if (!row || !table) return;

    const rows = Array.from(table.querySelectorAll('.table-row, .table-header-row'));
    const rowIndex = rows.indexOf(row);
    const cells = Array.from(row.querySelectorAll('.table-cell, .table-header-cell'));
    const cellIndex = cells.indexOf(this.cell);

    const rowspan = parseInt(this.cell.dataset.rowspan || '1', 10);
    if (rowspan <= 1) return;

    this.cell.dataset.rowspan = '1';

    for (let i = 1; i < rowspan; i++) {
      const targetRow = rows[rowIndex + i] as HTMLElement | undefined;
      if (!targetRow) continue;
      const newCell = document.createElement('div');
      newCell.className = this.cell.className;
      newCell.contentEditable = 'true';
      newCell.textContent = '';
      const rowCells = targetRow.querySelectorAll('.table-cell, .table-header-cell');
      if (rowCells.length > cellIndex) {
        targetRow.insertBefore(newCell, rowCells[cellIndex]);
      } else {
        targetRow.appendChild(newCell);
      }
    }
  }
}
