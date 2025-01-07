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
      newElement.textContent = element.textContent; // Копируем только текст
      newElement.classList.add('format-text-block');

      if (element.parentNode) {
        element.parentNode.replaceChild(newElement, element);
      }
    });
  }

  clearBlock(): void {
    this.applyStyleToSelectedNodes((element) => {
      const newElement = document.createElement('span');
      newElement.textContent = element.textContent; // Копируем только текст
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
    const selection = window.getSelection();
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

  hasClass(styleCommand: string): boolean {
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

  getStyle(name: keyof CSSStyleDeclaration): string | null | undefined {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const nodesToCheck = this.domUtils.getSelectedRoot(selection, true);
    if (!nodesToCheck) return null;

    // Проверяем, применен ли стиль к любому из выделенных узлов
    for (const nodesToCheckItem of nodesToCheck) {
      if (nodesToCheckItem.nodeType === Node.ELEMENT_NODE) {
        const element = nodesToCheckItem as HTMLElement;
        return (element.style[name] ?? null) as string | null;
      }
      return null;
    }
  }
}
