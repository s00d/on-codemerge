import './style.scss';
import './public.scss';

import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
// import { ListsMenu } from './components/ListsMenu';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { listBulletIcon, listNumberedIcon } from '../../icons';

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
      },
    });

    // Ordered list button
    this.olButton = createToolbarButton({
      icon: listNumberedIcon,
      title: this.editor?.t('Numbered List'),
      onClick: () => {
        this.editor?.ensureEditorFocus();
        this.toggleList('ordered');
      },
    });

    toolbar.appendChild(this.ulButton);
    toolbar.appendChild(this.olButton);
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
      const newParagraph = document.createElement('p');
      newParagraph.className = 'my-4';

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

    const command = type === 'ordered' ? 'insertOrderedList' : 'insertUnorderedList';
    document.execCommand(command, false);

    // Apply proper styling to the list
    const selection = window.getSelection();
    if (!selection) return;

    const list = selection.anchorNode?.parentElement?.closest('ul, ol');
    if (list) {
      if (type === 'ordered') {
        list.className = 'list-decimal pl-8 my-4 space-y-2';
      } else {
        list.className = 'list-disc pl-8 my-4 space-y-2';
      }

      // Style list items
      list.querySelectorAll('li').forEach((li) => {
        li.className = 'pl-2';
      });
    }
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

    this.editor?.off('lists');

    this.editor = null;
    this.ulButton = null;
    this.olButton = null;
  }
}
