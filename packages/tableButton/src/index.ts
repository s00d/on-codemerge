import {EditorCore, IEditorModule} from "../../../src";

export class TableButtonPlugin implements IEditorModule {
  private popupElement: HTMLDivElement | null = null;
  private currentCell: HTMLTableCellElement | null = null;
  private core: EditorCore|null = null;

  initialize(core: EditorCore): void {
    this.core = core;
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
  .on-codemerge-resizer {
    width: 10px;
    height: 10px;
    background: gray;
    position: absolute;
    right: 0;
    bottom: 0;
    cursor: nwse-resize;
  }
`;
    document.getElementsByTagName('head')[0].appendChild(style);

    const createTableButton = document.createElement('button');
    createTableButton.textContent = 'Create 3x3 Table';
    createTableButton.classList.add('on-codemerge-button');
    createTableButton.addEventListener('click', () => {
      const table = this.createTable(3, 3, core);
      Array.from(table.querySelectorAll('td')).forEach(this.addResizeHandleToCell);

      const editor = core.editor.getEditorElement();
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        let container = range.commonAncestorContainer;

        // Проверяем, что выделение находится внутри редактора
        while (container && container !== editor) {
          if(!container.parentNode) {
            editor!.appendChild(table);
            return;
          }
          container = container.parentNode;
        }

        if (container) {
          range.deleteContents(); // Удаляем текущее содержимое в выделенном диапазоне
          range.insertNode(table); // Вставляем таблицу в выделенный диапазон
        }
        selection.removeAllRanges();
      } else if (editor) {
        // Если нет выделения, вставляем таблицу в конец редактора
        editor.appendChild(table);
      }

      if(editor) core.setContent(editor.innerHTML)
    });

    const toolbar = core.toolbar.getToolbarElement();
    if (toolbar) {
      toolbar.appendChild(createTableButton);
    }

    // Инициализация попапа
    this.popupElement = document.createElement('div');
    this.popupElement.style.display = 'none'; // Изначально скрыт
    this.popupElement.style.position = 'absolute';
    this.popupElement.style.zIndex = '1000';
    this.popupElement.style.background = '#fff';
    this.popupElement.style.border = '1px solid #ccc';
    this.popupElement.style.padding = '5px';
    document.body.appendChild(this.popupElement);

    core.subscribeToContentChange((newContent: string) => {
      this.reloadTables(core)
    });
  }

  public reloadTables(core: EditorCore): void {
    const editor = core.editor.getEditorElement();
    if (!editor) return;

    const tables = editor.querySelectorAll('table');
    tables.forEach((table: HTMLTableElement) => {
      // Проверяем, есть ли у таблицы уже обработчики
      const listener = table.getAttribute('listener')
      console.log(listener)
      if (!table.onclick) {
        Array.from(table.querySelectorAll('td')).forEach(cell => {
          this.addResizeHandleToCell(cell as HTMLElement);
        });

        table.onclick = () => {}

        table.addEventListener('contextmenu', (event: MouseEvent) => {
          if (event.target instanceof HTMLTableCellElement) {
            this.currentCell = event.target;
          }
          event.preventDefault(); // Предотвращение стандартного контекстного меню
          this.showPopup(event.pageX, event.pageY, table, core);
        });
      }
    });
  }

  private createTable(rows: number, cols: number, core: EditorCore): HTMLTableElement {
    const table = document.createElement('table');
    table.classList.add('on-codemerge-table')
    table.onclick = () => {}

    // Создание заголовков
    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    for (let j = 0; j < cols; j++) {
      const th = document.createElement('th');
      th.textContent = `Header ${j + 1}`;
      headerRow.appendChild(th);
    }

    // Создание тела таблицы
    const tbody = table.createTBody();
    for (let i = 0; i < rows; i++) {
      const tr = tbody.insertRow();
      for (let j = 0; j < cols; j++) {
        const td = tr.insertCell();
        td.textContent = `Row ${i + 1} Col ${j + 1}`;
      }
    }

    table.addEventListener('contextmenu', (event: MouseEvent) => {
      if (event.target instanceof HTMLTableCellElement) {
        this.currentCell = event.target;
      }
      event.preventDefault(); // Предотвращение стандартного контекстного меню
      this.showPopup(event.pageX, event.pageY, table, core);
    });

    return table;
  }

  private showPopup(x: number, y: number, table: HTMLTableElement, core: EditorCore): void {
    if (!this.popupElement) return;

    // Очистка предыдущего содержимого попапа
    this.popupElement.innerHTML = '';

    // Кнопка добавления строки
    const addRowButton = document.createElement('button');
    addRowButton.textContent = 'Add Row';
    addRowButton.classList.add('on-codemerge-button');

    // Кнопка добавления колонки
    const addColButton = document.createElement('button');
    addColButton.textContent = 'Add Column';
    addColButton.classList.add('on-codemerge-button');

    const removeRowButton = document.createElement('button');
    removeRowButton.textContent = 'Remove Row';
    removeRowButton.classList.add('on-codemerge-button');

// Кнопка удаления колонки
    const removeColButton = document.createElement('button');
    removeColButton.textContent = 'Remove Column';
    removeColButton.classList.add('on-codemerge-button');

    document.addEventListener('click', () => {
      this.hidePopup();
    })

    addRowButton.addEventListener('click', () => {
      if (this.currentCell) {
        const table = this.findParentTable(this.currentCell);
        if(!table) return;

        const cell = this.currentCell.parentElement as any
        const rowIndex = cell.rowIndex;
        const newRow = table.insertRow(rowIndex + 1); // Добавление после текущей строки
        for (let i = 0; i < table.rows[0].cells.length; i++) {
          const newCell = newRow.insertCell();
          newCell.textContent = 'New Cell';
        }

        Array.from(newRow.cells).forEach(cell => {
          this.addResizeHandleToCell(cell as HTMLElement);
        });
      }
      this.hidePopup();
    });

    addColButton.addEventListener('click', () => {
      if (this.currentCell) {
        const table = this.findParentTable(this.currentCell);
        if(!table) return;
        const colIndex = this.currentCell.cellIndex;

        // Добавление ячейки заголовка в строку заголовков
        const headerRow = table.tHead!.rows[0];
        const newHeaderCell = document.createElement('th');
        newHeaderCell.textContent = `Header ${colIndex + 2}`;
        headerRow.insertBefore(newHeaderCell, headerRow.cells[colIndex + 1] || null);

        // Добавление ячеек в остальные строки
        const rowa = table.tBodies[0].rows as any[];
        for (const row of Array.from(rowa)) {
          const newCell = row.insertCell(colIndex + 1); // Добавление после текущего столбца
          newCell.textContent = 'New Cell';

          this.addResizeHandleToCell(newCell as HTMLElement);
        }
      }
      this.hidePopup();
    });

    removeRowButton.addEventListener('click', () => {
      if (this.currentCell) {
        const table = this.findParentTable(this.currentCell);
        if(!table) return;
        const rows = table.rows as any[]
        if (this.currentCell && rows.length > 1) {
          const cell = this.currentCell.parentElement as any
          table.deleteRow(cell.rowIndex);
        }
        this.hidePopup();
      }
    });

    removeColButton.addEventListener('click', () => {
      if (this.currentCell) {
        const table = this.findParentTable(this.currentCell);
        if(!table) return;
        const rows = table.rows as any[]
        if (this.currentCell && rows[0].cells.length > 1) {
          for (const row of rows) {
            row.deleteCell(this.currentCell.cellIndex);
          }
        }
        this.hidePopup();
      }
    });

    const deleteTableButton = document.createElement('button');
    deleteTableButton.textContent = 'Delete Table';
    deleteTableButton.classList.add('on-codemerge-button');
    deleteTableButton.addEventListener('click', () => {
      this.deleteTable(core);
    });

    // Добавляем кнопки в попап
    this.popupElement.appendChild(addRowButton);
    this.popupElement.appendChild(addColButton);
    this.popupElement.appendChild(removeRowButton);
    this.popupElement.appendChild(removeColButton);
    this.popupElement.appendChild(deleteTableButton);

    // Позиционирование и отображение попапа
    this.popupElement.style.left = `${x}px`;
    this.popupElement.style.top = `${y}px`;
    this.popupElement.style.display = 'block';
  }

  private findParentTable(cell: HTMLElement): any | null {
    let currentElement: Node | null = cell;
    while (currentElement) {
      if (currentElement instanceof HTMLTableElement) {
        return currentElement;
      }
      currentElement = currentElement.parentNode;
    }
    return null;
  }


  private deleteTable(core: EditorCore): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    let container = range.commonAncestorContainer;

    // Находим ближайший родительский элемент таблицы
    while (container && container.nodeName !== 'TABLE') {
      if(!container.parentNode) return;
      container = container.parentNode;
    }

    // Удаляем таблицу, если она найдена
    if (container && container.nodeName === 'TABLE') {
      if(!container.parentNode) return;
      container.parentNode.removeChild(container);
    }

    this.hidePopup();

    const editor = core.editor.getEditorElement();
    if(editor) core.setContent(editor.innerHTML);
  }

  addResizeHandleToCell(cell: HTMLElement): void {
    cell.style.position = 'relative';

    const oldResizer = cell.querySelector('.on-codemerge-resizer');
    if(oldResizer) oldResizer.remove();

    const resizeHandle = document.createElement('div');
    resizeHandle.classList.add('on-codemerge-resizer')

    let startX: number, startY: number, startWidth: number, startHeight: number;

    resizeHandle.addEventListener('mousedown', (e: MouseEvent) => {
      startX = e.clientX;
      startY = e.clientY;
      startWidth = parseInt(document.defaultView!.getComputedStyle(cell).width, 10);
      startHeight = parseInt(document.defaultView!.getComputedStyle(cell).height, 10);
      document.documentElement.addEventListener('mousemove', doDrag, false);
      document.documentElement.addEventListener('mouseup', stopDrag, false);
      e.preventDefault();
    });

    const doDrag = (e: MouseEvent) => {
      cell.style.width = (startWidth + e.clientX - startX) + 'px';
      cell.style.height = (startHeight + e.clientY - startY) + 'px';
    };

    const stopDrag = () => {
      document.documentElement.removeEventListener('mousemove', doDrag, false);
      document.documentElement.removeEventListener('mouseup', stopDrag, false);

      if(this.core) {
        const editor = this.core.editor.getEditorElement();
        if(editor) this.core.setContent(editor.innerHTML);
      }
    };

    cell.appendChild(resizeHandle);
  }


  private hidePopup(): void {
    if (this.popupElement) {
      this.popupElement.style.display = 'none';
    }

    if (this.core) {
      const editor = this.core.editor.getEditorElement();
      if(editor) this.core.setContent(editor.innerHTML);
    }
  }
}

export default TableButtonPlugin;
