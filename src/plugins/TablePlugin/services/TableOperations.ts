import { TableCell } from '../components/TableCell';

export class TableOperations {
  static addRow(
    table: HTMLTableElement,
    cell: HTMLTableCellElement,
    before: boolean = false
  ): HTMLTableRowElement {
    const rowIndex = (cell.parentElement! as HTMLTableRowElement).rowIndex;
    const newRow = table.insertRow(before ? rowIndex : rowIndex + 1);
    const numCells = (cell.parentElement! as HTMLTableRowElement).cells.length;

    for (let i = 0; i < numCells; i++) {
      const newCell = newRow.insertCell();
      new TableCell(newCell);
    }

    return newRow;
  }

  static addColumn(
    table: HTMLTableElement,
    cell: HTMLTableCellElement,
    before: boolean = false
  ): HTMLTableCellElement[] {
    const cellIndex = cell.cellIndex;
    const newCells: HTMLTableCellElement[] = [];

    for (const row of table.rows) {
      const newCell = row.insertCell(before ? cellIndex : cellIndex + 1);
      new TableCell(newCell);
      newCells.push(newCell);
    }

    return newCells;
  }

  static deleteRow(table: HTMLTableElement, row: HTMLTableRowElement): void {
    if (table.rows.length > 1) {
      row.remove();
    }
  }

  static deleteColumn(table: HTMLTableElement, columnIndex: number): void {
    if (table.rows[0].cells.length > 1) {
      for (const row of table.rows) {
        row.deleteCell(columnIndex);
      }
    }
  }

  static deleteTable(table: HTMLTableElement): void {
    table.remove();
  }
}
