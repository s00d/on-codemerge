import TableManager from './TableManager';
import { table } from "../../../src/icons";
import type { IEditorModule, Observer, EditorCoreInterface } from "../../../src/types";

export class TableButton implements IEditorModule, Observer {
  private core: EditorCoreInterface | null = null;
  private tableManagerMap: Map<string, TableManager> = new Map();
  private button: HTMLDivElement | null = null;

  initialize(core: EditorCoreInterface): void {
    this.core = core;
    this.injectStyles();
    this.button = core.toolbar.addButtonIcon('Table', table, this.createTableEvent.bind(this))

    core.subscribeToContentChange(() => {
      this.reloadTables(core)
    });

    core.i18n.addObserver(this);
  }

  update(): void {
    if(this.button) this.button.title = this.core!.i18n.translate('Table');
  }

  private createTableEvent() {
    return this.createTable(3, 3);
  }

  public reloadTables(core: EditorCoreInterface): void {
    const editor = core.editor.getEditorElement();
    if (!editor) return;

    const tables = editor.querySelectorAll('table');
    tables.forEach((table: HTMLTableElement) => {
      let blockId = table.id;
      if (!blockId || blockId === '' || !blockId.startsWith('table-')) {
        table.id = blockId = 'table-' + Math.random().toString(36).substring(2, 11)
      }

      if (!this.tableManagerMap.has(blockId)) {
        // Если для этой таблицы еще нет TableManager, создаем его
        const tableManager = new TableManager(
          table,
          core,
          () => this.removeTableManager(table),
          () => core.setContent(editor.innerHTML)
        );
        this.tableManagerMap.set(blockId, tableManager);
      }
    });
  }

  private removeTableManager(table: HTMLTableElement): void {
    const tableId = table.id;
    if (tableId) {
      this.tableManagerMap.delete(tableId);
    }
  }

  private injectStyles(): void {
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
            .on-codemerge-resizer {
                width: 5px;
                height: 5px;
                background: gray;
                position: absolute;
                right: 0;
                bottom: 0;
                cursor: nwse-resize;
            }
        `;
    document.head.appendChild(style);
  }

  private createTable(rows: number, cols: number): void {
    if (!this.core) return;

    const table = document.createElement('table');
    table.classList.add('on-codemerge-table');
    table.id = 'table-' + Math.random().toString(36).substring(2, 11)

    const editor = this.core?.editor.getEditorElement();
    // Создаем экземпляр TableManager для управления таблицей
    const manager = new TableManager(
      table,
      this.core,
      () => this.removeTableManager(table),
      () => editor && this.core ? this.core.setContent(editor.innerHTML) : null,
    );
    manager.createHeaders(cols);

    for (let i = 0; i < rows; i++) {
      manager.addRow(); // Используем TableManager для добавления строк
    }

    this.core.saveCurrentSelection();
    this.core.insertHTMLIntoEditor(table);
    this.core.moveCursorToStart();

    this.tableManagerMap.set(table.id, manager);
  }

  destroy(): void {
    // Remove all TableManager instances and clean up references
    this.tableManagerMap.forEach((manager) => {
      manager.destroy();
    });
    this.tableManagerMap.clear();

    this.button?.removeEventListener('click', this.createTableEvent);
    this.button = null;
  }
}

export default TableButton;
