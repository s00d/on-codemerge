import type { Command } from '../../../core/commands/Command.ts';
import { TableOperations } from '../services/TableOperations.ts';

export class DeleteColumnCommand implements Command {
  private table: HTMLElement;
  private cell: HTMLElement;

  constructor(table: HTMLElement, cell: HTMLElement) {
    this.table = table;
    this.cell = cell;
  }

  execute(): void {
    const columnIndex = Array.from(
      (this.cell.parentElement as HTMLElement).querySelectorAll('.table-cell, .table-header-cell')
    ).indexOf(this.cell);
    TableOperations.deleteColumn(this.table, columnIndex);
  }
}
