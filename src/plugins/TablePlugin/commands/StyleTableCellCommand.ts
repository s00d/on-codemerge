import type { Command } from '../../../core/commands/Command.ts';

export class StyleTableCellCommand implements Command {
  private cell: HTMLTableCellElement;
  private newStyle: Partial<CSSStyleDeclaration>;

  constructor(cell: HTMLTableCellElement, style: Partial<CSSStyleDeclaration>) {
    this.cell = cell;
    this.newStyle = style;
    // this.oldStyle = {
    //   textAlign: cell.style.textAlign,
    //   verticalAlign: cell.style.verticalAlign,
    //   backgroundColor: cell.style.backgroundColor,
    // };
  }

  execute(): void {
    Object.assign(this.cell.style, this.newStyle);
  }
}
