import type { EditorCore, IEditorModule } from "@/index";
import { DomUtils } from "@root/helpers/DomUtils";
import trash from "../../../icons/trash.svg";

export class ClearStylesButton implements IEditorModule {
  private domUtils: DomUtils;

  constructor() {
    this.domUtils = new DomUtils();
  }

  initialize(core: EditorCore): void {
    core.toolbar.addButtonIcon('Clear Styles', trash, () => {
      core.restoreCurrentSelection();
      if (this.isInEditor(core)) {
        this.clearStyles(core);
        core.appElement.focus();
      } else {
        console.log('The selection is not within the editor');
      }
    });
  }

  private isInEditor(core: EditorCore): boolean|null {
    const selection = window.getSelection();
    console.log(selection);
    if (!selection) return false;

    const editorElement = core.editor.getEditorElement();

    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const selectedContent = range.commonAncestorContainer;
      return editorElement && editorElement.contains(selectedContent);
    }
    return false;
  }

  private clearStyles(core: EditorCore) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const originalRange = selection.getRangeAt(0);
    const parentElement = originalRange.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
      ? originalRange.commonAncestorContainer
      : originalRange.commonAncestorContainer.parentNode;

    if (parentElement instanceof HTMLElement) {
      // Проверяем, содержит ли родительский элемент класс 'on-codemerge'
      if (!parentElement.classList.contains('on-codemerge')) {
        // Создаём новый диапазон, который охватывает весь родительский элемент
        const originalRange = document.createRange();
        originalRange.selectNodeContents(parentElement);
      }

      const deepestNodes = this.domUtils.getDeepestNodes(originalRange) as HTMLElement[];
      deepestNodes.forEach(node => {
        this.replaceWithSpanOrParagraph(node);
      });

      // Возвращаем первоначальный диапазон
      selection.removeAllRanges();
      selection.addRange(originalRange);
    }

    const editor = core.editor.getEditorElement();
    if (editor) core.setContent(editor.innerHTML);
  }

  private replaceWithSpanOrParagraph(node: Node) {
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const element = node as HTMLElement;
    const spanTagNames = ['b', 'i', 'u', 'strike']; // Обновить список по необходимости
    const paragraphTagNames = ['li', 'ul', 'ol', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'code'];

    element.removeAttribute('style');
    element.removeAttribute('class');

    if (spanTagNames.includes(element.tagName.toLowerCase())) {
      this.replaceElementWith(element, 'span');
    } else if (paragraphTagNames.includes(element.tagName.toLowerCase())) {
      this.replaceElementWith(element, 'p');
    }
  }

  private replaceElementWith(element: HTMLElement, newTagName: string) {
    const newElement = document.createElement(newTagName);
    while (element.firstChild) {
      newElement.appendChild(element.firstChild);
    }
    element.parentNode?.replaceChild(newElement, element);
  }
}

export default ClearStylesButton;
