import type { Command } from '../../../core/commands/Command';
import type { HTMLEditor } from '../../../core/HTMLEditor';
import { createContainer, createLineBreak } from '../../../utils/helpers.ts';

export class BlockCommand implements Command {
  private editor: HTMLEditor;

  constructor(editor: HTMLEditor) {
    this.editor = editor;
  }

  execute(): void {
    const block = this.createBlock();
    const container = this.editor.getContainer();

    // Get current selection or create a new one at the end
    const selection = window.getSelection();
    let range: Range;

    if (selection && selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
    } else {
      range = document.createRange();
      range.selectNodeContents(container);
      range.collapse(false);

      selection?.removeAllRanges();
      selection?.addRange(range);
    }

    // Insert block
    range.deleteContents();
    range.insertNode(block);
    range.collapse(false);
  }

  private createBlock(): HTMLElement {
    const block = createContainer('editor-block');
    block.setAttribute('contenteditable', 'true');

    // Создание содержимого блока
    const blockContent = createContainer('block-content');
    blockContent.contentEditable = 'true';
    blockContent.setAttribute('contenteditable', 'true');
    blockContent.textContent = this.editor.t('New Block');

    block.appendChild(blockContent);
    block.appendChild(createLineBreak());

    return block;
  }
}
