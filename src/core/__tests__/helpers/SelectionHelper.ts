export class SelectionHelper {
  constructor(private container: HTMLElement) {}

  getContainer(): HTMLElement {
    return this.container;
  }

  private findTextNodeAndOffset(
    element: Element,
    overallOffset: number
  ): { node: Node; offset: number } | null {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let cumulativeOffset = 0;
    let currentNode: Node | null;

    while ((currentNode = walker.nextNode())) {
      const nodeLength = currentNode.textContent?.length || 0;
      if (cumulativeOffset + nodeLength >= overallOffset) {
        return { node: currentNode, offset: overallOffset - cumulativeOffset };
      }
      cumulativeOffset += nodeLength;
    }

    const lastTextNode = this.getLastTextNode(element);
    if (lastTextNode) {
      return { node: lastTextNode, offset: lastTextNode.textContent?.length || 0 };
    }
    return null;
  }

  private getLastTextNode(element: Element): Node | null {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let lastNode: Node | null = null;
    while (walker.nextNode()) {
      lastNode = walker.currentNode;
    }
    return lastNode;
  }

  public select(
    startSelector: string,
    startOffset: number,
    endSelector?: string,
    endOffset?: number
  ): void {
    const startEl = this.container.querySelector(startSelector) ?? this.container;
    const endEl = endSelector
      ? (this.container.querySelector(endSelector) ?? this.container)
      : startEl;
    const finalEndOffset = endOffset ?? startOffset;

    const start = this.findTextNodeAndOffset(startEl, startOffset);
    const end = this.findTextNodeAndOffset(endEl, finalEndOffset);

    if (!start || !end) {
      throw new Error('Selection failed: could not find text nodes for the given offsets.');
    }

    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.setStart(start.node, start.offset);
      range.setEnd(end.node, end.offset);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  public selectInContainer(startOffset: number, endOffset: number): void {
    const start = this.findTextNodeAndOffset(this.container, startOffset);
    const end = this.findTextNodeAndOffset(this.container, endOffset);
    if (!start || !end) {
      throw new Error('Selection failed: could not find text nodes in container.');
    }
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.setStart(start.node, start.offset);
      range.setEnd(end.node, end.offset);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  public selectByText(text: string, parentSelector?: string): void {
    const parent = parentSelector
      ? this.container.querySelector(parentSelector)
      : this.container;
    if (!parent) {
      throw new Error(`Parent selector "${parentSelector}" not found for selectByText.`);
    }

    const walker = document.createTreeWalker(parent, NodeFilter.SHOW_TEXT);
    let currentNode: Node | null;

    while ((currentNode = walker.nextNode())) {
      const index = currentNode.textContent?.indexOf(text);
      if (index !== -1 && index !== undefined) {
        const range = document.createRange();
        range.setStart(currentNode, index);
        range.setEnd(currentNode, index + text.length);
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
        return;
      }
    }
    throw new Error(`Text "${text}" not found within the specified container.`);
  }

  public setCursor(selector: string, offset: number): void {
    this.select(selector, offset, selector, offset);
  }

  public setCursorInContainer(offset: number): void {
    this.selectInContainer(offset, offset);
  }
}
