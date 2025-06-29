import type { HTMLEditor } from '../../../core/HTMLEditor';
import type { Command } from '../../../core/commands/Command';

export class AutoFitCommand implements Command {
  private table: HTMLElement;

  constructor(_editor: HTMLEditor, table: HTMLElement) {
    this.table = table;
  }

  execute(): void {
    // Автоматически подгоняем таблицу под содержимое
    this.autoFitTable();
  }

  private autoFitTable(): void {
    // Убираем фиксированные размеры
    this.table.style.width = '';
    this.table.style.height = '';

    const cells = this.table.querySelectorAll('.table-cell, .table-header-cell');
    cells.forEach((cell) => {
      (cell as HTMLElement).style.width = '';
      (cell as HTMLElement).style.height = '';
    });

    // Устанавливаем таблицу в режим авторазмера
    this.table.style.tableLayout = 'auto';
  }

  undo(): void {
    // Восстанавливаем фиксированный layout
    this.table.style.tableLayout = 'fixed';
  }
}
