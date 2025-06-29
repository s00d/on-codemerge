import type { HTMLEditor } from '../../../core/HTMLEditor';
import type { Command } from '../../../core/commands/Command';

export class ResizeColumnsCommand implements Command {
  private table: HTMLElement;

  constructor(_editor: HTMLEditor, table: HTMLElement) {
    this.table = table;
  }

  execute(): void {
    // Автоматически подгоняем ширину столбцов под содержимое
    this.autoResizeColumns();
  }

  private autoResizeColumns(): void {
    const rows = this.table.querySelectorAll('.table-header-row, .table-row');
    if (rows.length === 0) return;

    const firstRow = rows[0] as HTMLElement;
    const cells = firstRow.querySelectorAll('.table-cell, .table-header-cell');

    cells.forEach((_cell, columnIndex) => {
      let maxWidth = 0;

      // Находим максимальную ширину для этого столбца
      rows.forEach((row) => {
        const rowCells = row.querySelectorAll('.table-cell, .table-header-cell');
        if (rowCells[columnIndex]) {
          const cellElement = rowCells[columnIndex] as HTMLElement;
          const content = cellElement.textContent || '';
          const tempSpan = document.createElement('span');
          tempSpan.style.visibility = 'hidden';
          tempSpan.style.position = 'absolute';
          tempSpan.style.whiteSpace = 'nowrap';
          tempSpan.textContent = content;
          document.body.appendChild(tempSpan);

          const width = tempSpan.offsetWidth + 20; // Добавляем отступы
          maxWidth = Math.max(maxWidth, width);

          document.body.removeChild(tempSpan);
        }
      });

      // Применяем ширину ко всем ячейкам в столбце
      rows.forEach((row) => {
        const rowCells = row.querySelectorAll('.table-cell, .table-header-cell');
        if (rowCells[columnIndex]) {
          (rowCells[columnIndex] as HTMLElement).style.width = `${maxWidth}px`;
        }
      });
    });
  }

  undo(): void {
    // Убираем фиксированную ширину со всех ячеек
    const cells = this.table.querySelectorAll('.table-cell, .table-header-cell');
    cells.forEach((cell) => {
      (cell as HTMLElement).style.width = '';
    });
  }
}
