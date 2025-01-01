import type { Command } from '../../../core/commands/Command';
import type { HTMLEditor } from '../../../core/HTMLEditor';
import { createImg } from '../../../utils/helpers.ts';

export class ImageCommand implements Command {
  private editor: HTMLEditor;
  private dataUrl: string;

  constructor(editor: HTMLEditor, dataUrl: string) {
    // this.editor = editor;
    this.dataUrl = dataUrl;
    this.editor = editor;
  }

  execute(): void {
    const image = createImg('max-w-full h-auto rounded-lg', this.dataUrl);

    const range = document.createRange();

    if (range) {
      range.selectNodeContents(this.editor.getContainer());
      range.collapse(false);

      const fragment = document.createDocumentFragment();
      fragment.appendChild(image);
      range.deleteContents();
      range.insertNode(image);
      range.collapse(false);
    }
  }
}
