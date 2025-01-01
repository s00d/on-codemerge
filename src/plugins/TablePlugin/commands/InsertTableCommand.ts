import type { Command } from '../../../core/commands/Command.ts';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';
import { Table } from '../components/Table.ts';
import { createLineBreak } from '../../../utils/helpers.ts';

export class InsertTableCommand implements Command {
  private options: { rows: number; cols: number; hasHeader: boolean };
  private range: Range;

  constructor(
    _editor: HTMLEditor,
    options: { rows: number; cols: number; hasHeader: boolean },
    range: Range
  ) {
    this.options = options;
    this.range = range.cloneRange();
  }

  execute(): void {
    const table = new Table(this.options);
    const tableElement = table.getElement();
    const br = createLineBreak();

    const fragment = document.createDocumentFragment();
    fragment.appendChild(tableElement);
    fragment.appendChild(br);

    this.range.deleteContents();
    this.range.insertNode(fragment);

    table.focusFirstCell();
  }
}
