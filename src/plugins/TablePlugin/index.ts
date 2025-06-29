import './style.scss';
import './public.scss';

import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
import { TablePopup } from './components/TablePopup';
import { TableContextMenu } from './components/TableContextMenu';
import { TableEditor } from './components/TableEditor';
import { CellFormatter } from './components/CellFormatter';
import { TableExportService } from './services/TableExportService';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import { tableIcon } from '../../icons';
import { Resizer } from '../../utils/Resizer.ts';
import { ExportTableCommand } from './commands/ExportTableCommand';
import { ImportTableCommand } from './commands/ImportTableCommand';
import { FormatCellCommand } from './commands/FormatCellCommand';
import { ShowTablePropertiesCommand } from './commands/ShowTablePropertiesCommand';
import { SortTableCommand } from './commands/SortTableCommand';
import { ResizeColumnsCommand } from './commands/ResizeColumnsCommand';
import { DeleteCellContentCommand } from './commands/DeleteCellContentCommand';
import { CopyCellCommand } from './commands/CopyCellCommand';
import { PasteCellCommand } from './commands/PasteCellCommand';
import { CutCellCommand } from './commands/CutCellCommand';
import { SelectAllCommand } from './commands/SelectAllCommand';
import { LazyTableModal } from './components/LazyTableModal';
import { EditLazyTableCommand } from './commands/EditLazyTableCommand';

// Экспортируем новые команды для использования в других частях приложения
export { EditLazyTableCommand } from './commands/EditLazyTableCommand';
export { ImportTableFromHTMLCommand } from './commands/ImportTableFromHTMLCommand';
export { LazyTableModal } from './components/LazyTableModal';

export class TablePlugin implements Plugin {
  name = 'table';
  hotkeys = [
    { keys: 'Ctrl+Shift+T', description: 'Insert table', command: 'insert-table', icon: '📊' },
    { keys: 'Ctrl+Shift+J', description: 'Insert lazy table', command: 'insert-lazy-table', icon: '📊⏳' },
    { keys: 'Ctrl+L', description: 'Edit lazy table', command: 'edit-lazy-table', icon: '🔄' },
    { keys: 'Ctrl+Shift+Z', description: 'Import from HTML', command: 'import-from-html', icon: '🌐' },
    { keys: 'Ctrl+Shift+E', description: 'Export table', command: 'export-table', icon: '📤' },
    { keys: 'Ctrl+Shift+I', description: 'Import table', command: 'import-table', icon: '📥' },
    { keys: 'Alt+Shift+F', description: 'Format cells', command: 'format-cells', icon: '🎨' },
    {
      keys: 'Ctrl+Shift+P',
      description: 'Table properties',
      command: 'table-properties',
      icon: '⚙️',
    },
    { keys: 'Alt+Shift+S', description: 'Sort table', command: 'sort-table', icon: '📈' },
    { keys: 'Ctrl+Shift+R', description: 'Resize columns', command: 'resize-columns', icon: '📏' },
    {
      keys: 'Delete',
      description: 'Delete selected cells',
      command: 'delete-selected-cells',
      icon: '🗑️',
    },
    {
      keys: 'Backspace',
      description: 'Delete selected cells',
      command: 'delete-selected-cells',
      icon: '🗑️',
    },
    {
      keys: 'Alt+Shift+C',
      description: 'Copy selected cells',
      command: 'copy-selected-cells',
      icon: '📋',
    },
    { keys: 'Ctrl+Shift+V', description: 'Paste cells', command: 'paste-cells', icon: '📋' },
    {
      keys: 'Ctrl+Shift+X',
      description: 'Cut selected cells',
      command: 'cut-selected-cells',
      icon: '✂️',
    },
    {
      keys: 'Ctrl+Shift+A',
      description: 'Select all cells',
      command: 'select-all-cells',
      icon: '☑️',
    },
  ];
  private editor: HTMLEditor | null = null;
  private popup: TablePopup | null = null;
  private contextMenu: TableContextMenu | null = null;
  private tableEditor: TableEditor | null = null;
  private cellFormatter: CellFormatter | null = null;
  private exportService: TableExportService | null = null;
  private currentResizer: Resizer | null = null;
  private selectedCells: HTMLElement[] = [];

  constructor() {}

  initialize(editor: HTMLEditor): void {
    this.editor = editor;
    this.popup = new TablePopup(editor);
    this.contextMenu = new TableContextMenu(editor);
    this.tableEditor = new TableEditor(editor);
    this.cellFormatter = new CellFormatter(editor);
    this.exportService = new TableExportService();

    this.addToolbarButton();
    this.setupTableEvents();
    this.setupKeyboardShortcuts();

    this.editor.on('table', () => {
      this.editor?.getSelector()?.saveSelection();
      this.popup?.show((options) => this.insertTable(options));
    });
  }

  private addToolbarButton(): void {
    const toolbar = this.editor?.getToolbar();
    if (toolbar) {
      const button = createToolbarButton({
        icon: tableIcon,
        title: this.editor?.t('Insert Table'),
        onClick: () => {
          this.editor?.getSelector()?.saveSelection();
          this.popup?.show((options) => this.insertTable(options));
        },
      });
      toolbar.appendChild(button);
    }
  }

  private setupTableEvents(): void {
    if (!this.editor) return;

    const container = this.editor.getContainer();
    if (!container) return;

    container.addEventListener('click', this.handleClick);
    container.addEventListener('contextmenu', this.handleContextMenu);
    container.addEventListener('keydown', this.handleKeydown);
    container.addEventListener('mousedown', this.handleMouseDown);
    container.addEventListener('mouseover', this.handleMouseOver);
    container.addEventListener('mouseout', this.handleMouseOut);
  }

  private setupKeyboardShortcuts(): void {
    if (!this.editor) return;

    this.editor.on('insert-table', () => {
      this.popup?.show((options) => this.insertTable(options));
    });

    this.editor.on('insert-lazy-table', () => {
      this.editor?.getSelector()?.saveSelection();
      const range = this.editor?.getSelector()?.getSelection();
      if (range) {
        new LazyTableModal(this.editor!, range).show();
      }
    });

    this.editor.on('edit-lazy-table', () => {
      const table = this.editor?.getSelector()?.restoreTable();
      if (table && this.editor && table.classList.contains('lazy-table')) {
        const command = new EditLazyTableCommand(this.editor, table);
        command.execute();
      }
    });

    this.editor.on('import-from-html', () => {
      this.editor?.getSelector()?.saveSelection();
      const range = this.editor?.getSelector()?.getSelection();
      if (range) {
        const modal = new LazyTableModal(this.editor!, range);
        modal.show();
      }
    });

    this.editor.on('export-table', () => {
      const table = this.editor?.getSelector()?.restoreTable();
      if (table && this.editor) {
        const command = new ExportTableCommand(this.editor, table);
        command.execute();
      }
    });

    this.editor.on('import-table', () => {
      if (this.editor) {
        const command = new ImportTableCommand(this.editor);
        command.execute();
      }
    });

    this.editor.on('format-cells', () => {
      const table = this.editor?.getSelector()?.restoreTable();
      if (table && this.editor) {
        const selectedCells = table.querySelectorAll(
          '.table-cell.selected, .table-header-cell.selected'
        );
        if (selectedCells.length > 0) {
          const command = new FormatCellCommand(this.editor, selectedCells[0] as HTMLElement);
          command.execute();
        }
      }
    });

    this.editor.on('table-properties', () => {
      const table = this.editor?.getSelector()?.restoreTable();
      if (table && this.editor) {
        const command = new ShowTablePropertiesCommand(this.editor, table);
        command.execute();
      }
    });

    this.editor.on('sort-table', () => {
      const table = this.editor?.getSelector()?.restoreTable();
      if (table && this.editor) {
        const command = new SortTableCommand(this.editor, table);
        command.execute();
      }
    });

    this.editor.on('resize-columns', () => {
      const table = this.editor?.getSelector()?.restoreTable();
      if (table && this.editor) {
        const command = new ResizeColumnsCommand(this.editor, table);
        command.execute();
      }
    });

    this.editor.on('delete-selected-cells', () => {
      const table = this.editor?.getSelector()?.restoreTable();
      if (table && this.editor) {
        const selectedCells = table.querySelectorAll(
          '.table-cell.selected, .table-header-cell.selected'
        );
        if (selectedCells.length > 0) {
          const command = new DeleteCellContentCommand(this.editor, selectedCells[0] as HTMLElement);
          command.execute();
        }
      }
    });

    this.editor.on('copy-selected-cells', () => {
      const table = this.editor?.getSelector()?.restoreTable();
      if (table && this.editor) {
        const selectedCells = table.querySelectorAll(
          '.table-cell.selected, .table-header-cell.selected'
        );
        if (selectedCells.length > 0) {
          const command = new CopyCellCommand(this.editor, selectedCells[0] as HTMLElement);
          command.execute();
        }
      }
    });

    this.editor.on('paste-cells', () => {
      const table = this.editor?.getSelector()?.restoreTable();
      if (table && this.editor) {
        const selectedCells = table.querySelectorAll(
          '.table-cell.selected, .table-header-cell.selected'
        );
        if (selectedCells.length > 0) {
          const command = new PasteCellCommand(this.editor, selectedCells[0] as HTMLElement);
          command.execute();
        }
      }
    });

    this.editor.on('cut-selected-cells', () => {
      const table = this.editor?.getSelector()?.restoreTable();
      if (table && this.editor) {
        const selectedCells = table.querySelectorAll(
          '.table-cell.selected, .table-header-cell.selected'
        );
        if (selectedCells.length > 0) {
          const command = new CutCellCommand(this.editor, selectedCells[0] as HTMLElement);
          command.execute();
        }
      }
    });

    this.editor.on('select-all-cells', () => {
      const table = this.editor?.getSelector()?.restoreTable();
      if (table && this.editor) {
        const command = new SelectAllCommand(this.editor, table);
        command.execute();
      }
    });
  }

  private handleContextMenu = (e: Event): void => {
    const cell = (e.target as Element).closest('.table-cell, .table-header-cell');
    if (cell instanceof HTMLElement) {
      e.preventDefault();

      // Получаем координаты мыши с учётом прокрутки страницы
      const mouseX = (e as MouseEvent).clientX + window.scrollX;
      const mouseY = (e as MouseEvent).clientY + window.scrollY;

      // Показываем контекстное меню с учётом скорректированных координат
      this.contextMenu?.show(cell, mouseX, mouseY);
    }
  };

  private handleClick = (e: Event): void => {
    const table = (e.target as Element).closest('.html-editor-table');
    if (table instanceof HTMLElement) {
      e.preventDefault();
      this.editor?.getSelector()?.saveTable(table);
    }

    const cell = (e.target as Element).closest(
      '.table-cell, .table-header-cell'
    ) as HTMLElement | null;
    if (!cell) return;

    if (cell instanceof HTMLElement) {
      e.preventDefault();
      this.editor?.getSelector()?.selectCell(cell);

      // Очищаем предыдущий resizer
      if (this.currentResizer) {
        this.currentResizer.destroy();
        this.currentResizer = null;
      }

      // Создаем новый resizer для ячейки
      this.currentResizer = new Resizer(cell, {
        handleSize: 10,
        handleColor: 'blue',
        onResizeStart: () => this.editor?.disableObserver(),
        onResize: (width, height) => {
          cell.style.width = `${width}px`;
          cell.style.height = `${height}px`;
        },
        onResizeEnd: () => this.editor?.enableObserver(),
      });
    }
  };

  private handleMouseDown = (e: MouseEvent): void => {
    const cell = (e.target as Element).closest(
      '.table-cell, .table-header-cell'
    ) as HTMLElement | null;
    if (!cell) return;

    if (e.shiftKey) {
      // Множественный выбор с Shift
      e.preventDefault();
      this.addToSelection(cell);
    } else {
      // Одиночный выбор
      this.clearSelection();
      this.addToSelection(cell);
    }
  };

  private handleMouseOver = (e: Event): void => {
    const cell = (e.target as Element).closest(
      '.table-cell, .table-header-cell'
    ) as HTMLElement | null;
    if (!cell) return;

    // Добавляем визуальную обратную связь при наведении
    cell.classList.add('hover');
  };

  private handleMouseOut = (e: Event): void => {
    const cell = (e.target as Element).closest(
      '.table-cell, .table-header-cell'
    ) as HTMLElement | null;
    if (!cell) return;

    // Убираем визуальную обратную связь
    cell.classList.remove('hover');
  };

  private handleKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Delete') {
      const table = this.editor?.getSelector()?.restoreTable();
      if (table) {
        table.remove();
        this.editor?.getSelector()?.clearTable();
      }
    }

    // Навигация по таблице с клавиатуры
    if (
      e.target instanceof HTMLElement &&
      (e.target.classList.contains('table-cell') ||
        e.target.classList.contains('table-header-cell'))
    ) {
      this.handleTableNavigation(e);
    }
  };

  private handleTableNavigation(e: KeyboardEvent): void {
    const cell = e.target as HTMLElement;
    const table = cell.closest('.html-editor-table') as HTMLElement;
    if (!table) return;

    const currentRow = cell.parentElement as HTMLElement;
    const currentCol = Array.from(
      currentRow.querySelectorAll('.table-cell, .table-header-cell')
    ).indexOf(cell);

    let nextCell: HTMLElement | null = null;

    switch (e.key) {
      case 'ArrowUp':
        if (currentRow.previousElementSibling) {
          const prevRow = currentRow.previousElementSibling as HTMLElement;
          const cells = prevRow.querySelectorAll('.table-cell, .table-header-cell');
          nextCell = (cells[currentCol] as HTMLElement) || null;
        }
        break;
      case 'ArrowDown':
        if (currentRow.nextElementSibling) {
          const nextRow = currentRow.nextElementSibling as HTMLElement;
          const cells = nextRow.querySelectorAll('.table-cell, .table-header-cell');
          nextCell = (cells[currentCol] as HTMLElement) || null;
        }
        break;
      case 'ArrowLeft':
        const leftCells = currentRow.querySelectorAll('.table-cell, .table-header-cell');
        nextCell = (leftCells[currentCol - 1] as HTMLElement) || null;
        break;
      case 'ArrowRight':
        const rightCells = currentRow.querySelectorAll('.table-cell, .table-header-cell');
        nextCell = (rightCells[currentCol + 1] as HTMLElement) || null;
        break;
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          const leftCells = currentRow.querySelectorAll('.table-cell, .table-header-cell');
          nextCell = (leftCells[currentCol - 1] as HTMLElement) || null;
        } else {
          const rightCells = currentRow.querySelectorAll('.table-cell, .table-header-cell');
          nextCell = (rightCells[currentCol + 1] as HTMLElement) || null;
        }
        break;
    }

    if (nextCell) {
      e.preventDefault();
      nextCell.focus();
      this.editor?.getSelector()?.selectCell(nextCell);
    }
  }

  private addToSelection(cell: HTMLElement): void {
    if (!this.selectedCells.includes(cell)) {
      this.selectedCells.push(cell);
      cell.classList.add('selected');
    }
  }

  private clearSelection(): void {
    this.selectedCells.forEach((cell) => cell.classList.remove('selected'));
    this.selectedCells = [];
  }

  private insertTable(options: { rows: number; cols: number; hasHeader: boolean }): void {
    if (!this.editor) return;

    const table = document.createElement('div');
    table.className = 'html-editor-table table-modern';

    // Создаем заголовки если нужно
    if (options.hasHeader) {
      const headerRow = document.createElement('div');
      headerRow.className = 'table-header-row';

      for (let i = 0; i < options.cols; i++) {
        const headerCell = document.createElement('div');
        headerCell.className = 'table-header-cell';
        headerCell.textContent = `Header ${i + 1}`;
        headerCell.contentEditable = 'true';
        headerRow.appendChild(headerCell);
      }

      table.appendChild(headerRow);
    }

    // Создаем строки данных
    for (let i = 0; i < options.rows; i++) {
      const row = document.createElement('div');
      row.className = 'table-row';

      for (let j = 0; j < options.cols; j++) {
        const cell = document.createElement('div');
        cell.className = 'table-cell';
        cell.textContent = `Cell ${i + 1}-${j + 1}`;
        cell.contentEditable = 'true';
        row.appendChild(cell);
      }

      table.appendChild(row);
    }

    // Вставляем таблицу в редактор
    this.editor.ensureEditorFocus();
    const range = this.editor.getSelector()?.restoreSelection(this.editor.getContainer());
    if (range) {
      range.deleteContents();
      range.insertNode(table);
      range.collapse(false);
      this.editor.getSelector()?.saveSelection();
    }

    // Сохраняем таблицу в селекторе
    this.editor.getSelector()?.saveTable(table);
  }

  destroy(): void {
    if (!this.editor) return;

    const container = this.editor.getContainer();
    if (container) {
      container.removeEventListener('click', this.handleClick);
      container.removeEventListener('contextmenu', this.handleContextMenu);
      container.removeEventListener('keydown', this.handleKeydown);
      container.removeEventListener('mousedown', this.handleMouseDown);
      container.removeEventListener('mouseover', this.handleMouseOver);
      container.removeEventListener('mouseout', this.handleMouseOut);
    }

    if (this.popup) {
      this.popup.destroy();
      this.popup = null;
    }

    if (this.contextMenu) {
      this.contextMenu.destroy();
      this.contextMenu = null;
    }

    if (this.tableEditor) {
      this.tableEditor.destroy();
      this.tableEditor = null;
    }

    if (this.cellFormatter) {
      this.cellFormatter.destroy();
      this.cellFormatter = null;
    }

    if (this.currentResizer) {
      this.currentResizer.destroy();
      this.currentResizer = null;
    }

    if (this.exportService) {
      this.exportService = null;
    }

    this.editor?.off('table');
    this.editor?.getSelector()?.clearTable();
    this.editor = null;
  }
}
