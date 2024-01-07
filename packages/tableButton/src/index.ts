import { EditorCore, IEditorModule } from "@/index";
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

  public reloadTables(core: EditorCore): void {
    const editor = core.editor.getEditorElement();
    if (!editor) return;

    const tables = editor.querySelectorAll('table');
    tables.forEach((table: HTMLTableElement) => {
      if (!this.tableManagerMap.has(table)) {
        // Если для этой таблицы еще нет TableManager, создаем его
        const tableManager = new TableManager(
          table,
          core,
          () => this.removeTableManager(table),
          () => core.setContent(editor.innerHTML)
        );
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

    this.tableManagerMap.set(table, manager);
  }
}

export default TableButtonPlugin;
