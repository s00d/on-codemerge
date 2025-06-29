import type { Command } from '../../../core/commands/Command.ts';
import { TableOperations } from '../services/TableOperations.ts';

export class AddColumnCommand implements Command {
  private table: HTMLElement;
  private cell: HTMLElement;
  private before: boolean;

  constructor(table: HTMLElement, cell: HTMLElement, before: boolean) {
    this.table = table;
    this.cell = cell;
    this.before = before;
  }

  execute(): void {
    TableOperations.addColumn(this.table, this.cell, this.before);
  }
}
