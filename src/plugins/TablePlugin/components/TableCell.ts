// TableCell.ts

import { focusNodeStart } from '../../../utils/Selection';
import type { HTMLEditor } from '../../../core/HTMLEditor';

export class TableCell {
  private element: HTMLElement;
  private editor?: HTMLEditor;

  constructor(element: HTMLElement, editor?: HTMLEditor) {
    this.element = element;
    this.editor = editor;
    this.initialize();
  }

  private initialize(): void {
    this.element.contentEditable = 'true';
    if (!this.element.firstChild) {
      this.element.appendChild(document.createTextNode(''));
    }
  }

  public focus(): void {
    focusNodeStart(this.element, this.editor);
  }

  public getElement(): HTMLElement {
    return this.element;
  }
}
