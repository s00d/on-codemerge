import type { Command } from '../../../core/commands/Command.ts';
import { TableCell } from '../components/TableCell.ts';

export class AddHeaderRowCommand implements Command {
  private table: HTMLTableElement;

  constructor(table: HTMLTableElement) {
    this.table = table;
  }

  execute(): void {
    const headerRow = this.table.createTHead().insertRow();
    const cols = this.table.rows[0].cells.length;

    for (let i = 0; i < cols; i++) {
      const headerCell = document.createElement('th');
      headerRow.appendChild(headerCell);
      new TableCell(headerCell);
    }
  }
}