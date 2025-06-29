import type { Command } from '../../../core/commands/Command.ts';
import { TableOperations } from '../services/TableOperations.ts';

export class DeleteRowCommand implements Command {
  private table: HTMLElement;
  private cell: HTMLElement;

  constructor(table: HTMLElement, cell: HTMLElement) {
    this.table = table;
    this.cell = cell;
  }

  execute(): void {
    const row = this.cell.parentElement as HTMLElement;
    if (row) {
      TableOperations.deleteRow(this.table, row);
    }
  }
}
