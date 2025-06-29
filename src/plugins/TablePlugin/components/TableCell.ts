// TableCell.ts

import { focusNodeStart } from '../../../utils/Selection';

export class TableCell {
  private element: HTMLElement;

  constructor(element: HTMLElement) {
    this.element = element;
    this.initialize();
  }

  private initialize(): void {
    this.element.contentEditable = 'true';
    if (!this.element.firstChild) {
      this.element.appendChild(document.createTextNode(''));
    }
  }

  public focus(): void {
    focusNodeStart(this.element);
  }

  public getElement(): HTMLElement {
    return this.element;
  }
}
