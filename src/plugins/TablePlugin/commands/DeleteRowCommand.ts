import type { Command } from '../../../core/commands/Command.ts';
import { TableOperations } from '../services/TableOperations.ts';

export class DeleteRowCommand implements Command {
  private table: HTMLTableElement;
  private row: HTMLTableRowElement;

  constructor(table: HTMLTableElement, cell: HTMLTableCellElement) {
    this.table = table;
    this.row = cell.parentElement as HTMLTableRowElement;
    // this.rowIndex = this.row.rowIndex;
    // this.rowHTML = this.row.outerHTML;
  }

  execute(): void {
    TableOperations.deleteRow(this.table, this.row);
  }
}
