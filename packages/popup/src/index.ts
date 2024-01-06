import { EditorCore, IEditorModule } from "../../../src";

export class SelectionPopupPlugin implements IEditorModule {
  private popupElement: HTMLDivElement | null = null;

  initialize(core: EditorCore): void {
    // Создание элемента попапа
    this.popupElement = document.createElement('div');
    this.popupElement.style.display = 'none'; // Изначально скрыт
    this.popupElement.style.position = 'absolute';
    this.popupElement.style.zIndex = '1000';
    this.popupElement.style.background = '#fff';
    this.popupElement.style.border = '1px solid #ccc';
    this.popupElement.style.padding = '5px';
    // Добавьте здесь другие стили для попапа

    document.body.appendChild(this.popupElement);

    // Добавление обработчика событий выделения текста
    core.appElement.addEventListener('mouseup', (event) => this.handleTextSelection(event, core));
  }

  private handleTextSelection(event: MouseEvent, core: EditorCore): void {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      // Выделенный текст существует
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      this.showPopup(rect);
    } else {
      // Текст не выделен
      this.hidePopup();
    }
  }

  showPopup(rect: DOMRect): void {
    if (this.popupElement) {
      this.popupElement.style.display = 'block';
      this.popupElement.style.left = `${rect.left + window.scrollX}px`;
      this.popupElement.style.top = `${rect.bottom + window.scrollY}px`;
      // Добавьте здесь контент для попапа, например кнопки или другие элементы
    }
  }

  hidePopup(): void {
    if (this.popupElement) {
      this.popupElement.style.display = 'none';
    }
  }

  getPopupElement(): HTMLDivElement|null {
    return this.popupElement;
  }
}

export default SelectionPopupPlugin;
