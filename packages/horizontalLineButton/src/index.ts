import { EditorCore, IEditorModule } from "@/index";

export class HorizontalLineButton implements IEditorModule {
  private core: EditorCore | null = null;
  initialize(core: EditorCore): void {
    this.core = core;
    core.toolbar.addButton('Line', () => this.insertHorizontalLine())
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
}

export default HorizontalLineButton;
