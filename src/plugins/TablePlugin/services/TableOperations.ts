import { TableCell } from '../components/TableCell';
import type { HTMLEditor } from '../../../core/HTMLEditor';

export class TableOperations {
  static addRow(
    table: HTMLElement,
    cell: HTMLElement,
    before: boolean = false,
    editor?: HTMLEditor
  ): HTMLElement {
    const rowIndex = Array.from(table.querySelectorAll('.table-header-row, .table-row')).indexOf(
      cell.parentElement as HTMLElement
    );
    const newRow = document.createElement('div');
    newRow.className = 'table-row';

    const numCells = (cell.parentElement as HTMLElement).querySelectorAll(
      '.table-cell, .table-header-cell'
    ).length;

    for (let i = 0; i < numCells; i++) {
      const newCell = document.createElement('div');
      newCell.className = 'table-cell';
      newCell.contentEditable = 'true';
      new TableCell(newCell, editor);
      newRow.appendChild(newCell);
    }

    const rows = table.querySelectorAll('.table-header-row, .table-row');
    if (before) {
      table.insertBefore(newRow, rows[rowIndex]);
    } else {
      table.insertBefore(newRow, rows[rowIndex + 1]);
    }

    return newRow;
  }

  static addColumn(
    table: HTMLElement,
    cell: HTMLElement,
    before: boolean = false,
    editor?: HTMLEditor
  ): HTMLElement[] {
    const cellIndex = Array.from(
      (cell.parentElement as HTMLElement).querySelectorAll('.table-cell, .table-header-cell')
    ).indexOf(cell);
    const newCells: HTMLElement[] = [];

    const rows = table.querySelectorAll('.table-header-row, .table-row');
    rows.forEach((row) => {
      const newCell = document.createElement('div');
      newCell.className = row.classList.contains('table-header-row')
        ? 'table-header-cell'
        : 'table-cell';
      if (row.classList.contains('table-row')) {
        newCell.contentEditable = 'true';
      }
      new TableCell(newCell, editor);

      const cells = row.querySelectorAll('.table-cell, .table-header-cell');
      if (before) {
        row.insertBefore(newCell, cells[cellIndex]);
      } else {
        row.insertBefore(newCell, cells[cellIndex + 1]);
      }

      newCells.push(newCell);
    });

    return newCells;
  }

  static deleteRow(table: HTMLElement, row: HTMLElement): void {
    const rows = table.querySelectorAll('.table-header-row, .table-row');
    if (rows.length > 1) {
      row.remove();
    }
  }

  static deleteColumn(table: HTMLElement, columnIndex: number): void {
    const rows = table.querySelectorAll('.table-header-row, .table-row');
    if (rows.length > 0) {
      const firstRow = rows[0];
      const cells = firstRow.querySelectorAll('.table-cell, .table-header-cell');
      if (cells.length > 1) {
        rows.forEach((row) => {
          const rowCells = row.querySelectorAll('.table-cell, .table-header-cell');
          if (rowCells[columnIndex]) {
            rowCells[columnIndex].remove();
          }
        });
      }
    }
  }

  static deleteTable(table: HTMLElement): void {
    table.remove();
  }
}
