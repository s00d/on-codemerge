import type { Command } from '../../../core/commands/Command.ts';
import { TableOperations } from '../services/TableOperations.ts';

export class DeleteColumnCommand implements Command {
  private table: HTMLTableElement;
  private columnIndex: number;
  private cellsHTML: string[] = [];

  constructor(table: HTMLTableElement, cell: HTMLTableCellElement) {
    this.table = table;
    this.columnIndex = cell.cellIndex;

    // Store HTML of all cells in the column
    for (const row of table.rows) {
      this.cellsHTML.push(row.cells[this.columnIndex].outerHTML);
    }
  }

  execute(): void {
    TableOperations.deleteColumn(this.table, this.columnIndex);
  }
}
