import type { Command } from '../../../core/commands/Command.ts';

export class RemoveHeaderRowCommand implements Command {
  private table: HTMLTableElement;

  constructor(table: HTMLTableElement) {
    this.table = table;
  }

  execute(): void {
    this.table.tHead?.remove();
  }
}
