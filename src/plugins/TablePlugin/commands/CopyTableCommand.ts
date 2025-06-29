import type { Command } from '../../../core/commands/Command.ts';

export class CopyTableCommand implements Command {
  private table: HTMLElement;

  constructor(table: HTMLElement) {
    this.table = table;
  }

  execute(): void {
    const tableHTML = this.table.outerHTML;
    navigator.clipboard.writeText(tableHTML);
  }
}
