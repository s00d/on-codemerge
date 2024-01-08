import type { EditorCore } from "@/index";

export default class TableManager {
  private table: HTMLTableElement;
  private core: EditorCore;
  private popupElement: HTMLDivElement;
  private currentCell: HTMLTableCellElement | null = null; // Добавляем текущую выбранную ячейку
  private selectedCells: HTMLTableCellElement[] = [];

  private onRemove: () => void;
  private onUpdate: () => void;

  constructor(table: HTMLTableElement, core: EditorCore, onRemove: () => void, onUpdate: () => any) {
    this.table = table;
    this.core = core;
    this.popupElement = this.createPopup();
    this.initializeTable();
    this.onRemove = onRemove;
    this.onUpdate = onUpdate;
  }

  private initializeTable(): void {
    Array.from(this.table.querySelectorAll('td, th')).forEach((cell) => {
      const selectCell = cell as HTMLTableCellElement
      selectCell.setAttribute('tabindex', '0');
      this.addResizeHandleToCell(selectCell);
      selectCell.addEventListener('click', this.onCellClick);
      selectCell.addEventListener('keydown', this.handleKeyDown);
    });

    this.table.addEventListener('contextmenu', (event: MouseEvent) => {
      if (event.target instanceof HTMLTableCellElement) {
        event.preventDefault();
        event.stopPropagation();
        this.handleContextMenu(event, event.target);
      }
    });
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if(this.currentCell) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
        if (this.currentCell) {
          event.preventDefault();
          event.stopPropagation();
          this.selectText(this.currentCell);
        }
      }
    }
  };

  private selectText(cell: HTMLTableCellElement): void {
    const range = document.createRange();
    range.selectNodeContents(cell);
    const selection = window.getSelection();
    if(selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  private onCellClick = (event: MouseEvent): void => {
    const cell = event.target as HTMLTableCellElement;
    cell.focus();
    this.currentCell = cell;
    if (event.shiftKey) {
      // Если нажата клавиша Ctrl, добавляем/удаляем ячейку из списка выбранных
      const cellIndex = this.selectedCells.indexOf(cell);
      if (cellIndex === -1) {
        this.selectedCells.push(cell);
        // Можно добавить визуальное выделение ячейки
        cell.classList.add('selected');
      } else {
        this.selectedCells.splice(cellIndex, 1);
        cell.classList.remove('selected');
      }
    }
  };

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
    this.createButton('Merge Cells', () => this.mergeCells(), popup);

    const bgColorInput = document.createElement('input');
    bgColorInput.type = 'color';
    bgColorInput.addEventListener('input', () => {
      this.setStyleToSelectedCells('backgroundColor', bgColorInput.value);
      this.onUpdate()
    });
    popup.appendChild(bgColorInput);

    return popup;
  }

  private setStyleToSelectedCells(styleProperty: string, value: string): void {
    if(this.currentCell) {
      this.currentCell.style[styleProperty as any] = value;
    }
  }

  private createButton(text: string, action: () => void, popup: HTMLElement) {
    const button = document.createElement('button');
    button.textContent = text;
    button.classList.add('on-codemerge-button');
    button.addEventListener('click', () => {
      action();
      this.hidePopup();
    });
    popup.appendChild(button);
  }

  private handleContextMenu(event: MouseEvent, cell: HTMLTableCellElement): void {
    event.preventDefault();
    this.currentCell = cell; // Устанавливаем текущую ячейку
    this.showPopup(event.pageX, event.pageY);

    if (this.selectedCells.indexOf(cell) === -1) {
      this.selectedCells.push(cell);
    }
  }

  private showPopup(x: number, y: number): void {
    this.popupElement.style.left = `${x}px`;
    this.popupElement.style.top = `${y}px`;
    this.popupElement.style.display = 'block';

    document.addEventListener('click', this.onDocumentClick);
  }

  private hidePopup(): void {
    this.popupElement.style.display = 'none';
    document.removeEventListener('click', this.onDocumentClick);
  }

  private onDocumentClick = (event: MouseEvent): void => {
    // Проверяем, что клик произошел вне попапа
    if (!this.popupElement.contains(event.target as Node)) {
      this.hidePopup();
    }
  };

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
      this.onUpdate();
    };

    document.documentElement.addEventListener('mousemove', doDrag, false);
    document.documentElement.addEventListener('mouseup', stopDrag, false);
  }


  private mergeCells(): void {
    if (this.selectedCells.length >= 1) {
      const firstCell = this.selectedCells[0];
      // Проверяем, объединены ли ячейки
      if (firstCell.colSpan > 1 || firstCell.rowSpan > 1) {
        const colSpan = firstCell.colSpan;
        const rowSpan = firstCell.rowSpan;
        // Разъединяем ячейки
        firstCell.colSpan = 1;
        firstCell.rowSpan = 1;
        // Воссоздаем ячейки, которые были объединены
        // Воссоздание горизонтально объединенных ячеек
        for (let i = 1; i < colSpan; i++) {
          const raw = firstCell.parentElement! as HTMLTableRowElement
          raw.insertCell(firstCell.cellIndex + 1);
          // Установите начальное содержимое и другие атрибуты для newCell
        }

        // Воссоздание вертикально объединенных ячеек
        if (rowSpan > 1) {
          const raw = firstCell.parentElement! as HTMLTableRowElement
          const rowIndex = raw.rowIndex;
          for (let i = 1; i < rowSpan; i++) {
            const newRow = this.table.insertRow(rowIndex + i);
            const newCell = newRow.insertCell(0);
            newCell.colSpan = colSpan;
            // Установите начальное содержимое и другие атрибуты для newCell
          }
        }
      } else {
        // Объединяем ячейки
        firstCell.colSpan = this.selectedCells.length;
        this.selectedCells.slice(1).forEach(cell => {
          // @ts-ignore
          firstCell.appendChild(...Array.from(cell.childNodes) as Node[]);
          cell.remove();
        });
      }

      this.selectedCells.forEach(cell => cell.classList.remove('selected'));

      // Очищаем массив выбранных ячеек после объединения или разъединения
      this.selectedCells = [];
    }

    this.onUpdate();
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
    this.onUpdate();
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
    this.onUpdate();
  }

  private removeColumn(): void {
    if (!this.currentCell || this.table.rows[0].cells.length <= 1) return;
    const colIndex = this.currentCell.cellIndex;

    Array.from(this.table.rows).forEach((row: any) => {
      if (row.cells.length > 1) row.deleteCell(colIndex); // Удаляем текущую выбранную колонку
    });
    this.onUpdate();
  }

  private removeTable(): void {
    this.hidePopup();
    this.popupElement.remove()
    if (this.currentCell) this.currentCell.remove()
    this.table.remove(); // Удаляем всю таблицу
    this.onRemove();
  }

}
