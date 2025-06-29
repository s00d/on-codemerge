import type { HTMLEditor } from '../../../core/HTMLEditor';
import type { Command } from '../../../core/commands/Command';

export class CopyCellCommand implements Command {
  private cell: HTMLElement;
  constructor(_editor: HTMLEditor, cell: HTMLElement) {
    this.cell = cell;
  }

  execute(): void {
    // Копируем содержимое ячейки в буфер обмена напрямую
    const content = this.cell.textContent || '';
    navigator.clipboard.writeText(content);
  }

  undo(): void {
    // Отмена копирования не требуется
  }
}
