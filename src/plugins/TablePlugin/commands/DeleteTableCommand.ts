import type { Command } from '../../../core/commands/Command.ts';
import { TableOperations } from '../services/TableOperations.ts';

export class DeleteTableCommand implements Command {
  private table: HTMLElement;

  constructor(table: HTMLElement) {
    this.table = table;
    // this.parent = table.parentElement as HTMLElement;
    // this.nextSibling = table.nextSibling;
    // this.tableHTML = table.outerHTML;
  }

  execute(): void {
    TableOperations.deleteTable(this.table);
  }
}
