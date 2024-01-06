import {EditorCore} from "../../../src";

export default class TableManager {
  private table: HTMLTableElement;
  private core: EditorCore;
  private popupElement: HTMLDivElement;
  private currentCell: HTMLTableCellElement | null = null; // Добавляем текущую выбранную ячейку
  private onRemove: () => void;

  constructor(table: HTMLTableElement, core: EditorCore, onRemove: () => void) {
    this.table = table;
    this.core = core;
    this.popupElement = this.createPopup();
    this.initializeTable();
    this.onRemove = onRemove;
  }

  private initializeTable(): void {
    Array.from(this.table.querySelectorAll('td')).forEach(cell => {
      this.addResizeHandleToCell(cell);
    });

    this.table.addEventListener('contextmenu', (event: MouseEvent) => {
      if (event.target instanceof HTMLTableCellElement) {
        event.preventDefault();
        event.stopPropagation();
        this.handleContextMenu(event, event.target);
      }
    });
  }

  private createPopup(): HTMLDivElement {
    const popup = document.createElement('div');
    // Стилизация и инициализация попапа
    popup.style.display = 'none';
    popup.style.position = 'absolute';
    popup.style.zIndex = '1000';
    popup.style.background = '#fff';
    popup.style.border = '1px solid #ccc';
    popup.style.padding = '5px';
    document.body.appendChild(popup);

    // Кнопки и действия
    this.createButton('Add Row', () => this.addRow(), popup);
    this.createButton('Add Column', () => this.addColumn(), popup);
    this.createButton('Remove Row', () => this.removeRow(), popup);
    this.createButton('Remove Column', () => this.removeColumn(), popup);
    this.createButton('Delete Table', () => this.removeTable(), popup);

    return popup;
  }

  private createButton(text: string, action: () => void, popup: HTMLElement) {
    const button = document.createElement('button');
    button.textContent = text;
    button.addEventListener('click', () => {
      action();
      this.hidePopup();
    });
    popup.appendChild(button);
  }

  private handleContextMenu(event: MouseEvent, cell: HTMLTableCellElement): void {
    event.preventDefault();
    this.currentCell = cell; // Устанавливаем текущую ячейку
    this.showPopup(event.pageX, event.pageY, cell);
  }

  private showPopup(x: number, y: number, cell: HTMLTableCellElement): void {
    this.popupElement.style.left = `${x}px`;
    this.popupElement.style.top = `${y}px`;
    this.popupElement.style.display = 'block';
  }

  private hidePopup(): void {
    this.popupElement.style.display = 'none';
  }

  private addResizeHandleToCell(cell: HTMLElement): void {
    const resizer = document.createElement('div');
    resizer.classList.add('on-codemerge-resizer');
    resizer.addEventListener('mousedown', (e) => this.startResizing(e, cell));
    cell.appendChild(resizer);
  }

  private startResizing(event: MouseEvent, cell: HTMLElement): void {
    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = cell.offsetWidth;
    const startHeight = cell.offsetHeight;

    const doDrag = (e: MouseEvent) => {
      const newWidth = startWidth + e.clientX - startX;
      const newHeight = startHeight + e.clientY - startY;
      cell.style.width = `${newWidth}px`;
      cell.style.height = `${newHeight}px`;
    };

    const stopDrag = () => {
      document.documentElement.removeEventListener('mousemove', doDrag, false);
      document.documentElement.removeEventListener('mouseup', stopDrag, false);
    };

    document.documentElement.addEventListener('mousemove', doDrag, false);
    document.documentElement.addEventListener('mouseup', stopDrag, false);
  }

  public createHeaders(cols: number): void {
    const thead = this.table.createTHead();
    const headerRow = thead.insertRow();
    for (let j = 0; j < cols; j++) {
      const th = document.createElement('th');
      th.textContent = `Header ${j + 1}`;
      headerRow.appendChild(th);
    }
  }

  addRow(): void {
    // Проверяем, есть ли строки в таблице
    if (this.table.rows.length === 0) {
      const newRow = this.table.insertRow();
      for (let i = 0; i < this.table.rows[0].cells.length; i++) {
        const newCell = newRow.insertCell();
        newCell.textContent = 'New Cell';
        this.addResizeHandleToCell(newCell);
      }
    } else {
      const newRow = this.table.insertRow(1);

      for (let i = 0; i < this.table.rows[0].cells.length; i++) {
        const newCell = newRow.insertCell();
        newCell.textContent = 'New Cell';
        this.addResizeHandleToCell(newCell);
      }
    }
  }

  private addColumn(): void {
    if (!this.currentCell) return;
    const colIndex = this.currentCell.cellIndex;

    Array.from(this.table.rows).forEach((row: any) => {
      const newCell = row.insertCell(colIndex + 1); // Добавляем колонку после текущей выбранной колонки
      newCell.textContent = 'New Cell';
      this.addResizeHandleToCell(newCell);
    });
  }

  private removeRow(): void {
    if (!this.currentCell || this.table.rows.length <= 1) return;
    const parent =  this.currentCell.parentElement as any
    const rowIndex = parent.rowIndex;
    this.table.deleteRow(rowIndex); // Удаляем текущую выбранную строку
  }

  private removeColumn(): void {
    if (!this.currentCell || this.table.rows[0].cells.length <= 1) return;
    const colIndex = this.currentCell.cellIndex;

    Array.from(this.table.rows).forEach((row: any) => {
      if (row.cells.length > 1) row.deleteCell(colIndex); // Удаляем текущую выбранную колонку
    });
  }

  private removeTable(): void {
    this.hidePopup();
    this.popupElement.remove()
    if (this.currentCell) this.currentCell.remove()
    this.table.remove(); // Удаляем всю таблицу
    this.onRemove();
  }

}
