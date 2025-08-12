// Table.ts
import { TableCell } from './TableCell';
import { createContainer } from '../../../utils/helpers.ts';
import type { HTMLEditor } from '../../../core/HTMLEditor';

export interface TableOptions {
  hasHeader: boolean;
  rows: number;
  cols: number;
}

export class Table {
  private element: HTMLElement;
  private editor?: HTMLEditor;

  constructor(options: TableOptions, editor?: HTMLEditor) {
    this.element = createContainer('html-editor-table table-modern');
    this.editor = editor;
    this.initialize(options);
  }

  private initialize({ hasHeader, rows, cols }: TableOptions): void {
    this.element.className = 'html-editor-table table-modern';

    if (hasHeader) {
      const headerRow = createContainer('table-header-row');
      for (let j = 0; j < cols; j++) {
        const headerCell = createContainer('table-header-cell');
        headerCell.textContent = `Column ${j + 1}`; // Заголовок столбца
        headerRow.appendChild(headerCell);
        new TableCell(headerCell, this.editor);
      }
      this.element.appendChild(headerRow);
    }

    for (let i = 0; i < rows; i++) {
      const row = createContainer('table-row');
      for (let j = 0; j < cols; j++) {
        const cell = createContainer('table-cell');
        cell.textContent = `Cell ${i + 1} - ${j + 1}`; // Заголовок столбца
        row.appendChild(cell);
        new TableCell(cell, this.editor);
      }
      this.element.appendChild(row);
    }
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public focusFirstCell(): void {
    const firstCell = this.element.querySelector('.table-header-cell, .table-cell');
    if (firstCell instanceof HTMLElement) {
      new TableCell(firstCell, this.editor).focus();
    }
  }

  public adjustColumnWidths(): void {
    const rows = this.element.querySelectorAll('.table-header-row, .table-row');
    if (rows.length === 0) return;

    const firstRow = rows[0];
    const cells = firstRow.querySelectorAll('.table-header-cell, .table-cell');
    const colCount = cells.length;

    for (let i = 0; i < colCount; i++) {
      let maxWidth = 0;
      for (const row of rows) {
        const cell = row.querySelectorAll('.table-header-cell, .table-cell')[i];
        if (cell && cell instanceof HTMLElement && cell.offsetWidth > maxWidth) {
          maxWidth = cell.offsetWidth;
        }
      }
      for (const row of rows) {
        const cell = row.querySelectorAll('.table-header-cell, .table-cell')[i];
        if (cell && cell instanceof HTMLElement) {
          cell.style.width = `${maxWidth}px`;
        }
      }
    }
  }
}
