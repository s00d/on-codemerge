import { minus } from "../../../src/icons";
import type { IEditorModule, Observer, EditorCoreInterface } from "../../../src/types";

export class HorizontalLineButton implements IEditorModule, Observer {
  private core: EditorCoreInterface | null = null;
  private button: HTMLDivElement | null = null;
  initialize(core: EditorCoreInterface): void {
    this.core = core;
    this.button = core.toolbar.addButtonIcon('Line', minus, this.insertHorizontalLine.bind(this))

    core.i18n.addObserver(this);
  }

  update(): void {
    if(this.button) this.button.title = this.core!.i18n.translate('Line');
  }

  private insertHorizontalLine(): void {
    if (!this.core) return;

    const hr = document.createElement('hr');
    const breakElement = document.createElement('p'); // Используем параграф для переноса
    breakElement.innerHTML = '&nbsp;'; // Добавляем неразрывный пробел для обеспечения видимости параграфа

    // Создаем фрагмент для вставки
    const fragment = document.createDocumentFragment();
    fragment.appendChild(hr);
    fragment.appendChild(breakElement);
    this.core.insertHTMLIntoEditor(fragment);
  }

  destroy(): void {
    // You can perform any necessary cleanup here
    this.core = null;
    this.button?.removeEventListener('click', this.insertHorizontalLine)
    this.button = null;
  }
}

export default HorizontalLineButton;
