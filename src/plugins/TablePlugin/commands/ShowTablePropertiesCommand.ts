import type { HTMLEditor } from '../../../core/HTMLEditor';
import type { Command } from '../../../core/commands/Command';
import { TableEditor } from '../components/TableEditor';

export class ShowTablePropertiesCommand implements Command {
  private table: HTMLElement;
  private tableEditor: TableEditor;

  constructor(editor: HTMLEditor, table: HTMLElement) {
    this.table = table;
    this.tableEditor = new TableEditor(editor);
  }

  execute(): void {
    // Показываем свойства таблицы напрямую
    this.tableEditor.show(this.table);
  }

  undo(): void {
    // Отмена показа свойств не требуется
  }
}
