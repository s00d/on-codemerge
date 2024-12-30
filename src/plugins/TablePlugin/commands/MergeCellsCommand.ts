// TableCommands.ts (дополнение)
import type { Command } from '../../../core/commands/Command.ts';

export class MergeCellsCommand implements Command {
  private cell: HTMLTableCellElement;

  constructor(_table: HTMLTableElement, cell: HTMLTableCellElement) {
    this.cell = cell;
  }

  execute(): void {
    const row = this.cell.parentElement as HTMLTableRowElement;
    const cellIndex = this.cell.cellIndex;
    const nextCell = row.cells[cellIndex + 1];

    if (nextCell) {
      this.cell.colSpan += nextCell.colSpan;
      nextCell.remove();
    }
  }
}
