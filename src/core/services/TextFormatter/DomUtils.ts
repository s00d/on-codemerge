import type { FormatDebugTracer } from './FormatDebugTracer';
import { getNodePath } from './FormatDebugMap';

export class DomUtils {
  private tracer: FormatDebugTracer | null = null;

  constructor(private container: HTMLElement) {}

  setTracer(tracer: FormatDebugTracer | null): void {
    this.tracer = tracer;
  }

  getContainer(): HTMLElement {
    return this.container;
  }

  getSelectedRoot(selection: Selection, read = false, styleCommand?: string): Node[] {
    const range = selection.getRangeAt(0);

    if (!range.collapsed || this.hasContentInRange(range)) {
      return this.getDeepestNodes(range, read, styleCommand);
    } else if (!read) {
      return this.handleCollapsedRange(selection, range);
    }
    return this.getCollapsedReadNodes(selection);
  }

  findBlockElementsInRange(range: Range): HTMLElement[] {
    const blocks = new Set<HTMLElement>();
    const walker = document.createTreeWalker(
      this.container,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) =>
          range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
      }
    );

    while (walker.nextNode()) {
      const el = walker.currentNode as HTMLElement;
      if (this.isBlockNode(el)) {
        blocks.add(el);
      }
    }

    if (blocks.size === 0 && range.intersectsNode(this.container)) {
      const directText = Array.from(this.container.childNodes).some(
        (n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim()
      );
      if (directText && !this.container.querySelector('div, p, li, h1, h2, h3, h4, h5, h6')) {
        return [];
      }
    }

    return Array.from(blocks);
  }

  private getDeepestNodes(range: Range, read: boolean, styleCommand?: string): Node[] {
    const deepestNodes: Node[] = [];

    const isInContainer =
      this.container.contains(range.commonAncestorContainer) ||
      this.container.getRootNode().contains(range.commonAncestorContainer);

    if (!isInContainer) {
      this.tracer?.step('getDeepestNodes', [], 'outside_container');
      return [];
    }

    if (!read) {
      this.tracer?.step('splitBoundaryNodes', {
        startOffset: range.startOffset,
        endOffset: range.endOffset,
      });
      this.splitBoundaryNodes(range);
    }

    const textNodes = this.collectTextNodesInRange(range);
    this.tracer?.step(
      'collectTextNodes',
      textNodes.map((n) => ({
        path: getNodePath(n, this.container),
        text: n.textContent?.slice(0, 30),
      }))
    );

    for (const textNode of textNodes) {
      if (!textNode.textContent?.trim()) continue;

      const formattingParent = this.findFormattingParent(textNode);

      if (formattingParent) {
        const fullySelected = this.isNodeFullySelected(formattingParent, range);
        this.tracer?.step(
          'formattingParent',
          {
            path: getNodePath(formattingParent, this.container),
            tag: formattingParent.tagName,
          },
          fullySelected ? 'fully_selected' : 'partial_selection'
        );
      }

      if (
        formattingParent &&
        this.isNodeFullySelected(formattingParent, range) &&
        !deepestNodes.includes(formattingParent)
      ) {
        deepestNodes.push(formattingParent);
        continue;
      }

      if (
        !read &&
        formattingParent &&
        styleCommand &&
        this.styleCommandOnElement(formattingParent, styleCommand) &&
        !this.isNodeFullySelected(formattingParent, range)
      ) {
        const segment = this.isolatePartialFormattedSegment(formattingParent, range);
        this.tracer?.step(
          'isolatePartialFormattedSegment',
          segment ? getNodePath(segment, this.container) : null,
          'partial_in_formatted_parent'
        );
        if (segment && !deepestNodes.includes(segment)) {
          deepestNodes.push(segment);
        }
        continue;
      }

      if (read && formattingParent && !deepestNodes.includes(formattingParent)) {
        deepestNodes.push(formattingParent);
        continue;
      }

      if (!read) {
        const span = this.createSpanIfNeeded(textNode, range);
        if (span) {
          this.tracer?.step(
            'createSpanIfNeeded',
            getNodePath(span, this.container),
            span === formattingParent ? 'reuse_parent' : 'new_span'
          );
        }
        if (span && !deepestNodes.includes(span)) {
          deepestNodes.push(span);
        }
      } else if (formattingParent && !deepestNodes.includes(formattingParent)) {
        deepestNodes.push(formattingParent);
      }
    }

    this.tracer?.setNodesToModify(deepestNodes, this.container);
    return deepestNodes;
  }

  private collectTextNodesInRange(range: Range): Text[] {
    const nodes: Text[] = [];
    const walker = document.createTreeWalker(
      range.commonAncestorContainer,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) =>
          range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
      }
    );

    let currentNode: Node | null = range.startContainer;

    if (currentNode.nodeType === Node.TEXT_NODE) {
      if (range.intersectsNode(currentNode)) {
        nodes.push(currentNode as Text);
      }
    } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
      const child = currentNode.childNodes[range.startOffset];
      if (child?.nodeType === Node.TEXT_NODE && range.intersectsNode(child)) {
        nodes.push(child as Text);
      }
    }

    walker.currentNode = currentNode;
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      if (!range.intersectsNode(node)) break;

      if (range.endContainer === node && range.endOffset === 0) break;

      if (node === range.endContainer && range.endContainer.nodeType === Node.TEXT_NODE) {
        if (range.endOffset > 0 && !nodes.includes(node)) {
          nodes.push(node);
        }
        break;
      }

      if (!nodes.includes(node)) {
        nodes.push(node);
      }
    }

    if (
      nodes.length === 0 &&
      range.startContainer.nodeType === Node.TEXT_NODE &&
      range.intersectsNode(range.startContainer)
    ) {
      nodes.push(range.startContainer as Text);
    }

    return nodes;
  }

  private splitBoundaryNodes(range: Range): void {
    const endContainer = range.endContainer;
    const endOffset = range.endOffset;

    if (
      endContainer.nodeType === Node.TEXT_NODE &&
      endOffset > 0 &&
      endOffset < (endContainer as Text).length
    ) {
      (endContainer as Text).splitText(endOffset);
    }

    const startContainer = range.startContainer;
    const startOffset = range.startOffset;

    if (
      startContainer.nodeType === Node.TEXT_NODE &&
      startOffset > 0 &&
      startOffset < (startContainer as Text).length
    ) {
      const newStartNode = (startContainer as Text).splitText(startOffset);
      if (endContainer === startContainer) {
        range.setEnd(newStartNode, endOffset - startOffset);
      }
      range.setStart(newStartNode, 0);
    }
  }

  private isolatePartialFormattedSegment(parent: HTMLElement, range: Range): HTMLElement {
    const segment = document.createElement('span');
    this.copyFormattingAttributes(parent, segment);

    const fragment = range.extractContents();
    segment.appendChild(fragment);

    const startsAtParentBeginning =
      (range.startContainer === parent && range.startOffset === 0) ||
      (range.startContainer === parent.firstChild &&
        range.startOffset === 0 &&
        parent.firstChild === parent.childNodes[0]);

    if (startsAtParentBeginning) {
      parent.parentNode?.insertBefore(segment, parent);
    } else {
      parent.parentNode?.insertBefore(segment, parent.nextSibling);
    }

    this.unwrapIfEmpty(parent);
    return segment;
  }

  private styleCommandOnElement(element: HTMLElement, styleCommand: string): boolean {
    const classMap: Record<string, string> = {
      bold: 'format-bold',
      italic: 'format-italic',
      underline: 'format-underline',
      strikethrough: 'format-strikethrough',
      superscript: 'format-superscript',
      subscript: 'format-subscript',
    };
    const className = classMap[styleCommand];
    if (className && element.classList.contains(className)) return true;
    if (styleCommand === 'bold' && element.tagName === 'B') return true;
    if (styleCommand === 'italic' && element.tagName === 'I') return true;
    if (styleCommand === 'underline' && element.tagName === 'U') return true;
    return false;
  }

  collectTextNodesInRangeForRead(range: Range): Text[] {
    return this.collectTextNodesInRange(range);
  }

  private isNodeFullySelected(node: HTMLElement, range: Range): boolean {
    if (!node.textContent?.trim()) return false;

    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    let textNode: Node | null;
    let foundText = false;

    while ((textNode = walker.nextNode())) {
      const content = textNode.textContent;
      if (!content?.trim()) continue;
      foundText = true;

      if (!range.intersectsNode(textNode)) {
        return false;
      }

      const length = content.length;
      const start = textNode === range.startContainer ? range.startOffset : 0;
      const end = textNode === range.endContainer ? range.endOffset : length;

      if (start > 0 || end < length) {
        return false;
      }
    }

    return foundText;
  }

  private findFormattingParent(node: Node): HTMLElement | null {
    let el = node.parentElement;
    while (el && el !== this.container) {
      if (this.isFormattingElement(el)) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  }

  private isFormattingElement(node: HTMLElement): boolean {
    if (this.isTableNode(node) || this.isBlockNode(node)) {
      return false;
    }

    const tag = node.tagName;
    if (['B', 'I', 'U', 'STRIKE', 'S', 'SUB', 'SUP'].includes(tag)) {
      return true;
    }

    if (tag === 'A' && node.hasAttribute('href')) {
      return true;
    }

    if (tag === 'SPAN') {
      return (
        node.classList.length > 0 ||
        !!node.getAttribute('style') ||
        Array.from(node.classList).some((cls) => cls.startsWith('format-'))
      );
    }

    return Array.from(node.classList).some((cls) => cls.startsWith('format-'));
  }

  private getCollapsedReadNodes(selection: Selection): Node[] {
    const anchorNode = selection.anchorNode;
    if (!anchorNode) return [];

    const isInContainer =
      this.container.contains(anchorNode) ||
      this.container.getRootNode().contains(anchorNode);

    if (!isInContainer) return [];

    const nodes: HTMLElement[] = [];
    let el: HTMLElement | null =
      anchorNode.nodeType === Node.TEXT_NODE
        ? anchorNode.parentElement
        : (anchorNode as HTMLElement);

    while (el && el !== this.container) {
      if (this.isFormattingElement(el)) {
        nodes.push(el);
      }
      el = el.parentElement;
    }

    return nodes;
  }

  private handleCollapsedRange(selection: Selection, range: Range): Node[] {
    const anchorNode = selection.anchorNode;
    if (!anchorNode) return [];

    const isInContainer =
      this.container.contains(anchorNode) ||
      this.container.getRootNode().contains(anchorNode);

    if (!isInContainer) return [];

    const formattingParent = this.findFormattingParent(anchorNode);
    if (formattingParent) {
      this.tracer?.step(
        'handleCollapsedRange',
        getNodePath(formattingParent, this.container),
        'reuse_formatting_parent'
      );
      return [formattingParent];
    }

    const span = document.createElement('span');
    span.textContent = '\u200B';
    range.insertNode(span);
    range.setStart(span, 1);
    range.setEnd(span, 1);
    selection.removeAllRanges();
    selection.addRange(range);

    this.tracer?.step('handleCollapsedRange', getNodePath(span, this.container), 'insert_zwsp_span');
    return [span];
  }

  private hasContentInRange(range: Range): boolean {
    return range.toString().trim().length > 0 || range.cloneContents().childNodes.length > 0;
  }

  private createSpanIfNeeded(node: Node, range: Range): HTMLElement | null {
    if (node.nodeType !== Node.TEXT_NODE || !node.textContent) return null;

    const text = node.textContent;
    const startOffset = node === range.startContainer ? range.startOffset : 0;
    const endOffset = node === range.endContainer ? range.endOffset : text.length;

    if (endOffset === 0 || startOffset === text.length || startOffset === endOffset) return null;

    const formattingParent = this.findFormattingParent(node);

    if (
      startOffset === 0 &&
      endOffset === text.length &&
      formattingParent &&
      this.isNodeFullySelected(formattingParent, range)
    ) {
      return formattingParent;
    }

    const element = document.createElement('span');
    const selectedText = text.substring(startOffset, endOffset);

    element.textContent = selectedText;
    this.replaceNodeWithSpan(node, element, startOffset, endOffset);

    return element;
  }

  private copyFormattingAttributes(from: HTMLElement, to: HTMLElement): void {
    Array.from(from.classList).forEach((cls) => to.classList.add(cls));
    if (from.style.cssText) {
      to.style.cssText = from.style.cssText;
    }
  }

  private replaceNodeWithSpan(
    node: Node,
    span: HTMLElement,
    startOffset: number,
    endOffset: number
  ): void {
    const text = node.textContent;
    const parent = node.parentNode;

    if (!parent || !text) return;

    const beforeText = document.createTextNode(text.substring(0, startOffset));
    const afterText = document.createTextNode(text.substring(endOffset));
    parent.insertBefore(beforeText, node);
    parent.insertBefore(span, node);
    parent.insertBefore(afterText, node);
    parent.removeChild(node);
  }

  private isTableNode(node: HTMLElement | null): boolean {
    return node
      ? !!(node.closest('table') || node.closest('tr') || node.closest('td') || node.closest('th'))
      : false;
  }

  isBlockNode(node: HTMLElement | null): boolean {
    if (!node) return false;
    if (node.classList.contains('block-content')) return true;
    return ['DIV', 'P', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(node.tagName);
  }

  applyStyleToNode(
    node: Node,
    styleCommand: string,
    setStyle: (element: HTMLElement, styleCommand: string) => void
  ): void {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      if (!this.isBlockNode(element) || this.isFormattingElement(element)) {
        setStyle(element, styleCommand);
      }
    }
  }

  removeStyleFromNode(
    node: Node,
    styleCommand: string,
    removeStyle: (element: HTMLElement, styleCommand: string) => void
  ): void {
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const element = node as HTMLElement;
    if (!this.isFormattingElement(element) && !element.classList.length) return;

    removeStyle(element, styleCommand);
    this.unwrapIfEmpty(element);
  }

  private unwrapIfEmpty(element: HTMLElement): void {
    if (
      !element.getAttribute('style') &&
      element.classList.length === 0 &&
      element.tagName === 'SPAN'
    ) {
      const parent = element.parentNode;
      while (element.firstChild) {
        parent?.insertBefore(element.firstChild, element);
      }
      parent?.removeChild(element);
    }
  }
}
