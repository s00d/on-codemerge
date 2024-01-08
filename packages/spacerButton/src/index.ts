import type { EditorCore, IEditorModule } from "@/index";

export class SpacerButton implements IEditorModule {
  initialize(core: EditorCore): void {
    const toolbar = core.toolbar.getToolbarElement();

    // Создаем элемент-разделитель
    const spacer = document.createElement('div');
    spacer.style.display = 'inline-block';
    spacer.style.margin = '0 5px'; // Устанавливаем ширину пробела
    spacer.style.height = '20px'; // Устанавливаем ширину пробела
    spacer.style.border = '1px solid gray'; // Устанавливаем ширину пробела

    // Добавляем разделитель на панель инструментов
    if (toolbar) toolbar.appendChild(spacer);
  }
}

export default SpacerButton;
