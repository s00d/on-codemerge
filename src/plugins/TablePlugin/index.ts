import './style.scss';
import './public.scss';

import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
import { TablePopup } from './components/TablePopup';
import { TableContextMenu } from './components/TableContextMenu';
import { TableSelection } from './services/TableSelection';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { tableIcon } from '../../icons';
import { InsertTableCommand } from './commands/InsertTableCommand.ts';
import { Resizer } from '../../utils/Resizer.ts';

export class TablePlugin implements Plugin {
  name = 'table';
  private editor: HTMLEditor | null = null;
  private popup: TablePopup | null = null;
  private contextMenu: TableContextMenu | null = null;
  private selection: TableSelection;
  private currentResizer: Resizer | null = null;

  constructor() {
    this.selection = new TableSelection();
  }

  initialize(editor: HTMLEditor): void {
    this.popup = new TablePopup(editor);
    this.editor = editor;
    this.contextMenu = new TableContextMenu(editor);
    this.addToolbarButton();
    this.setupTableEvents();
    this.editor.on('table', () => {
      this.selection.saveSelection();
      this.popup?.show((options) => this.insertTable(options));
    });
  }

  private addToolbarButton(): void {
    const toolbar = document.querySelector('.editor-toolbar');
    if (toolbar) {
      const button = createToolbarButton({
        icon: tableIcon,
        title: this.editor?.t('Insert Table'),
        onClick: () => {
          this.selection.saveSelection();
          this.popup?.show((options) => this.insertTable(options));
        },
      });
      toolbar.appendChild(button);
    }
  }

  private setupTableEvents(): void {
    if (!this.editor || !this.contextMenu) return;

    const container = this.editor.getContainer();
    container.addEventListener('contextmenu', this.handleContextMenu);
    container.addEventListener('click', this.handleClick);
    container.addEventListener('keydown', this.handleKeydown);
  }

  private handleContextMenu = (e: Event): void => {
    const cell = (e.target as Element).closest('td, th');
    if (cell instanceof HTMLTableCellElement) {
      e.preventDefault();
      this.contextMenu?.show(cell, (e as MouseEvent).clientX, (e as MouseEvent).clientY);
    }
  };

  private handleClick = (e: Event): void => {
    const table = (e.target as Element).closest('table');
    if (table instanceof HTMLTableElement) {
      e.preventDefault();
      this.selection.saveTable(table);
    }

    const cell = (e.target as Element).closest('td, th') as HTMLTableCellElement | null;
    if (!cell) return;

    if (cell instanceof HTMLTableCellElement) {
      e.preventDefault();
      this.selection.selectCell(cell);

      if (this.currentResizer) {
        this.currentResizer.destroy();
        this.currentResizer = null;
      }

      this.currentResizer = new Resizer(cell, {
        handleSize: 10,
        handleColor: 'blue',
        onResizeStart: () => console.log('Resize started'),
        onResize: (width, height) => console.log(`Resized to ${width}x${height}`),
        onResizeEnd: () => console.log('Resize ended'),
      });
    }
  };

  private handleKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const table = this.selection.restoreTable();
      if (table) {
        table.remove();
        this.selection.clearTable();
      }
    }
  };

  private insertTable(options: { rows: number; cols: number; hasHeader: boolean }): void {
    if (!this.editor) return;

    this.editor.ensureEditorFocus();

    let range = this.selection.restoreSelection();
    if (!range) {
      range = document.createRange();
      range.selectNodeContents(this.editor.getContainer());
      range.collapse(false);
    }

    const command = new InsertTableCommand(this.editor, options, range);
    command.execute();
  }

  destroy(): void {
    // Удаляем обработчики событий
    if (this.editor) {
      const container = this.editor.getContainer();
      container.removeEventListener('contextmenu', this.handleContextMenu);
      container.removeEventListener('click', this.handleClick);
      container.removeEventListener('keydown', this.handleKeydown);
    }

    // Уничтожаем всплывающее окно
    if (this.popup) {
      this.popup.destroy();
      this.popup = null;
    }

    // Уничтожаем контекстное меню
    if (this.contextMenu) {
      this.contextMenu.destroy();
      this.contextMenu = null;
    }

    // Уничтожаем текущий ресайзер
    if (this.currentResizer) {
      this.currentResizer.destroy();
      this.currentResizer = null;
    }

    // Очищаем ссылки
    this.editor = null;
    this.selection.clearTable();
  }
}