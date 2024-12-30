import type { Command } from '../../../core/commands/Command.ts';
import { TableCell } from '../components/TableCell.ts';

export class SplitCellCommand implements Command {
  private cell: HTMLTableCellElement;

  constructor(_table: HTMLTableElement, cell: HTMLTableCellElement) {
    this.cell = cell;
  }

  execute(): void {
    const row = this.cell.parentElement as HTMLTableRowElement;
    const cellIndex = this.cell.cellIndex;
    const colSpan = this.cell.colSpan;

    if (colSpan > 1) {
      this.cell.colSpan = 1;
      for (let i = 1; i < colSpan; i++) {
        const newCell = row.insertCell(cellIndex + i);
        new TableCell(newCell);
      }
    }
  }
}
