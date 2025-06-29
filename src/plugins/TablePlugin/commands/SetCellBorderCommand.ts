import type { Command } from '../../../core/commands/Command.ts';

export class SetCellBorderCommand implements Command {
  private cell: HTMLElement;
  private borderStyle: string;

  constructor(cell: HTMLElement, borderStyle: string) {
    this.cell = cell;
    this.borderStyle = borderStyle;
  }

  execute(): void {
    this.cell.style.border = this.borderStyle;
  }
}
