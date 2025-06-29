import type { HTMLEditor } from '../../../core/HTMLEditor';
import type { Command } from '../../../core/commands/Command';
import { CellFormatter } from '../components/CellFormatter';

export class FormatCellCommand implements Command {
  private cell: HTMLElement;
  private cellFormatter: CellFormatter;

  constructor(editor: HTMLEditor, cell: HTMLElement) {
    this.cell = cell;
    this.cellFormatter = new CellFormatter(editor);
  }

  execute(): void {
    // Показываем форматирование ячейки напрямую
    this.cellFormatter.show(this.cell);
  }

  undo(): void {
    // Отмена форматирования не требуется
  }
}
