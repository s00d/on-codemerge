import type { IEditorModule, Observer, EditorCoreInterface } from "../../../src/types";

export class SpacerButton implements IEditorModule, Observer {
  private core: EditorCoreInterface|null = null;
  initialize(core: EditorCoreInterface): void {
    this.core = core;
    const toolbar = core.toolbar.getToolbarElement();

    // Создаем элемент-разделитель
    const spacer = document.createElement('div');
    spacer.style.display = 'inline-block';
    spacer.style.margin = '0 5px'; // Устанавливаем ширину пробела
    spacer.style.height = '20px'; // Устанавливаем ширину пробела
    spacer.style.border = '1px solid gray'; // Устанавливаем ширину пробела

    // Добавляем разделитель на панель инструментов
    if (toolbar) toolbar.appendChild(spacer);

    core.i18n.addObserver(this);
  }

  update(): void {

  }

  destroy(): void {

  }
}

export default SpacerButton;
