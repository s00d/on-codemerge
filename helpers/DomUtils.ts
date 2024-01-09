export class DomUtils {
  getDeepestNodes(range: Range): Node[] {
    const nodesToProcess = [];
    const deepestNodes: Node[] = [];
    if (!range.collapsed) {

      const startContainer = range.startContainer;
      const endContainer = range.endContainer;

      const treeWalker = document.createTreeWalker(
        range.commonAncestorContainer,
        NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
        null
      );

      let currentNode: Node|null = treeWalker.currentNode = startContainer;

      while (currentNode) {

        if (currentNode.nodeType === Node.TEXT_NODE && currentNode.textContent && currentNode.textContent.trim().length > 0) {
          // Обработка текстовых узлов
          if (range.intersectsNode(currentNode)) {
            const parent = currentNode.parentElement;
            if (parent && this.isStyledTextNode(parent)) {
              if (!deepestNodes.includes(parent)) {
                deepestNodes.push(parent);
              }
            } else {
              if (range.intersectsNode(currentNode)) {
                nodesToProcess.push(currentNode);
              }
            }
          }
        }

        if (currentNode === endContainer) {
          break;
        }

        currentNode = treeWalker.nextNode();
      }

      for (const node of nodesToProcess) {
        const newSpan = this.createSpanIfNeeded(node, range);
        if (newSpan && !deepestNodes.includes(newSpan)) {
          deepestNodes.push(newSpan);
        }
      }
    }

    return deepestNodes;
  }

  private createSpanIfNeeded(node: Node, range: Range) {
    if (node.nodeType !== Node.TEXT_NODE || !node.textContent) {
      return null;
    }

    const { textContent: text } = node;
    const startOffset = node === range.startContainer ? range.startOffset : 0;
    const endOffset = node === range.endContainer ? range.endOffset : text.length;

    if (endOffset === 0 || startOffset === text.length || startOffset === endOffset) {
      return null;
    }

    const span = document.createElement('span');
    span.textContent = text.substring(startOffset, endOffset);
    this.replaceNodeWithSpan(node, span, startOffset, endOffset);

    return span;
  }


  private replaceNodeWithSpan(node: Node, span: HTMLElement, startOffset: number, endOffset: number) {
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

  private isStyledTextNode(node: HTMLElement|null): boolean {
    if(!node) return false;
    return !node.classList.contains('on-codemerge');
  }

  isStyleApplied(
    spanElements: HTMLElement,
    range: Range,
    styleCommand: string,
    checkStyle: (element: HTMLElement, styleCommand: string) => boolean
  ): boolean {
    if (!range.collapsed) {
      if (checkStyle(spanElements, styleCommand)) {
        return true;
      }
    }
    return false;
  }

  applyStyleToDeepestNodes(
    node: Node,
    styleCommand: string,
    setStyle: (element: HTMLElement, styleCommand: string) => void
  ) {
    const fragment = document.createDocumentFragment();

    const element = node as HTMLElement;
    setStyle(element, styleCommand);

    node?.parentNode?.insertBefore(fragment, node);
  }

  removeStyleFromDeepestNodes(
    node: Node,
    styleCommand: string,
    removeStyle: (element: HTMLElement, styleCommand: string) => void
  ) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      if (this.isStyledTextNode(element)) {
        removeStyle(element, styleCommand);

        if (!element.getAttribute('style')  && element.tagName === 'SPAN') {
          const fragment = document.createDocumentFragment();
          while (element.firstChild) {
            fragment.appendChild(element.firstChild);
          }
          element.parentNode?.replaceChild(fragment, element);
        }
      }
    }
  }
}