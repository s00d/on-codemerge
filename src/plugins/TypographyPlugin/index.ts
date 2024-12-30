import './style.scss';
import './public.scss';

import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
import { TypographyMenu } from './components/TypographyMenu';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { typographyIcon } from '../../icons';

export class TypographyPlugin implements Plugin {
  name = 'typography';
  private editor: HTMLEditor | null = null;
  private menu: TypographyMenu | null = null;
  private toolbarButton: HTMLElement | null = null;

  constructor() {}

  initialize(editor: HTMLEditor): void {
    this.menu = new TypographyMenu(editor);
    this.editor = editor;
    this.addToolbarButton();
    this.setupEventListeners();

    document.addEventListener('keydown', this.handleKeyDown);
    this.editor.on('typography', () => {
      this.editor?.ensureEditorFocus();
      this.showMenu();
    });
  }

  private addToolbarButton(): void {
    const toolbar = document.querySelector('.editor-toolbar');
    if (!toolbar) return;

    this.toolbarButton = createToolbarButton({
      icon: typographyIcon,
      title: this.editor?.t('Typography'),
      onClick: () => this.showMenu(),
    });
    toolbar.appendChild(this.toolbarButton);
  }

  private setupEventListeners(): void {
    if (!this.editor) return;

    // Добавляем обработчик события click
    this.editor.getContainer().addEventListener('click', this.handleClick);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.ctrlKey && e.key === 't') {
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

    const selection = window.getSelection();
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
        document.execCommand('formatBlock', false, style);
        break;
      case 'paragraph':
        document.execCommand('formatBlock', false, 'p');
        break;
      case 'blockquote':
        document.execCommand('formatBlock', false, 'blockquote');
        break;
      case 'pre':
        document.execCommand('formatBlock', false, 'pre');
        break;
      case 'hr':
        const hrElement = document.createElement('hr');
        hrElement.className = 'my-4 border-t border-gray-300';
        range.deleteContents();
        range.insertNode(hrElement);
        range.setStartAfter(hrElement);
        range.setEndAfter(hrElement);
        selection.removeAllRanges();
        selection.addRange(range);
        break;
      case 'clear':
        document.execCommand('removeFormat', false);
        document.execCommand('formatBlock', false, 'p');
        break;
    }
  }

  public destroy(): void {
    // Удаляем обработчик события click
    if (this.editor) {
      this.editor.getContainer().removeEventListener('click', this.handleClick);
    }

    // Удаляем обработчик события keydown
    document.removeEventListener('keydown', this.handleKeyDown);

    // Удаляем кнопку из панели инструментов
    if (this.toolbarButton && this.toolbarButton.parentElement) {
      this.toolbarButton.parentElement.removeChild(this.toolbarButton);
    }

    // Уничтожаем меню
    if (this.menu) {
      this.menu.destroy(); // Предполагается, что у TypographyMenu есть метод destroy
    }

    // Очищаем ссылки
    this.editor = null;
    this.menu = null;
    this.toolbarButton = null;
  }
}
