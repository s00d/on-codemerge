import type { Command } from '../../../core/commands/Command.ts';

export class RemoveHeaderRowCommand implements Command {
  private table: HTMLElement;

  constructor(table: HTMLElement) {
    this.table = table;
  }

  execute(): void {
    const headerRows = this.table.querySelectorAll('.table-header-row');
    headerRows.forEach((row) => row.remove());
  }
}
