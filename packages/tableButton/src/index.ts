import { EditorCore, IEditorModule } from "../../../src";
import TableManager from './TableManager';

export class TableButtonPlugin implements IEditorModule {
  private core: EditorCore | null = null;
  private tableManagerMap: Map<HTMLTableElement, TableManager> = new Map();

  initialize(core: EditorCore): void {
    this.core = core;
    this.injectStyles();
    this.createTableButton();

    core.subscribeToContentChange((newContent: string) => {
      this.reloadTables(core)
    });
  }

  // public reloadTables(core: EditorCore): void {
  //   const editor = core.editor.getEditorElement();
  //   if (!editor) return;
  //
  //   const tables = editor.querySelectorAll('table');
  //   tables.forEach((table: HTMLTableElement) => {
  //     // Проверяем, есть ли у таблицы уже обработчики
  //     const listener = table.getAttribute('listener')
  //     console.log(listener)
  //     if (!table.onclick) {
  //       Array.from(table.querySelectorAll('td')).forEach(cell => {
  //         this.addResizeHandleToCell(cell as HTMLElement);
  //       });
  //
  //       table.onclick = () => {}
  //
  //       table.addEventListener('contextmenu', (event: MouseEvent) => {
  //         if (event.target instanceof HTMLTableCellElement) {
  //           this.currentCell = event.target;
  //         }
  //         event.preventDefault(); // Предотвращение стандартного контекстного меню
  //         this.showPopup(event.pageX, event.pageY, table, core);
  //       });
  //     }
  //   });
  // }


  public reloadTables(core: EditorCore): void {
    const editor = core.editor.getEditorElement();
    if (!editor) return;

    const tables = editor.querySelectorAll('table');
    tables.forEach((table: HTMLTableElement) => {
      if (!this.tableManagerMap.has(table)) {
        // Если для этой таблицы еще нет TableManager, создаем его
        const tableManager = new TableManager(table, core, () => this.removeTableManager(table));
        this.tableManagerMap.set(table, tableManager);
      }
    });
  }

  private removeTableManager(table: HTMLTableElement): void {
    this.tableManagerMap.delete(table);
  }

  private injectStyles(): void {
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
    document.head.appendChild(style);
  }

  private createTableButton(): void {
    const button = document.createElement('button');
    button.textContent = 'Create 3x3 Table';
    button.classList.add('on-codemerge-button');
    button.addEventListener('click', () => this.createTable(3, 3));
    const toolbar = this.core?.toolbar.getToolbarElement();
    toolbar?.appendChild(button);
  }

  private createTable(rows: number, cols: number): void {
    if (!this.core) return;

    const table = document.createElement('table');
    table.classList.add('on-codemerge-table');

    // Создаем экземпляр TableManager для управления таблицей
    const manager = new TableManager(table, this.core, () => this.removeTableManager(table));
    manager.createHeaders(cols);

    for (let i = 0; i < rows; i++) {
      manager.addRow(); // Используем TableManager для добавления строк
    }

    this.insertTableIntoEditor(table);

    this.tableManagerMap.set(table, manager);
  }

  private insertTableIntoEditor(table: HTMLTableElement): void {
    const editor = this.core?.editor.getEditorElement();
    const selection = window.getSelection();

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      let container = range.commonAncestorContainer;

      // Проверяем, что выделение находится внутри редактора
      while (container && container !== editor) {
        if (!container.parentNode) {
          editor?.appendChild(table);
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

    if (this.core && editor) this.core.setContent(editor.innerHTML); // Обновляем содержимое редактора
  }
}

export default TableButtonPlugin;
