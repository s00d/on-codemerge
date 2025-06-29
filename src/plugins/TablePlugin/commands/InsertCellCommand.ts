import type { Command } from '../../../core/commands/Command';
import type { HTMLEditor } from '../../../core/HTMLEditor';

export type InsertDirection = 'left' | 'right' | 'top' | 'bottom';

export class InsertCellCommand implements Command {
  private direction: InsertDirection;
  private targetCell: HTMLElement;

  constructor(_editor: HTMLEditor, targetCell: HTMLElement, direction: InsertDirection) {
    this.targetCell = targetCell;
    this.direction = direction;
  }

  execute(): void {
    const table = this.findTable(this.targetCell);
    if (!table) return;

    const rows = Array.from(table.children) as HTMLElement[];
    const currentRow = this.targetCell.closest('.table-row, .table-header-row') as HTMLElement;
    const currentRowIndex = rows.indexOf(currentRow);
    const currentCellIndex = Array.from(currentRow.children).indexOf(this.targetCell);

    switch (this.direction) {
      case 'left':
        this.insertCellLeft(table, currentRow, currentCellIndex);
        break;
      case 'right':
        this.insertCellRight(table, currentRow, currentCellIndex);
        break;
      case 'top':
        this.insertCellTop(table, currentRowIndex, currentCellIndex);
        break;
      case 'bottom':
        this.insertCellBottom(table, currentRowIndex, currentCellIndex);
        break;
    }

    // Обновляем индексы ячеек
    this.updateCellIndexes(table);
  }

  private insertCellLeft(_table: HTMLElement, currentRow: HTMLElement, cellIndex: number): void {
    const newCell = document.createElement('div');
    newCell.className = currentRow.classList.contains('table-header-row')
      ? 'table-header-cell'
      : 'table-cell';
    newCell.contentEditable = 'true';
    newCell.setAttribute('data-colspan', '1');
    newCell.setAttribute('data-rowspan', '1');
    newCell.setAttribute('data-cell-index', cellIndex.toString());

    // Вставляем ячейку перед текущей
    currentRow.insertBefore(newCell, currentRow.children[cellIndex]);

    // Обновляем индексы всех ячеек справа
    for (let i = cellIndex + 1; i < currentRow.children.length; i++) {
      const cell = currentRow.children[i] as HTMLElement;
      const currentIndex = parseInt(cell.getAttribute('data-cell-index') || '0');
      cell.setAttribute('data-cell-index', (currentIndex + 1).toString());
    }
  }

  private insertCellRight(_table: HTMLElement, currentRow: HTMLElement, cellIndex: number): void {
    const newCell = document.createElement('div');
    newCell.className = currentRow.classList.contains('table-header-row')
      ? 'table-header-cell'
      : 'table-cell';
    newCell.contentEditable = 'true';
    newCell.setAttribute('data-colspan', '1');
    newCell.setAttribute('data-rowspan', '1');
    newCell.setAttribute('data-cell-index', (cellIndex + 1).toString());

    // Вставляем ячейку после текущей
    if (cellIndex + 1 < currentRow.children.length) {
      currentRow.insertBefore(newCell, currentRow.children[cellIndex + 1]);
    } else {
      currentRow.appendChild(newCell);
    }

    // Обновляем индексы всех ячеек справа
    for (let i = cellIndex + 2; i < currentRow.children.length; i++) {
      const cell = currentRow.children[i] as HTMLElement;
      const currentIndex = parseInt(cell.getAttribute('data-cell-index') || '0');
      cell.setAttribute('data-cell-index', (currentIndex + 1).toString());
    }
  }

  private insertCellTop(table: HTMLElement, rowIndex: number, cellIndex: number): void {
    const rows = Array.from(table.children) as HTMLElement[];

    // Создаем новую строку, если нужно
    let newRow: HTMLElement;
    if (rowIndex === 0) {
      newRow = document.createElement('div');
      newRow.className = 'table-row';
      table.insertBefore(newRow, table.firstChild);
    } else {
      newRow = rows[rowIndex - 1];
    }

    // Создаем новую ячейку
    const newCell = document.createElement('div');
    newCell.className = 'table-cell';
    newCell.contentEditable = 'true';
    newCell.setAttribute('data-colspan', '1');
    newCell.setAttribute('data-rowspan', '1');
    newCell.setAttribute('data-cell-index', cellIndex.toString());

    // Вставляем ячейку в нужную позицию
    if (cellIndex < newRow.children.length) {
      newRow.insertBefore(newCell, newRow.children[cellIndex]);
    } else {
      newRow.appendChild(newCell);
    }

    // Обновляем индексы ячеек в текущей строке
    const currentRow = rows[rowIndex];
    for (let i = cellIndex; i < currentRow.children.length; i++) {
      const cell = currentRow.children[i] as HTMLElement;
      const currentIndex = parseInt(cell.getAttribute('data-cell-index') || '0');
      cell.setAttribute('data-cell-index', (currentIndex + 1).toString());
    }
  }

  private insertCellBottom(table: HTMLElement, rowIndex: number, cellIndex: number): void {
    const rows = Array.from(table.children) as HTMLElement[];

    // Создаем новую строку, если нужно
    let newRow: HTMLElement;
    if (rowIndex === rows.length - 1) {
      newRow = document.createElement('div');
      newRow.className = 'table-row';
      table.appendChild(newRow);
    } else {
      newRow = rows[rowIndex + 1];
    }

    // Создаем новую ячейку
    const newCell = document.createElement('div');
    newCell.className = 'table-cell';
    newCell.contentEditable = 'true';
    newCell.setAttribute('data-colspan', '1');
    newCell.setAttribute('data-rowspan', '1');
    newCell.setAttribute('data-cell-index', cellIndex.toString());

    // Вставляем ячейку в нужную позицию
    if (cellIndex < newRow.children.length) {
      newRow.insertBefore(newCell, newRow.children[cellIndex]);
    } else {
      newRow.appendChild(newCell);
    }

    // Обновляем индексы ячеек в текущей строке
    const currentRow = rows[rowIndex];
    for (let i = cellIndex; i < currentRow.children.length; i++) {
      const cell = currentRow.children[i] as HTMLElement;
      const currentIndex = parseInt(cell.getAttribute('data-cell-index') || '0');
      cell.setAttribute('data-cell-index', (currentIndex + 1).toString());
    }
  }

  private findTable(cell: HTMLElement): HTMLElement | null {
    return cell.closest('.html-editor-table') as HTMLElement;
  }

  private updateCellIndexes(table: HTMLElement): void {
    const rows = Array.from(table.children) as HTMLElement[];
    rows.forEach((row, _rowIndex) => {
      const cells = Array.from(row.children) as HTMLElement[];
      cells.forEach((cell, cellIndex) => {
        cell.setAttribute('data-cell-index', cellIndex.toString());
      });
    });
  }

  undo(): void {
    // Для отмены нужно удалить вставленную ячейку
    // Это сложная операция, так как нужно определить, какая именно ячейка была вставлена
    // В реальной реализации здесь нужно сохранять информацию о вставленной ячейке
  }

  redo(): void {
    this.execute();
  }
}
