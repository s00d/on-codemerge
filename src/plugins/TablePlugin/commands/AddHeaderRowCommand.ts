import type { Command } from '../../../core/commands/Command.ts';

export class AddHeaderRowCommand implements Command {
  private table: HTMLElement;

  constructor(table: HTMLElement) {
    this.table = table;
  }

  execute(): void {
    const firstRow = this.table.querySelector('.table-row, .table-header-row') as HTMLElement;
    if (firstRow) {
      const headerRow = document.createElement('div');
      headerRow.className = 'table-header-row';

      const numCells = firstRow.querySelectorAll('.table-cell, .table-header-cell').length;
      for (let i = 0; i < numCells; i++) {
        const headerCell = document.createElement('div');
        headerCell.className = 'table-header-cell';
        headerRow.appendChild(headerCell);
      }

      this.table.insertBefore(headerRow, firstRow);
    }
  }
}
