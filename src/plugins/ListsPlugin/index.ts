import './style.scss';
import './public.scss';

import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
// import { ListsMenu } from './components/ListsMenu';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { listBulletIcon, listNumberedIcon } from '../../icons';
import { createP } from '../../utils/helpers.ts';

export class ListsPlugin implements Plugin {
  name = 'lists';
  private editor: HTMLEditor | null = null;
  private ulButton: HTMLElement | null = null;
  private olButton: HTMLElement | null = null;
  // private menu: ListsMenu;

  constructor() {
    // this.menu = new ListsMenu();
  }

  initialize(editor: HTMLEditor): void {
    this.editor = editor;
    this.addToolbarButtons();
    this.setupListHandling();
    this.editor.on('lists', () => {
      this.editor?.ensureEditorFocus();
      this.toggleList('unordered');
    });
  }

  private addToolbarButtons(): void {
    const toolbar = document.querySelector('.editor-toolbar');
    if (!toolbar) return;

    // Unordered list button
    this.ulButton = createToolbarButton({
      icon: listBulletIcon,
      title: this.editor?.t('Bullet List'),
      onClick: () => {
        this.editor?.ensureEditorFocus();
        this.toggleList('unordered');
        this.handleSelectionChange();
      },
    });

    // Ordered list button
    this.olButton = createToolbarButton({
      icon: listNumberedIcon,
      title: this.editor?.t('Numbered List'),
      onClick: () => {
        this.editor?.ensureEditorFocus();
        this.toggleList('ordered');
        this.handleSelectionChange();
      },
    });

    toolbar.appendChild(this.ulButton);
    toolbar.appendChild(this.olButton);

    document.addEventListener('selectionchange', this.handleSelectionChange.bind(this));
  }

  private handleSelectionChange(): void {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;

    // Проверяем, находится ли выделение внутри списка
    const closestList = (
      container.nodeType === Node.ELEMENT_NODE
        ? (container as HTMLElement).closest('ul, ol')
        : container.parentElement?.closest('ul, ol')
    ) as HTMLUListElement | HTMLOListElement | null;

    if (closestList) {
      // Если выделение внутри списка, обновляем стиль кнопки
      if (closestList.tagName === 'UL') {
        this.ulButton?.classList.add('active');
        this.olButton?.classList.remove('active');
      } else if (closestList.tagName === 'OL') {
        this.olButton?.classList.add('active');
        this.ulButton?.classList.remove('active');
      }
    } else {
      // Если выделение не внутри списка, снимаем активный стиль с кнопок
      this.ulButton?.classList.remove('active');
      this.olButton?.classList.remove('active');
    }
  }

  private setupListHandling(): void {
    if (!this.editor) return;

    this.editor.getContainer().addEventListener('keydown', this.handleKeydown);
  }

  private handleKeydown = (e: KeyboardEvent): void => {
    // Handle Cmd+Enter (Mac) or Ctrl+Enter (Windows)
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      this.exitListAndInsertBreak();
    }
  };

  private exitListAndInsertBreak(): void {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const listItem = range.commonAncestorContainer.parentElement?.closest('li');

    if (listItem) {
      // Get the list that contains this item
      const list = listItem.parentElement;
      if (!list) return;

      // Create a new paragraph
      const newParagraph = createP('my-4');

      // Insert it after the list
      if (list.nextSibling) {
        list.parentNode?.insertBefore(newParagraph, list.nextSibling);
      } else {
        list.parentNode?.appendChild(newParagraph);
      }

      // Move cursor to the new paragraph
      range.selectNodeContents(newParagraph);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  private toggleList(type: 'ordered' | 'unordered'): void {
    if (!this.editor) return;

    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;

    // Проверяем, находится ли выделение внутри списка
    const closestList = (
      container.nodeType === Node.ELEMENT_NODE
        ? (container as HTMLElement).closest('ul, ol')
        : container.parentElement?.closest('ul, ol')
    ) as HTMLUListElement | HTMLOListElement | null;

    if (closestList) {
      // Если выделение уже внутри списка
      if (
        (type === 'ordered' && closestList.tagName === 'OL') ||
        (type === 'unordered' && closestList.tagName === 'UL')
      ) {
        // Если выбран тот же тип списка, отменяем его
        this.unwrapList(closestList);
      } else {
        // Если выбран другой тип списка, заменяем его
        this.replaceList(closestList, type);
      }
    } else {
      // Если выделение не внутри списка, создаем новый список
      this.createNewList(range, type);
    }
  }

  private unwrapList(list: HTMLUListElement | HTMLOListElement): void {
    const items = Array.from(list.querySelectorAll('li'));

    // Создаем новый контейнер для объединенного содержимого
    const container = document.createElement('div');

    items.forEach((item, index) => {
      // Добавляем содержимое элемента списка
      container.appendChild(document.createTextNode(item.textContent || ''));

      // Добавляем <br>, если это не последний элемент
      if (index < items.length - 1) {
        container.appendChild(document.createElement('br'));
      }
    });

    // Заменяем список на новый контейнер
    list.parentNode?.replaceChild(container, list);

    // Восстанавливаем выделение
    const newRange = document.createRange();
    newRange.selectNodeContents(container);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(newRange);
  }

  private replaceList(
    list: HTMLUListElement | HTMLOListElement,
    newType: 'ordered' | 'unordered'
  ): void {
    const newListTag = newType === 'ordered' ? 'ol' : 'ul';
    const newList = document.createElement(newListTag);

    Array.from(list.children).forEach((item) => {
      const newItem = document.createElement('li');
      newItem.innerHTML = item.innerHTML;
      newList.appendChild(newItem);
    });

    list.parentNode?.replaceChild(newList, list);
    this.applyListStyles(newList, newType);
  }

  private createNewList(range: Range, type: 'ordered' | 'unordered'): void {
    const fragment = range.extractContents();
    const listTag = type === 'ordered' ? 'ol' : 'ul';
    const list = document.createElement(listTag);

    Array.from(fragment.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        // Разбиваем текстовый узел на строки и фильтруем пустые
        const lines = node.textContent?.split('\n').filter((line) => line.trim() !== '') || [];
        lines.forEach((line) => {
          const listItem = document.createElement('li');
          listItem.textContent = line.trim(); // Убираем лишние пробелы
          list.appendChild(listItem);
        });
      } else if (node.nodeName === 'BR') {
        // Пропускаем пустые <br>, если они не содержат текста
        // Не добавляем пустые элементы списка
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Обрабатываем другие элементы (например, <span>)
        if (node.textContent?.trim() !== '') {
          const listItem = document.createElement('li');
          listItem.appendChild(node.cloneNode(true)); // Копируем содержимое элемента
          list.appendChild(listItem);
        }
      }
    });

    // Если список пуст, добавляем один элемент с placeholder
    if (list.children.length === 0) {
      const listItem = document.createElement('li');
      listItem.textContent = 'List item'; // Placeholder
      list.appendChild(listItem);
    }

    range.insertNode(list);
    this.applyListStyles(list, type);

    const newRange = document.createRange();
    newRange.selectNodeContents(list.lastElementChild || list);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(newRange);
  }

  private applyListStyles(
    list: HTMLOListElement | HTMLUListElement,
    type: 'ordered' | 'unordered'
  ): void {
    if (type === 'ordered') {
      list.className = 'list-decimal pl-8 my-4 space-y-2';
    } else {
      list.className = 'list-disc pl-8 my-4 space-y-2';
    }

    list.querySelectorAll('li').forEach((li) => {
      li.className = 'pl-2';
    });
  }

  public destroy(): void {
    if (this.editor) {
      this.editor.getContainer().removeEventListener('keydown', this.handleKeydown);
    }

    if (this.ulButton && this.ulButton.parentElement) {
      this.ulButton.parentElement.removeChild(this.ulButton);
    }
    if (this.olButton && this.olButton.parentElement) {
      this.olButton.parentElement.removeChild(this.olButton);
    }

    document.removeEventListener('selectionchange', this.handleSelectionChange.bind(this));

    this.editor?.off('lists');

    this.editor = null;
    this.ulButton = null;
    this.olButton = null;
  }
}
