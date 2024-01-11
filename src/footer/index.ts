import type { EditorCoreInterface } from "../types";

export class Footer {
  private element: HTMLDivElement|null = null;
  private core: EditorCoreInterface;
  private enabled = false;

  constructor(core: EditorCoreInterface) {
    this.core = core;
    // Создание панели инструментов
    this.element = document.createElement('div');
    this.element.className = 'editor-toolbar';

    this.applyStyles()

    // Добавление панели инструментов в DOM
    core.appElement.appendChild(this.element);
  }

  // Доступ к элементу панели инструментов для других плагинов
  getElement(): HTMLDivElement|null {
    return this.element;
  }

  enable() {
    if(!this.enabled) return;
    if(this.element) this.core.appElement.appendChild(this.element);
    this.enabled = true;
  }

  addHtmlItem(item: HTMLElement): void {
    this.enable();
    this.element?.appendChild(item);
  }

  addButtonIcon(title: string, icon: string, action: () => void) {
    this.enable();
    const button = document.createElement('div');
    button.classList.add('on-codemerge-button');
    button.innerHTML = icon;
    button.title = title;
    button.addEventListener('click', action);

    this.element?.appendChild(button);
    return button;
  }

  private applyStyles(): void {
    if (this.element) {
      this.element.style.borderBottom = '1px solid #ccc';
      this.element.style.backgroundColor = '#f9f9f9';
      this.element.style.display = 'flex';
      this.element.style.alignItems = 'center';
      this.element.style.overflow = 'scroll';
      this.element.style.padding = '2px 10px';
      // Другие стили...
    }
  }

  destroy(): void {
    // Удаление панели инструментов из DOM
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }

    // Очистка ссылок для предотвращения утечек памяти
    this.element = null;
  }
}

export default Footer;
