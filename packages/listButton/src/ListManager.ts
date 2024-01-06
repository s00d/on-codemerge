import { EditorCore } from "@/index";

export default class ListManager {
  private listElement: HTMLUListElement | HTMLOListElement;
  private core: EditorCore;

  constructor(listElement: HTMLUListElement | HTMLOListElement, core: EditorCore) {
    this.listElement = listElement;
    this.core = core;
    this.initializeList();
  }

  private initializeList(): void {
    this.listElement.addEventListener('keydown', this.handleKeyDown);
    this.listElement.addEventListener('contextmenu', this.handleContextMenu);
  }

  private handleKeyDown = (event: Event): void => {
    const keyboardEvent = event as KeyboardEvent;
    const target = event.target as HTMLLIElement;
    if (keyboardEvent.key === 'Enter') {
      event.preventDefault();
      if (target.textContent?.trim()) {
        const newLi = document.createElement('li');
        newLi.contentEditable = 'true';
        target.parentNode?.insertBefore(newLi, target.nextSibling);
        newLi.focus();
      } else if (target.previousSibling || target.nextSibling) {
        target.remove();
      }
    }
  };

  private handleContextMenu = (event: Event): void => {
    event.preventDefault();

    const mouseEvent = event as MouseEvent;

    const contextMenu = document.createElement('div');
    contextMenu.style.position = 'absolute';
    contextMenu.style.left = `${mouseEvent.clientX}px`;
    contextMenu.style.top = `${mouseEvent.clientY}px`;
    contextMenu.style.background = 'white';
    contextMenu.style.border = '1px solid #ccc';
    contextMenu.style.padding = '5px';

    const ulOption = document.createElement('button');
    ulOption.textContent = 'Bulleted list';
    ulOption.addEventListener('click', () => this.changeListType('ul'));

    const olOption = document.createElement('button');
    olOption.textContent = 'Numbered list';
    olOption.addEventListener('click', () => this.changeListType('ol'));

    contextMenu.appendChild(ulOption);
    contextMenu.appendChild(olOption);

    document.body.appendChild(contextMenu);

    // Добавляем обработчик для закрытия контекстного меню при клике в любом месте
    const closeContextMenu = () => {
      document.body.removeChild(contextMenu);
      document.body.removeEventListener('click', closeContextMenu);
    };

    document.body.addEventListener('click', closeContextMenu);
  };

  private changeListType(type: 'ul' | 'ol'): void {
    const newList = document.createElement(type);
    while (this.listElement.firstChild) {
      newList.appendChild(this.listElement.firstChild);
    }

    this.listElement.parentNode?.replaceChild(newList, this.listElement);
    this.listElement = newList as HTMLUListElement | HTMLOListElement;
    this.initializeList();
  }
}
