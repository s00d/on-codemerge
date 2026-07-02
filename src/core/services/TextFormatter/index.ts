import { DomUtils } from './DomUtils';
import { StyleManager } from './StyleManager';
import {
  formatDebugMapToString,
  isFormatDebugEnabled,
  type FormatDebugMap,
} from './FormatDebugMap';
import { FormatDebugTracer } from './FormatDebugTracer';

export class TextFormatter {
  private domUtils: DomUtils;
  private readonly styleManager: StyleManager;
  private shadowRoot: ShadowRoot | null = null;
  private readonly debugTracer = new FormatDebugTracer();

  constructor(
    private container: HTMLElement,
    shadowRoot?: ShadowRoot,
    formatDebug?: boolean
  ) {
    this.domUtils = new DomUtils(container);
    this.styleManager = new StyleManager();
    this.shadowRoot = shadowRoot || null;

    if (formatDebug ?? isFormatDebugEnabled()) {
      this.enableFormatDebug(true);
    }
  }

  enableFormatDebug(enabled: boolean): void {
    this.debugTracer.setEnabled(enabled);
    this.domUtils.setTracer(enabled ? this.debugTracer : null);
  }

  isFormatDebugEnabled(): boolean {
    return this.debugTracer.isEnabled();
  }

  getLastDebugMap(): FormatDebugMap | null {
    return this.debugTracer.getLastMap();
  }

  toggleStyle(styleCommand: string): void {
    const selection = this.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    if (this.styleManager.isBlockStyle(styleCommand)) {
      this.toggleBlockStyle(styleCommand, selection);
      return;
    }

    this.debugTracer.begin(styleCommand, this.container, selection);

    const nodesToStyle = this.domUtils.getSelectedRoot(selection, false, styleCommand);
    if (!nodesToStyle || nodesToStyle.length === 0) {
      this.debugTracer.setAction('noop');
      const map = this.debugTracer.end(this.container);
      if (map) this.debugTracer.logToConsole(map, formatDebugMapToString);
      return;
    }

    let action: 'apply' | 'remove' = 'apply';

    nodesToStyle.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        node = this.wrapTextNodeInSpan(node);
      }

      const element = node as HTMLElement;
      const isFormatted = this.styleManager.has(element, styleCommand);

      if (isFormatted) {
        action = 'remove';
        this.domUtils.removeStyleFromNode(
          node,
          styleCommand,
          this.styleManager.remove.bind(this.styleManager)
        );
      } else {
        this.domUtils.applyStyleToNode(
          node,
          styleCommand,
          this.styleManager.set.bind(this.styleManager)
        );
      }
    });

    this.debugTracer.setAction(action);
    const map = this.debugTracer.end(this.container);
    if (map) this.debugTracer.logToConsole(map, formatDebugMapToString);
  }

  private toggleBlockStyle(styleCommand: string, selection: Selection): void {
    this.debugTracer.begin(styleCommand, this.container, selection);

    const range = selection.getRangeAt(0);
    const blockElements = this.domUtils.findBlockElementsInRange(range);

    this.debugTracer.step(
      'findBlockElements',
      blockElements.map((el) => el.tagName),
      blockElements.length === 0 ? 'no_blocks_found' : 'blocks_in_range'
    );

    if (blockElements.length === 0) {
      this.debugTracer.setAction('noop');
      const map = this.debugTracer.end(this.container);
      if (map) this.debugTracer.logToConsole(map, formatDebugMapToString);
      return;
    }

    const isCompletelyStyled = blockElements.every((el) =>
      this.styleManager.has(el, styleCommand)
    );
    const action = isCompletelyStyled ? 'remove' : 'apply';

    blockElements.forEach((element) => {
      if (isCompletelyStyled) {
        this.styleManager.remove(element, styleCommand);
      } else {
        this.styleManager.set(element, styleCommand);
      }
    });

    this.debugTracer.setNodesToModify(blockElements, this.container);
    this.debugTracer.setAction(action);
    const map = this.debugTracer.end(this.container);
    if (map) this.debugTracer.logToConsole(map, formatDebugMapToString);
  }

  setColor(color: string): void {
    this.applyStyleToSelectedNodes((element) => {
      element.style.color = color;
    });
  }

  setBackgroundColor(color: string): void {
    this.applyStyleToSelectedNodes((element) => {
      element.style.backgroundColor = color;
    });
  }

  setFont(fontFamily: string, fontSize: string, lineHeight: string): void {
    this.applyStyleToSelectedNodes((element) => {
      element.style.fontFamily = fontFamily;
      element.style.fontSize = fontSize;
      element.style.lineHeight = lineHeight;
    });
  }

  clearFont(): void {
    this.applyStyleToSelectedNodes((element) => {
      element.style.removeProperty('font-family');
      element.style.removeProperty('font-size');
      element.style.removeProperty('line-height');
    });
  }

  applyBlock(tag: keyof HTMLElementTagNameMap = 'span'): void {
    this.applyStyleToSelectedNodes((element) => {
      const newElement = document.createElement(tag);
      newElement.textContent = element.textContent;
      newElement.classList.add('format-text-block');

      if (element.parentNode) {
        element.parentNode.replaceChild(newElement, element);
      }
    });
  }

  clearBlock(): void {
    this.applyStyleToSelectedNodes((element) => {
      const newElement = document.createElement('span');
      newElement.textContent = element.textContent;
      element.style.removeProperty('font-family');
      element.style.removeProperty('font-size');
      element.style.removeProperty('line-height');
      element.style.removeProperty('format-text-block');

      if (element.parentNode) {
        element.parentNode.replaceChild(newElement, element);
      }
    });
  }

  private applyStyleToSelectedNodes(styleApplier: (element: HTMLElement) => void): void {
    const selection = this.getSelection();
    if (!selection) return;

    const nodesToStyle = this.domUtils.getSelectedRoot(selection, false);
    if (!nodesToStyle) return;

    nodesToStyle.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE && node !== this.container) {
        styleApplier(node as HTMLElement);
      }
    });
  }

  private wrapTextNodeInSpan(node: Node): HTMLElement {
    const span = document.createElement('span');
    node.parentNode?.replaceChild(span, node);
    span.appendChild(node);
    return span;
  }

  public getSelection(): Selection | null {
    if (this.shadowRoot) {
      if ('getSelection' in this.shadowRoot) {
        const shadowSelection = (this.shadowRoot as ShadowRoot & { getSelection(): Selection })
          .getSelection();
        if (shadowSelection && shadowSelection.rangeCount > 0) {
          return shadowSelection;
        }
      }

      const mainSelection = window.getSelection();
      if (!mainSelection || mainSelection.rangeCount === 0) {
        return null;
      }

      const range = mainSelection.getRangeAt(0);
      const commonAncestor = range.commonAncestorContainer;

      if (
        this.shadowRoot.contains(commonAncestor) ||
        (commonAncestor.nodeType === Node.ELEMENT_NODE &&
          this.shadowRoot.contains(commonAncestor as Element))
      ) {
        return mainSelection;
      } else {
        const activeElement = this.shadowRoot.activeElement;
        if (activeElement && activeElement === this.container) {
          const container = this.container;
          let currentRangeCount = 1;
          const fakeSelection = {
            get rangeCount() {
              return currentRangeCount;
            },
            getRangeAt: (_index: number) => {
              const range = document.createRange();
              range.selectNodeContents(container);
              return range;
            },
            removeAllRanges: () => {
              currentRangeCount = 0;
            },
            addRange: (range: Range) => {
              if (range && container.contains(range.commonAncestorContainer)) {
                currentRangeCount = 1;
              }
            },
            toString: () => container.textContent || '',
          } as Selection;

          return fakeSelection;
        }

        return null;
      }
    } else {
      return window.getSelection();
    }
  }

  hasClass(styleCommand: string): boolean {
    const selection = this.getSelection();
    if (!selection || selection.rangeCount === 0) return false;

    if (this.styleManager.isBlockStyle(styleCommand)) {
      const range = selection.getRangeAt(0);
      const blocks = this.domUtils.findBlockElementsInRange(range);
      return blocks.length > 0 && blocks.every((el) => this.styleManager.has(el, styleCommand));
    }

    const range = selection.getRangeAt(0);

    if (range.collapsed) {
      const nodesToCheck = this.domUtils.getSelectedRoot(selection, true, styleCommand);
      return (
        nodesToCheck?.some((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            return this.styleManager.has(node as HTMLElement, styleCommand);
          }
          return false;
        }) ?? false
      );
    }

    const textNodes = this.domUtils.collectTextNodesInRangeForRead(range).filter(
      (n) => n.textContent?.trim()
    );
    if (textNodes.length === 0) return false;

    return textNodes.every((textNode) => {
      let parent = textNode.parentElement;
      while (parent && parent !== this.container) {
        if (this.styleManager.has(parent, styleCommand)) {
          return true;
        }
        parent = parent.parentElement;
      }
      return false;
    });
  }

  getStyle(name: keyof CSSStyleDeclaration): string | null | undefined {
    const selection = this.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const nodesToCheck = this.domUtils.getSelectedRoot(selection, true);
    if (!nodesToCheck) return null;

    for (const nodesToCheckItem of nodesToCheck) {
      if (nodesToCheckItem.nodeType === Node.ELEMENT_NODE) {
        const element = nodesToCheckItem as HTMLElement;
        return (element.style[name] ?? null) as string | null;
      }
      return null;
    }
  }
}
