import type { HTMLEditor } from '../../../core/HTMLEditor';
import type { Command } from '../../../core/commands/Command';

export class GetTableBreakpointCommand implements Command {
  private table: HTMLElement;
  private breakpoint: number = 768;

  constructor(_editor: HTMLEditor, table: HTMLElement) {
    this.table = table;
  }

  execute(): void {
    const classList = this.table.classList;
    if (classList.contains('breakpoint-320')) this.breakpoint = 320;
    else if (classList.contains('breakpoint-480')) this.breakpoint = 480;
    else if (classList.contains('breakpoint-640')) this.breakpoint = 640;
    else if (classList.contains('breakpoint-768')) this.breakpoint = 768;
    else if (classList.contains('breakpoint-1024')) this.breakpoint = 1024;
    else if (classList.contains('breakpoint-1280')) this.breakpoint = 1280;
    else if (classList.contains('breakpoint-1440')) this.breakpoint = 1440;
    else if (classList.contains('breakpoint-1536')) this.breakpoint = 1536;
    else if (classList.contains('breakpoint-1920')) this.breakpoint = 1920;
    else if (classList.contains('breakpoint-2560')) this.breakpoint = 2560;
    else this.breakpoint = 768;
  }

  getBreakpoint(): number {
    return this.breakpoint;
  }

  undo(): void {
    // Не нужно отменять чтение
  }
}
