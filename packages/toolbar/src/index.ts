import { EditorCore, IEditorModule } from "../../../src";

export class ToolbarPlugin implements IEditorModule {
  private toolbarElement: HTMLDivElement|null = null;

  initialize(core: EditorCore): void {
    // Создание панели инструментов
    this.toolbarElement = document.createElement('div');
    this.toolbarElement.className = 'editor-toolbar';

    this.applyStyles()

    // Добавление панели инструментов в DOM
    core.appElement.appendChild(this.toolbarElement);
  }

  // Доступ к элементу панели инструментов для других плагинов
  getToolbarElement(): HTMLDivElement|null {
    return this.toolbarElement;
  }

  private applyStyles(): void {
    if (this.toolbarElement) {
      this.toolbarElement.style.padding = '10px';
      this.toolbarElement.style.borderBottom = '1px solid #ccc';
      this.toolbarElement.style.backgroundColor = '#f9f9f9';
      this.toolbarElement.style.display = 'flex';
      this.toolbarElement.style.alignItems = 'center';
      // Другие стили...
    }
  }
}

export default ToolbarPlugin;
