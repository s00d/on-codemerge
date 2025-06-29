import type { HTMLEditor } from '../../../core/HTMLEditor';
import type { Command } from '../../../core/commands/Command';

export class CutCellCommand implements Command {
  private cell: HTMLElement;
  private cellContent: string = '';

  constructor(_editor: HTMLEditor, cell: HTMLElement) {
    this.cell = cell;
  }

  execute(): void {
    // Сохраняем содержимое ячейки для отмены
    this.cellContent = this.cell.textContent || '';

    // Копируем содержимое в буфер обмена
    navigator.clipboard.writeText(this.cellContent);

    // Очищаем ячейку
    this.cell.textContent = '';
  }

  undo(): void {
    // Восстанавливаем содержимое ячейки
    this.cell.textContent = this.cellContent;
  }
}
