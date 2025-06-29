import type { Command } from '../../../core/commands/Command.ts';

export class StyleTableCellCommand implements Command {
  private cell: HTMLElement;
  private style: Partial<CSSStyleDeclaration>;

  constructor(cell: HTMLElement, style: Partial<CSSStyleDeclaration>) {
    this.cell = cell;
    this.style = style;
  }

  execute(): void {
    Object.assign(this.cell.style, this.style);
  }
}
