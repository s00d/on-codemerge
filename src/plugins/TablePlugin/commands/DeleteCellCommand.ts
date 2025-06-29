import type { HTMLEditor } from '../../../core/HTMLEditor';
import type { Command } from '../../../core/commands/Command';

export class DeleteCellCommand implements Command {
  private cell: HTMLElement;
  private parentRow: HTMLElement | null;
  private removedIndex: number = -1;

  constructor(_editor: HTMLEditor, cell: HTMLElement) {
    this.cell = cell;
    this.parentRow = cell.parentElement;
  }

  execute(): void {
    if (this.parentRow) {
      const cells = Array.from(this.parentRow.children);
      this.removedIndex = cells.indexOf(this.cell);
      this.parentRow.removeChild(this.cell);
    }
  }

  undo(): void {
    if (this.parentRow && this.removedIndex !== -1) {
      if (this.parentRow.children.length > this.removedIndex) {
        this.parentRow.insertBefore(this.cell, this.parentRow.children[this.removedIndex]);
      } else {
        this.parentRow.appendChild(this.cell);
      }
    }
  }
}
