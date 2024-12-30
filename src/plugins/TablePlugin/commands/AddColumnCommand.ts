import type { Command } from '../../../core/commands/Command.ts';
import { TableOperations } from '../services/TableOperations.ts';

export class AddColumnCommand implements Command {
  private table: HTMLTableElement;
  private cell: HTMLTableCellElement;
  private before: boolean;

  constructor(table: HTMLTableElement, cell: HTMLTableCellElement, before: boolean) {
    this.table = table;
    this.cell = cell;
    this.before = before;
  }

  execute(): void {
    TableOperations.addColumn(this.table, this.cell, this.before);
  }
}