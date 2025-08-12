import './style.scss';
import './public.scss';

import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
import { TypographyMenu } from './components/TypographyMenu';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { typographyIcon } from '../../icons';
import { createHr } from '../../utils/helpers.ts';

export class TypographyPlugin implements Plugin {
  name = 'typography';
  hotkeys = [
    {
      keys: 'Ctrl+Shift+W',
      description: 'Adjust typography settings',
      command: 'typography-settings',
      icon: '✒️',
    },
  ];
  private editor: HTMLEditor | null = null;
  private menu: TypographyMenu | null = null;
  private toolbarButton: HTMLElement | null = null;
  private boundKeyDown?: (e: Event) => void;

  constructor() {}

  initialize(editor: HTMLEditor): void {
    this.editor = editor;
    this.menu = new TypographyMenu(editor);
    this.addToolbarButton();
    this.setupEventListeners();
    this.setupKeyboardEvents();

    this.boundKeyDown = (e: Event) => this.handleKeyDown(e);
    document.addEventListener('keydown', this.boundKeyDown);
    this.editor.on('typography', () => {
      this.editor?.ensureEditorFocus();
      this.showMenu();
    });
  }

  private addToolbarButton(): void {
    const toolbar = this.editor?.getToolbar();
    if (toolbar) {
      this.toolbarButton = createToolbarButton({
        icon: typographyIcon,
        title: this.editor?.t('Typography') || 'Typography',
        onClick: () => this.showMenu(),
      });
      toolbar.appendChild(this.toolbarButton);
    }
  }

  private setupEventListeners(): void {
    if (this.editor) {
      this.editor.getContainer().addEventListener('click', this.handleClick);
    }
  }

  private setupKeyboardEvents(): void {
    if (!this.editor) return;

    this.boundKeyDown = (e: Event) => {
      if ((e as KeyboardEvent).key === 'Tab') {
        e.preventDefault();
        this.insertTab();
      }
    };

    this.editor.getDOMContext().addEventListener('keydown', this.boundKeyDown);
  }

  private insertTab(): void {
    if (!this.editor) return;

    const selection = this.editor.getTextFormatter()?.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const tabNode = document.createTextNode('\t');
    range.deleteContents();
    range.insertNode(tabNode);
    range.setStartAfter(tabNode);
    range.setEndAfter(tabNode);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  private handleKeyDown(e: Event): void {
    if ((e as KeyboardEvent).ctrlKey && (e as KeyboardEvent).key === 't') {
      e.preventDefault();
      this.showMenu();
    }
  }

  private handleClick(): void {
    this.editor?.getContainer().focus();
  }

  private showMenu(): void {
    if (!this.editor) return;
    this.editor.getContainer().focus();
    this.menu?.show((style) => this.applyStyle(style));
  }

  private applyStyle(style: string): void {
    if (!this.editor) return;

    const selection = this.editor.getTextFormatter()?.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer.parentElement;
    if (!container) return;

    switch (style) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        this.editor?.getTextFormatter()?.applyBlock(style);
        break;
      case 'paragraph':
        this.editor?.getTextFormatter()?.applyBlock('p');
        break;
      case 'blockquote':
        this.editor?.getTextFormatter()?.applyBlock('blockquote');
        break;
      case 'pre':
        this.editor?.getTextFormatter()?.applyBlock('pre');
        break;
      case 'hr':
        const hrElement = createHr('my-4 border-t border-gray-300');
        range.deleteContents();
        range.insertNode(hrElement);
        range.setStartAfter(hrElement);
        range.setEndAfter(hrElement);
        selection.removeAllRanges();
        selection.addRange(range);
        break;
      case 'clear':
        this.editor?.getTextFormatter()?.clearBlock();
        break;
    }
  }

  public destroy(): void {
    if (this.editor) {
      this.editor.getContainer().removeEventListener('click', this.handleClick);
    }

    if (this.boundKeyDown) {
      this.editor?.getDOMContext().removeEventListener('keydown', this.boundKeyDown);
      this.boundKeyDown = undefined;
    }

    if (this.toolbarButton && this.toolbarButton.parentElement) {
      this.toolbarButton.parentElement.removeChild(this.toolbarButton);
    }

    this.menu?.destroy();

    this.editor?.off('typography');

    // Очищаем ссылки
    this.editor = null;
    this.menu = null;
    this.toolbarButton = null;
  }
}
