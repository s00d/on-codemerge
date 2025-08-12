import type { Command } from '../../../core/commands/Command.ts';
import { TableOperations } from '../services/TableOperations.ts';
import type { HTMLEditor } from '../../../core/HTMLEditor';

export class AddColumnCommand implements Command {
  private table: HTMLElement;
  private cell: HTMLElement;
  private before: boolean;
  private editor?: HTMLEditor;

  constructor(table: HTMLElement, cell: HTMLElement, before: boolean, editor?: HTMLEditor) {
    this.table = table;
    this.cell = cell;
    this.before = before;
    this.editor = editor;
  }

  execute(): void {
    TableOperations.addColumn(this.table, this.cell, this.before, this.editor);
  }
}
