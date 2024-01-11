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
      this.toolbarElement.style.overflow = 'scroll';
      // Другие стили...
    }
  }

  destroy(): void {
    // Удаление панели инструментов из DOM
    if (this.toolbarElement && this.toolbarElement.parentNode) {
      this.toolbarElement.parentNode.removeChild(this.toolbarElement);
    }

    // Очистка ссылок для предотвращения утечек памяти
    this.toolbarElement = null;
  }
}

export default Toolbar;
