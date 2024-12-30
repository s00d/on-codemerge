// Table.ts
import { TableCell } from './TableCell';

export interface TableOptions {
  hasHeader: boolean;
  rows: number;
  cols: number;
}

export class Table {
  private element: HTMLTableElement;

  constructor(options: TableOptions) {
    this.element = document.createElement('table');
    this.initialize(options);
  }

  private initialize({ hasHeader, rows, cols }: TableOptions): void {
    this.element.className = 'html-editor-table';

    if (hasHeader) {
      const headerRow = this.element.createTHead().insertRow();
      for (let j = 0; j < cols; j++) {
        const headerCell = document.createElement('th') as HTMLTableCellElement;
        headerCell.textContent = `Column ${j + 1}`; // Заголовок столбца
        headerRow.appendChild(headerCell);
        new TableCell(headerCell);
      }
    }

    const tbody = this.element.createTBody();
    for (let i = 0; i < rows; i++) {
      const row = tbody.insertRow();
      for (let j = 0; j < cols; j++) {
        const cell = row.insertCell();
        cell.textContent = `Cell ${i + 1} - ${j + 1}`; // Заголовок столбца
        new TableCell(cell);
      }
    }
  }

  public getElement(): HTMLTableElement {
    return this.element;
  }

  public focusFirstCell(): void {
    const firstCell = this.element.querySelector('th, td');
    if (firstCell instanceof HTMLTableCellElement) {
      new TableCell(firstCell).focus();
    }
  }

  public adjustColumnWidths(): void {
    const rows = this.element.rows;
    if (rows.length === 0) return;

    const colCount = rows[0].cells.length;
    for (let i = 0; i < colCount; i++) {
      let maxWidth = 0;
      for (const row of rows) {
        const cell = row.cells[i];
        if (cell.offsetWidth > maxWidth) {
          maxWidth = cell.offsetWidth;
        }
      }
      for (const row of rows) {
        row.cells[i].style.width = `${maxWidth}px`;
      }
    }
  }
}
