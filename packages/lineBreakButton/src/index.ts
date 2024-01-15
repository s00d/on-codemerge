import type { EditorCoreInterface, IEditorModule } from "../../../src/types";
import { new_line } from "../../../src/icons";

export class LineBreakButton implements IEditorModule {
  private core: EditorCoreInterface|null = null;
  private button: HTMLDivElement|null = null;
  private tempDiv: HTMLElement | null = null;

  initialize(core: EditorCoreInterface): void {
    this.core = core;
    this.button = core.toolbar.addButtonIcon('Insert Line Break',  new_line, this.insertLineBreakEvent.bind(this));
    this.button.addEventListener('mouseenter', this.showPreview.bind(this));
    this.button.addEventListener('mouseleave', this.hidePreview.bind(this));
  }

  private findNearestOnCodemergeElement(selection: Range): HTMLElement | null {
    // Находим текущий контейнер или элемент, где находится каретка
    let container: HTMLElement = selection.commonAncestorContainer as HTMLElement;
    if(!container) return null;
    if(container.classList && container.classList.contains('on-codemerge')) return null;

    // Поднимаемся вверх по DOM, пока не найдем элемент с классом 'on-codemerge'
    while (container && container.parentNode) {
      const parent = container.parentNode as HTMLElement;
      if (parent.classList.contains('on-codemerge')) break; // Чтобы не выйти за пределы редактируемой области
      container = parent;
    }

    if (!container || !container.parentNode) return null;

    return container;
  }

  private insertLineBreakEvent(): void {
    if (!this.core) return;
    const currentSelection = this.core.getCurrentSelection();
    if (!currentSelection) return;

    const nearestCodemergeElement = this.findNearestOnCodemergeElement(currentSelection);
    if (!nearestCodemergeElement || !nearestCodemergeElement.parentNode) return;

    // Создаем новый div элемент
    const divBreak = document.createElement('div');

    divBreak.appendChild(document.createElement('br')); // Добавляем br для поддержки пустых div

    // Вставляем новый div после найденного родительского элемента
    nearestCodemergeElement.parentNode.insertBefore(divBreak, nearestCodemergeElement.nextSibling);

    // Перемещаем каретку внутрь нового div
    const newRange = document.createRange();
    newRange.setStart(divBreak, 0);
    newRange.collapse(true);
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(newRange);
    }

    // Обновляем содержимое редактора после вставки div
    const editor = this.core.editor.getEditorElement();
    if (editor) this.core.setContent(editor.innerHTML);
  }


  private showPreview(): void {
    const currentSelection = this.core?.getCurrentSelection();
    if (!currentSelection) return;

    const nearestCodemergeElement = this.findNearestOnCodemergeElement(currentSelection);
    if (!nearestCodemergeElement || !nearestCodemergeElement.parentNode) return;

    // Создаем временный div для визуальной демонстрации
    const previewDiv = document.createElement('div');
    this.applyStyles(previewDiv, {
      border: '1px dashed red',
      width: '100%',
      height: '2px'
    });

    // parent.classList.contains('on-codemerge')
    this.tempDiv = previewDiv;
    const parent = nearestCodemergeElement.parentNode as HTMLElement;
    if(parent.classList.contains('on-codemerge')) {
      parent.appendChild(previewDiv);
      return;
    }

    parent.insertBefore(previewDiv, nearestCodemergeElement.nextSibling);

  }

  private hidePreview(): void {
    if (this.tempDiv && this.tempDiv.parentNode) {
      this.tempDiv.parentNode.removeChild(this.tempDiv);
      this.tempDiv = null;
    }
  }


  private applyStyles(element: HTMLElement, styles: {[key: string]: string}): void {
    Object.assign(element.style, styles);
  }

  destroy(): void {
    this.button?.removeEventListener('click', this.insertLineBreakEvent)
    this.button = null;
  }
}

export default LineBreakButton;
