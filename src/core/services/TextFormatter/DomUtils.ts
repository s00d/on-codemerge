export class DomUtils {
  constructor(private container: HTMLElement) {}

  getSelectedRoot(selection: Selection, read = false): Node[] {
    const range = selection.getRangeAt(0);

    if (!range.collapsed || this.hasContentInRange(range)) {
      return this.getDeepestNodes(range, read);
    } else if (!read) {
      return this.handleCollapsedRange(selection, range);
    }
    return [];
  }

  private getDeepestNodes(range: Range, read: boolean): Node[] {
    const nodesToProcess: Node[] = [];
    const deepestNodes: Node[] = [];

    // Проверяем, находится ли range в контейнере или в его Shadow DOM
    const isInContainer =
      this.container.contains(range.commonAncestorContainer) ||
      this.container.getRootNode().contains(range.commonAncestorContainer);

    if (!isInContainer) {
      return [];
    }

    const treeWalker = document.createTreeWalker(
      range.commonAncestorContainer,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      null
    );

    let currentNode: Node | null = (treeWalker.currentNode = range.startContainer);

    while (currentNode) {
      if (
        currentNode !== this.container &&
        currentNode.nodeType === Node.TEXT_NODE &&
        currentNode.textContent &&
        currentNode.textContent.trim().length > 0 &&
        range.intersectsNode(currentNode)
      ) {
        const parent = currentNode.parentElement;
        if (
          parent &&
          this.isStyledTextNode(parent) &&
          !this.isTableNode(parent) &&
          !this.isBlockNode(parent)
        ) {
          if (!deepestNodes.includes(parent)) {
            deepestNodes.push(parent);
          }
        } else {
          nodesToProcess.push(currentNode);
        }
      }

      if (currentNode === range.endContainer) break;
      currentNode = treeWalker.nextNode();
    }

    if (!read) {
      for (const node of nodesToProcess) {
        const newSpan = this.createSpanIfNeeded(node, range);
        if (newSpan && !deepestNodes.includes(newSpan)) {
          deepestNodes.push(newSpan);
        }
      }
    }

    return deepestNodes;
  }

  private handleCollapsedRange(selection: Selection, range: Range): Node[] {
    const currentNode = selection.anchorNode;
    if (!currentNode) return [];

    // Проверяем, находится ли узел в контейнере или в его Shadow DOM
    const isInContainer =
      this.container.contains(currentNode) || this.container.getRootNode().contains(currentNode);

    if (!isInContainer) return [];

    let span: HTMLElement = document.createElement('span');
    if (currentNode.nodeType === Node.ELEMENT_NODE && (currentNode as Element).tagName === 'SPAN') {
      span = currentNode as HTMLElement;
    } else {
      span.textContent = ' \u200B'; // Неразрывный пробел
      currentNode.parentNode?.insertBefore(span, currentNode.nextSibling);
    }

    range.setStart(span, 1);
    range.setEnd(span, 1);
    selection.removeAllRanges();
    selection.addRange(range);

    return [span];
  }

  private hasContentInRange(range: Range): boolean {
    return range.toString().trim().length > 0 || range.cloneContents().childNodes.length > 0;
  }

  private createSpanIfNeeded(node: Node, range: Range): HTMLElement | null {
    if (node.nodeType !== Node.TEXT_NODE || !node.textContent) return null;

    const { textContent: text } = node;
    const startOffset = node === range.startContainer ? range.startOffset : 0;
    const endOffset = node === range.endContainer ? range.endOffset : text.length;

    if (endOffset === 0 || startOffset === text.length || startOffset === endOffset) return null;

    const element: HTMLElement = document.createElement('span');
    element.textContent = text.substring(startOffset, endOffset);
    this.replaceNodeWithSpan(node, element, startOffset, endOffset);

    try {
      const selection = window.getSelection();
      if (selection) {
        const newRange = document.createRange();
        const textNode = element.firstChild;
        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
          newRange.setStart(textNode, 0);
          newRange.setEnd(textNode, textNode.textContent?.length || 0);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }
    } catch (e) {
      console.error(e);
    }

    return element;
  }

  private replaceNodeWithSpan(
    node: Node,
    span: HTMLElement,
    startOffset: number,
    endOffset: number
  ): void {
    const { textContent: text } = node;
    const parent = node.parentNode;

    if (!parent || !text) return;

    const beforeText = document.createTextNode(text.substring(0, startOffset));
    const afterText = document.createTextNode(text.substring(endOffset));
    parent.insertBefore(beforeText, node);
    parent.insertBefore(span, node);
    parent.insertBefore(afterText, node);
    parent.removeChild(node);
  }

  private isStyledTextNode(node: HTMLElement | null): boolean {
    return node ? !node.classList.contains('html-editor') : false;
  }

  private isTableNode(node: HTMLElement | null): boolean {
    return node
      ? !!(node.closest('table') || node.closest('tr') || node.closest('td') || node.closest('th'))
      : false;
  }
  private isBlockNode(node: HTMLElement | null): boolean {
    return node ? node.classList.contains('block-content') : false;
  }

  applyStyleToNode(
    node: Node,
    styleCommand: string,
    setStyle: (element: HTMLElement, styleCommand: string) => void
  ): void {
    if (node.nodeType === Node.ELEMENT_NODE) {
      setStyle(node as HTMLElement, styleCommand);
    }
  }

  removeStyleFromNode(
    node: Node,
    styleCommand: string,
    removeStyle: (element: HTMLElement, styleCommand: string) => void
  ): void {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      if (this.isStyledTextNode(element)) {
        removeStyle(element, styleCommand);

        if (
          !element.getAttribute('style') &&
          element.classList.length === 0 &&
          element.tagName === 'SPAN'
        ) {
          const fragment = document.createDocumentFragment();
          while (element.firstChild) {
            fragment.appendChild(element.firstChild);
          }
          const parent = element.parentNode;
          const firstChild = fragment.firstChild;
          const lastChild = fragment.lastChild;

          // Вставляем фрагмент в DOM
          parent?.replaceChild(fragment, element);

          // Обновление выделения на содержимое фрагмента
          try {
            if (
              firstChild &&
              lastChild &&
              firstChild.nodeType === Node.TEXT_NODE &&
              lastChild.nodeType === Node.TEXT_NODE
            ) {
              const selection = window.getSelection();
              if (selection) {
                const range = document.createRange();
                range.setStart(firstChild, 0);
                range.setEnd(lastChild, lastChild.textContent?.length || 0);
                selection.removeAllRanges();
                selection.addRange(range);
              }
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
    }
  }
}
