import type { EditorCore, IEditorModule } from "@/index";
import feather from "feather-icons";

export class HorizontalLineButton implements IEditorModule {
  private core: EditorCore | null = null;
  initialize(core: EditorCore): void {
    this.core = core;
    const icon = feather.icons.minus.toSvg({  width: '16px', height: '16px', class: 'on-codemerge-icon', 'stroke-width': 3 });
    core.toolbar.addButtonIcon('Line', icon, () => this.insertHorizontalLine())
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
