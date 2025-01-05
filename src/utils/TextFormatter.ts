import { DomUtils } from './DomUtils';
import { StyleManager } from './StyleManager';

export class TextFormatter {
  private domUtils: DomUtils;
  private readonly styleManager: StyleManager;

  constructor(private container: HTMLElement) {
    this.domUtils = new DomUtils(container);
    this.styleManager = new StyleManager();
  }

  toggleStyle(styleCommand: string): void {
    const selection = window.getSelection();
    if (!selection) return;

    const nodesToStyle = this.domUtils.getSelectedRoot(selection);
    if (!nodesToStyle) return;

    nodesToStyle.forEach((node) => {
      // Обернуть текстовый узел в <span>, если это необходимо
      if (node.nodeType === Node.TEXT_NODE) {
        node = this.wrapTextNodeInSpan(node);
      }

      // Применить или удалить стиль
      const element = node as HTMLElement;
      const isFormatted = this.styleManager.has(element, styleCommand);

      if (isFormatted) {
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
  }

  setFontFamily(fontFamily: string): void {
    this.applyStyleToSelectedNodes((element) => {
      element.style.fontFamily = fontFamily;
    });
  }

  setFontSize(fontSize: string): void {
    this.applyStyleToSelectedNodes((element) => {
      element.style.fontSize = fontSize;
    });
  }

  private applyStyleToSelectedNodes(styleApplier: (element: HTMLElement) => void): void {
    const selection = window.getSelection();
    if (!selection) return;

    const nodesToStyle = this.domUtils.getSelectedRoot(selection);
    if (!nodesToStyle) return;

    nodesToStyle.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE && node !== this.container) {
        styleApplier(node as HTMLElement);
      }
    });
  }

  private wrapTextNodeInSpan(node: Node): HTMLElement {
    const span = document.createElement('p');
    node.parentNode?.replaceChild(span, node);
    span.appendChild(node);
    return span;
  }

  hasStyle(styleCommand: string): boolean {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;

    const nodesToCheck = this.domUtils.getSelectedRoot(selection, true);
    if (!nodesToCheck) return false;

    // Проверяем, применен ли стиль к любому из выделенных узлов
    return nodesToCheck.some((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        return this.styleManager.has(element, styleCommand);
      }
      return false;
    });
  }
}
