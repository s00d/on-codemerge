import type { EditorCore } from "@/index";

export class Toolbar {
  private toolbarElement: HTMLDivElement|null = null;

  constructor(core: EditorCore) {
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

  addButton(title: string, action: () => void) {
    const button = document.createElement('div');
    button.classList.add('on-codemerge-button');
    button.textContent = title;
    button.addEventListener('click', action);

    this.toolbarElement?.appendChild(button);
    return button;
  }

  addHtmlItem(item: HTMLElement): void {
    this.toolbarElement?.appendChild(item);
  }

  addButtonIcon(title: string, icon: string, action: () => void) {
    const button = document.createElement('div');
    button.classList.add('on-codemerge-button');
    button.innerHTML = icon;
    button.title = title;
    button.addEventListener('click', action);

    this.toolbarElement?.appendChild(button);
    return button;
  }

  private applyStyles(): void {
    if (this.toolbarElement) {
      this.toolbarElement.style.borderBottom = '1px solid #ccc';
      this.toolbarElement.style.backgroundColor = '#f9f9f9';
      this.toolbarElement.style.display = 'flex';
      this.toolbarElement.style.alignItems = 'center';
      // Другие стили...
    }
  }
}

export default Toolbar;
