import type { Command } from '../../../core/commands/Command';
import type { HTMLEditor } from '../../../core/HTMLEditor';
import { ContextMenu } from '../../../core/ui/ContextMenu.ts';
import { AddRowCommand } from '../commands/AddRowCommand.ts';
import { AddColumnCommand } from '../commands/AddColumnCommand.ts';
import { DeleteRowCommand } from '../commands/DeleteRowCommand.ts';
import { DeleteColumnCommand } from '../commands/DeleteColumnCommand.ts';
import { DeleteTableCommand } from '../commands/DeleteTableCommand.ts';
import { StyleTableCellCommand } from '../commands/StyleTableCellCommand.ts';
import { CopyTableCommand } from '../commands/CopyTableCommand.ts';
import { MergeCellsCommand } from '../commands/MergeCellsCommand.ts';
import { SplitCellCommand } from '../commands/SplitCellCommand.ts';
import { SetCellBorderCommand } from '../commands/SetCellBorderCommand.ts';
import { InsertCellCommand } from '../commands/InsertCellCommand.ts';
import { FormatCellCommand } from '../commands/FormatCellCommand.ts';
import { ShowTablePropertiesCommand } from '../commands/ShowTablePropertiesCommand.ts';
import { ExportTableCommand } from '../commands/ExportTableCommand.ts';
import { ImportTableCommand } from '../commands/ImportTableCommand.ts';
import { SortTableCommand } from '../commands/SortTableCommand.ts';
import { ResizeColumnsCommand } from '../commands/ResizeColumnsCommand.ts';
import { SelectAllCommand } from '../commands/SelectAllCommand.ts';
import { CopyCellCommand } from '../commands/CopyCellCommand.ts';
import { CutCellCommand } from '../commands/CutCellCommand.ts';
import { PasteCellCommand } from '../commands/PasteCellCommand.ts';
import { DeleteCellContentCommand } from '../commands/DeleteCellContentCommand.ts';
import { SelectRowCommand } from '../commands/SelectRowCommand.ts';
import { SelectColumnCommand } from '../commands/SelectColumnCommand.ts';
import { AutoFitCommand } from '../commands/AutoFitCommand.ts';
import { ClearTableCommand } from '../commands/ClearTableCommand.ts';
import { DeleteCellCommand } from '../commands/DeleteCellCommand.ts';
import { LazyTableModal } from './LazyTableModal';
import { deleteTableIcon, deleteRowIcon, deleteColumnIcon, copyIcon } from '../../../icons';
import { PopupManager } from '../../../core/ui/PopupManager.ts';

export const navigationIcons = {
  arrowUp: '↑',
  arrowDown: '↓',
  arrowLeft: '←',
  arrowRight: '→',
  remove: '×',
};

export const mergeIcon = '🟰';
export const splitIcon = '✂️';
export const formatIcon = '🎨';
export const exportIcon = '📤';
export const importIcon = '📥';
export const propertiesIcon = '⚙️';
export const lazyIcon = '🔄';

export class TableContextMenu {
  private contextMenu: ContextMenu;
  private activeCell: HTMLElement | null = null;
  private popupManager: PopupManager;
  private colorPicker: HTMLInputElement | null = null;
  private editor: HTMLEditor;

  constructor(editor: HTMLEditor) {
    this.editor = editor;
    this.contextMenu = new ContextMenu(
      editor,
      [
        {
          type: 'group',
          groupTitle: editor.t('Insert'),
          subMenu: [
            {
              title: editor.t('Add Row'),
              icon: '➕',
              subMenu: [
                {
                  title: editor.t('Add Row Above'),
                  icon: navigationIcons.arrowUp,
                  action: 'add-row-above',
                  onClick: () => this.executeAction('add-row-above'),
                  hotkey: 'Ctrl+Shift+↑',
                },
                {
                  title: editor.t('Add Row Below'),
                  icon: navigationIcons.arrowDown,
                  action: 'add-row-below',
                  onClick: () => this.executeAction('add-row-below'),
                  hotkey: 'Ctrl+Shift+↓',
                },
              ],
            },
            {
              title: editor.t('Add Column'),
              icon: '➕',
              subMenu: [
                {
                  title: editor.t('Add Column Left'),
                  icon: navigationIcons.arrowLeft,
                  action: 'add-col-left',
                  onClick: () => this.executeAction('add-col-left'),
                  hotkey: 'Ctrl+Shift+←',
                },
                {
                  title: editor.t('Add Column Right'),
                  icon: navigationIcons.arrowRight,
                  action: 'add-col-right',
                  onClick: () => this.executeAction('add-col-right'),
                  hotkey: 'Ctrl+Shift+→',
                },
              ],
            },
            {
              title: editor.t('Insert Cell'),
              icon: '➕',
              subMenu: [
                {
                  title: editor.t('Insert Cell Left'),
                  icon: navigationIcons.arrowLeft,
                  action: 'insert-cell-left',
                  onClick: () => this.executeAction('insert-cell-left'),
                  hotkey: 'Alt+Shift+←',
                },
                {
                  title: editor.t('Insert Cell Right'),
                  icon: navigationIcons.arrowRight,
                  action: 'insert-cell-right',
                  onClick: () => this.executeAction('insert-cell-right'),
                  hotkey: 'Alt+Shift+→',
                },
                {
                  title: editor.t('Insert Cell Above'),
                  icon: navigationIcons.arrowUp,
                  action: 'insert-cell-top',
                  onClick: () => this.executeAction('insert-cell-top'),
                  hotkey: 'Alt+Shift+↑',
                },
                {
                  title: editor.t('Insert Cell Below'),
                  icon: navigationIcons.arrowDown,
                  action: 'insert-cell-bottom',
                  onClick: () => this.executeAction('insert-cell-bottom'),
                  hotkey: 'Alt+Shift+↓',
                },
              ],
            },
          ],
        },
        {
          type: 'divider',
        },
        {
          type: 'group',
          groupTitle: editor.t('Delete'),
          subMenu: [
            {
              title: editor.t('Delete Elements'),
              icon: '🗑️',
              subMenu: [
                {
                  title: editor.t('Delete Row'),
                  icon: deleteRowIcon,
                  action: 'delete-row',
                  onClick: () => this.executeAction('delete-row'),
                  variant: 'danger',
                  hotkey: 'Delete',
                },
                {
                  title: editor.t('Delete Column'),
                  icon: deleteColumnIcon,
                  action: 'delete-col',
                  onClick: () => this.executeAction('delete-col'),
                  variant: 'danger',
                  hotkey: 'Backspace',
                },
                {
                  title: editor.t('Clear Cell'),
                  icon: '🧹',
                  action: 'clear-cell',
                  onClick: () => this.executeAction('clear-cell'),
                  variant: 'warning',
                  hotkey: 'Ctrl+Shift+Backspace',
                },
                {
                  title: editor.t('Delete Cell'),
                  icon: '🗑️',
                  action: 'delete-cell',
                  onClick: () => this.executeAction('delete-cell'),
                  variant: 'danger',
                  hotkey: 'Delete',
                },
                {
                  title: editor.t('Delete Table'),
                  icon: deleteTableIcon,
                  action: 'delete-table',
                  onClick: () => this.executeAction('delete-table'),
                  variant: 'danger',
                  hotkey: 'Ctrl+Delete',
                },
              ],
            },
          ],
        },
        {
          type: 'divider',
        },
        {
          type: 'group',
          groupTitle: editor.t('Table Operations'),
          subMenu: [
            {
              title: editor.t('Clipboard Operations'),
              icon: '📋',
              subMenu: [
                {
                  title: editor.t('Copy Table'),
                  icon: copyIcon,
                  action: 'copy-table',
                  onClick: () => this.executeAction('copy-table'),
                  hotkey: 'Ctrl+C',
                },
                {
                  title: editor.t('Copy Cell'),
                  icon: '📋',
                  action: 'copy-cell',
                  onClick: () => this.executeAction('copy-cell'),
                  hotkey: 'Alt+Shift+C',
                },
                {
                  title: editor.t('Cut Cell'),
                  icon: '✂️',
                  action: 'cut-cell',
                  onClick: () => this.executeAction('cut-cell'),
                  hotkey: 'Ctrl+X',
                },
                {
                  title: editor.t('Paste Cell'),
                  icon: '📋',
                  action: 'paste-cell',
                  onClick: () => this.executeAction('paste-cell'),
                  hotkey: 'Ctrl+V',
                },
              ],
            },
            {
              title: editor.t('Cell Operations'),
              icon: '🔗',
              subMenu: [
                {
                  title: editor.t('Merge Cells'),
                  icon: mergeIcon,
                  subMenu: [
                    {
                      title: editor.t('Merge Horizontally'),
                      icon: '↔',
                      action: 'merge-cells-horizontal',
                      onClick: () => this.executeAction('merge-cells-horizontal'),
                      hotkey: 'Ctrl+Shift+Z',
                    },
                    {
                      title: editor.t('Merge Vertically'),
                      icon: '↕',
                      action: 'merge-cells-vertical',
                      onClick: () => this.executeAction('merge-cells-vertical'),
                      hotkey: 'Ctrl+Shift+V',
                    },
                  ],
                },
                {
                  title: editor.t('Split Cell'),
                  icon: splitIcon,
                  subMenu: [
                    {
                      title: editor.t('Split Horizontally'),
                      icon: '⇹',
                      action: 'split-cell-horizontal',
                      onClick: () => this.executeAction('split-cell-horizontal'),
                      hotkey: 'Alt+Shift+H',
                    },
                    {
                      title: editor.t('Split Vertically'),
                      icon: '⇳',
                      action: 'split-cell-vertical',
                      onClick: () => this.executeAction('split-cell-vertical'),
                      hotkey: 'Alt+Shift+V',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'divider',
        },
        {
          type: 'group',
          groupTitle: editor.t('Selection'),
          subMenu: [
            {
              title: editor.t('Select Elements'),
              icon: '☑️',
              subMenu: [
                {
                  title: editor.t('Select All'),
                  icon: '☑️',
                  action: 'select-all',
                  onClick: () => this.executeAction('select-all'),
                  hotkey: 'Ctrl+A',
                },
                {
                  title: editor.t('Select Row'),
                  icon: '➡️',
                  action: 'select-row',
                  onClick: () => this.executeAction('select-row'),
                  hotkey: 'Ctrl+Shift+R',
                },
                {
                  title: editor.t('Select Column'),
                  icon: '⬇️',
                  action: 'select-column',
                  onClick: () => this.executeAction('select-column'),
                  hotkey: 'Alt+Shift+Col',
                },
              ],
            },
          ],
        },
        {
          type: 'divider',
        },
        {
          type: 'group',
          groupTitle: editor.t('Table Management'),
          subMenu: [
            {
              title: editor.t('Format'),
              icon: formatIcon,
              subMenu: [
                {
                  title: editor.t('Format Cell'),
                  icon: formatIcon,
                  action: 'format-cell',
                  onClick: () => this.executeAction('format-cell'),
                  hotkey: 'Ctrl+F',
                },
                {
                  title: editor.t('Table Properties'),
                  icon: '⚙️',
                  action: 'table-properties',
                  onClick: () => this.executeAction('table-properties'),
                  hotkey: 'Ctrl+Shift+P',
                },
              ],
            },
            {
              title: editor.t('Table Tools'),
              icon: '🔧',
              subMenu: [
                {
                  title: editor.t('Sort Table'),
                  icon: '📈',
                  action: 'sort-table',
                  onClick: () => this.executeAction('sort-table'),
                  hotkey: 'Ctrl+S',
                },
                {
                  title: editor.t('Resize Columns'),
                  icon: '📏',
                  action: 'resize-columns',
                  onClick: () => this.executeAction('resize-columns'),
                  hotkey: 'Ctrl+R',
                },
                {
                  title: editor.t('Auto Fit'),
                  icon: '🔧',
                  action: 'auto-fit',
                  onClick: () => this.executeAction('auto-fit'),
                  hotkey: 'Ctrl+Shift+A',
                },
              ],
            },
            {
              title: editor.t('Data'),
              icon: '📊',
              subMenu: [
                {
                  title: editor.t('Import/Export'),
                  icon: '📊',
                  subMenu: [
                    {
                      title: editor.t('Export Table'),
                      icon: exportIcon,
                      action: 'export-table',
                      onClick: () => this.executeAction('export-table'),
                      variant: 'success',
                      hotkey: 'Ctrl+E',
                    },
                    {
                      title: editor.t('Import Table'),
                      icon: importIcon,
                      action: 'import-table',
                      onClick: () => this.executeAction('import-table'),
                      variant: 'success',
                      hotkey: 'Ctrl+I',
                    },
                  ],
                },
                {
                  title: editor.t('Edit Lazy Table'),
                  icon: lazyIcon,
                  action: 'edit-lazy-table',
                  onClick: () => this.executeAction('edit-lazy-table'),
                  variant: 'success',
                  hotkey: 'Ctrl+L',
                },
                {
                  title: editor.t('Fill Table'),
                  icon: '📥',
                  action: 'fill-table',
                  onClick: () => this.executeAction('fill-table'),
                  variant: 'success',
                  hotkey: 'Ctrl+F',
                },
                {
                  title: editor.t('Clear Table'),
                  icon: '🧹',
                  action: 'clear-table',
                  onClick: () => this.executeAction('clear-table'),
                  variant: 'warning',
                  hotkey: 'Ctrl+Shift+Delete',
                },
              ],
            },
          ],
        },
        {
          type: 'divider',
        },
        {
          type: 'custom',
          customHTML: `<input type="color" class="table-color-picker" title="${editor.t('Background Color')}">`,
        },
      ],
      {
        maxHeight: 350,
        maxWidth: 280,
        animation: true,
        closeOnClickOutside: true,
        closeOnEscape: true,
      }
    );

    this.popupManager = new PopupManager(editor, {
      title: editor.t('Set Cell Border'),
      closeOnClickOutside: true,
      buttons: [
        {
          label: editor.t('Confirm'),
          variant: 'primary',
          onClick: () => this.handleBorderConfirm(),
        },
        {
          label: editor.t('Cancel'),
          variant: 'secondary',
          onClick: () => this.popupManager.hide(),
        },
      ],
    });

    this.setupColorPicker();
  }
  private handleBorderConfirm(): void {
    const borderStyle = this.popupManager.getValue('border-style') as string;
    if (borderStyle && this.activeCell) {
      const command = new SetCellBorderCommand(this.activeCell, borderStyle);
      command.execute();
    }
    this.popupManager.hide();
  }

  private setupColorPicker(): void {
    this.colorPicker = this.contextMenu
      .getElement()
      .querySelector('.table-color-picker') as HTMLInputElement;
    if (this.colorPicker) {
      this.colorPicker.addEventListener('input', (e) => {
        if (this.activeCell) {
          const command = new StyleTableCellCommand(this.activeCell, {
            backgroundColor: (e.target as HTMLInputElement).value,
          });
          command.execute();
        }
      });

      this.colorPicker.addEventListener('contextmenu', (e) => e.stopPropagation());
    }
  }

  private executeAction(action: string): void {
    if (!this.activeCell) return;

    const table = this.activeCell.closest('.html-editor-table');
    if (!table || !(table instanceof HTMLElement)) return;

    let command: Command | null = null;

    switch (action) {
      case 'add-row-above':
        command = new AddRowCommand(table, this.activeCell, true);
        break;
      case 'add-row-below':
        command = new AddRowCommand(table, this.activeCell, false);
        break;
      case 'add-col-left':
        command = new AddColumnCommand(table, this.activeCell, true);
        break;
      case 'add-col-right':
        command = new AddColumnCommand(table, this.activeCell, false);
        break;
      case 'insert-cell-left':
        command = new InsertCellCommand(this.editor, this.activeCell, 'left');
        break;
      case 'insert-cell-right':
        command = new InsertCellCommand(this.editor, this.activeCell, 'right');
        break;
      case 'insert-cell-top':
        command = new InsertCellCommand(this.editor, this.activeCell, 'top');
        break;
      case 'insert-cell-bottom':
        command = new InsertCellCommand(this.editor, this.activeCell, 'bottom');
        break;
      case 'delete-row':
        command = new DeleteRowCommand(table, this.activeCell);
        break;
      case 'delete-col':
        command = new DeleteColumnCommand(table, this.activeCell);
        break;
      case 'delete-table':
        command = new DeleteTableCommand(table);
        break;
      case 'copy-table':
        command = new CopyTableCommand(table);
        break;
      case 'merge-cells-horizontal':
        command = new MergeCellsCommand(table, this.activeCell, 'horizontal');
        break;
      case 'merge-cells-vertical':
        command = new MergeCellsCommand(table, this.activeCell, 'vertical');
        break;
      case 'split-cell-horizontal':
        command = new SplitCellCommand(table, this.activeCell, 'horizontal');
        break;
      case 'split-cell-vertical':
        command = new SplitCellCommand(table, this.activeCell, 'vertical');
        break;
      case 'format-cell':
        command = new FormatCellCommand(this.editor, this.activeCell);
        break;
      case 'table-properties':
        command = new ShowTablePropertiesCommand(this.editor, table);
        break;
      case 'export-table':
        command = new ExportTableCommand(this.editor, table);
        break;
      case 'import-table':
        command = new ImportTableCommand(this.editor);
        break;
      case 'sort-table':
        command = new SortTableCommand(this.editor, table);
        break;
      case 'resize-columns':
        command = new ResizeColumnsCommand(this.editor, table);
        break;
      case 'select-all':
        command = new SelectAllCommand(this.editor, table);
        break;
      case 'copy-cell':
        command = new CopyCellCommand(this.editor, this.activeCell);
        break;
      case 'cut-cell':
        command = new CutCellCommand(this.editor, this.activeCell);
        break;
      case 'paste-cell':
        command = new PasteCellCommand(this.editor, this.activeCell);
        break;
      case 'delete-cell':
        command = new DeleteCellCommand(this.editor, this.activeCell);
        break;
      case 'select-row':
        command = new SelectRowCommand(this.editor, this.activeCell);
        break;
      case 'select-column':
        command = new SelectColumnCommand(this.editor, this.activeCell);
        break;
      case 'auto-fit':
        command = new AutoFitCommand(this.editor, table);
        break;
      case 'clear-table':
        command = new ClearTableCommand(this.editor, table);
        break;
      case 'clear-cell':
        command = new DeleteCellContentCommand(this.editor, this.activeCell);
        break;
      case 'edit-lazy-table':
        this.editLazyTable(table);
        // Закрываем контекстное меню после выполнения действия
        this.contextMenu.hide();
        break;
      case 'fill-table':
        this.fillTable(table);
        // Закрываем контекстное меню после выполнения действия
        this.contextMenu.hide();
        break;
    }

    if (command) {
      command.execute();
    }
  }

  private editLazyTable(table: HTMLElement): void {
    // Получаем текущие параметры из таблицы
    const currentOptions = {
      url: table.getAttribute('data-lazy-url') || '',
      format: (table.getAttribute('data-lazy-format') as 'json' | 'csv') || 'json',
      hasHeaders: table.getAttribute('data-lazy-headers') !== 'false',
      delimiter: table.getAttribute('data-lazy-delimiter') || ',',
      tableId: table.id || '',
      isEdit: true,
      onSave: (options: any) => {
        // Обновляем атрибуты таблицы
        if (options.url) table.setAttribute('data-lazy-url', options.url);
        if (options.format) table.setAttribute('data-lazy-format', options.format);
        if (options.delimiter) table.setAttribute('data-lazy-delimiter', options.delimiter);
        if (options.hasHeaders !== undefined) {
          table.setAttribute('data-lazy-headers', String(options.hasHeaders));
        }
        if (options.tableId) table.id = options.tableId;

        // Удаляем старый скрипт если есть
        const oldScript = table.nextElementSibling;
        if (oldScript && oldScript.tagName === 'SCRIPT') {
          oldScript.remove();
        }

        // Генерируем новый скрипт и вставляем его
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.textContent = this.generateLazyScript(table.id, {
          url: table.getAttribute('data-lazy-url') || '',
          format: (table.getAttribute('data-lazy-format') as 'json' | 'csv') || 'json',
          hasHeaders: table.getAttribute('data-lazy-headers') !== 'false',
          delimiter: table.getAttribute('data-lazy-delimiter') || ',',
        });

        table.parentNode?.insertBefore(script, table.nextSibling);

        // Запускаем скрипт для загрузки новых данных
        setTimeout(() => {
          const scriptElement = document.createElement('script');
          scriptElement.textContent = script.textContent;
          document.head.appendChild(scriptElement);
          document.head.removeChild(scriptElement);
        }, 100);
      },
    };

    // Создаем модальное окно для редактирования
    const modal = new LazyTableModal(this.editor, document.createRange(), currentOptions);
    modal.show();
  }

  private fillTable(table: HTMLElement): void {
    // Создаем модальное окно для заполнения таблицы
    const modal = new LazyTableModal(this.editor, document.createRange(), {
      isFillMode: true,
      onSave: (options: any) => {
        // Загружаем данные и заполняем таблицу без вставки JS
        this.loadAndFillTable(table, options);
      },
    });
    modal.show();
  }

  private async loadAndFillTable(table: HTMLElement, options: any): Promise<void> {
    try {
      // Показываем индикатор загрузки
      table.innerHTML =
        '<div class="table-row"><div class="table-cell" style="text-align:center;padding:20px;">Загрузка данных...</div></div>';

      // Загружаем данные
      const response = await fetch(options.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      let data: any;
      if (options.format === 'json') {
        data = await response.json();
      } else {
        const csvText = await response.text();
        data = this.parseCSV(csvText, options.delimiter || ',');
      }

      // Заполняем таблицу данными
      this.renderTableData(table, data, options.format, options.hasHeaders);
    } catch (error) {
      // Показываем ошибку
      table.innerHTML = `<div class="table-row"><div class="table-cell" style="text-align:center;padding:20px;color:#e74c3c;">Ошибка загрузки: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}</div></div>`;
    }
  }

  private parseCSV(csv: string, delimiter: string): string[][] {
    const rows = csv.trim().split('\n');
    return rows.map((row) => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
  }

  private renderTableData(
    table: HTMLElement,
    data: any,
    format: string,
    hasHeaders: boolean
  ): void {
    table.innerHTML = '';

    if (format === 'json') {
      this.renderJSONData(table, data);
    } else {
      this.renderCSVData(table, data, hasHeaders);
    }
  }

  private renderJSONData(table: HTMLElement, data: any[]): void {
    if (!Array.isArray(data) || !data.length) {
      table.innerHTML = '<div class="table-row"><div class="table-cell">Нет данных</div></div>';
      return;
    }

    const headers = Object.keys(data[0]);

    // Создаем заголовки
    const headerRow = document.createElement('div');
    headerRow.className = 'table-header-row';
    headers.forEach((header) => {
      const cell = document.createElement('div');
      cell.className = 'table-header-cell';
      cell.textContent = header;
      headerRow.appendChild(cell);
    });
    table.appendChild(headerRow);

    // Создаем строки данных
    data.forEach((row) => {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'table-row';
      headers.forEach((header) => {
        const cell = document.createElement('div');
        cell.className = 'table-cell';
        cell.textContent = row[header] || '';
        rowDiv.appendChild(cell);
      });
      table.appendChild(rowDiv);
    });
  }

  private renderCSVData(table: HTMLElement, data: string[][], hasHeaders: boolean): void {
    data.forEach((row, rowIndex) => {
      const rowDiv = document.createElement('div');
      rowDiv.className = rowIndex === 0 && hasHeaders ? 'table-header-row' : 'table-row';

      row.forEach((cellData) => {
        const cell = document.createElement('div');
        cell.className = rowIndex === 0 && hasHeaders ? 'table-header-cell' : 'table-cell';
        cell.textContent = cellData;
        rowDiv.appendChild(cell);
      });

      table.appendChild(rowDiv);
    });
  }

  private generateLazyScript(tableId: string, _options: any): string {
    return `
(function() {
  var table = document.getElementById('${tableId}');
  if (!table) return;
  var url = table.getAttribute('data-lazy-url');
  var format = table.getAttribute('data-lazy-format');
  var delimiter = table.getAttribute('data-lazy-delimiter') || ',';
  var hasHeaders = table.getAttribute('data-lazy-headers') !== 'false';
  function showLoading() {
    table.innerHTML = '<div class="table-row"><div class="table-cell" style="text-align:center;padding:20px;">Загрузка данных...</div></div>';
  }
  function showError(msg) {
    table.innerHTML = '<div class="table-row"><div class="table-cell" style="text-align:center;padding:20px;color:#e74c3c;">Ошибка загрузки: ' + msg + '</div></div>';
  }
  function parseCSV(csv, delimiter) {
    var rows = csv.trim().split('\\n');
    return rows.map(function(row) {
      var result = [], current = '', inQuotes = false;
      for (var i = 0; i < row.length; i++) {
        var char = row[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === delimiter && !inQuotes) { result.push(current.trim()); current = ''; }
        else current += char;
      }
      result.push(current.trim());
      return result;
    });
  }
  function renderCSV(data, hasHeaders) {
    table.innerHTML = '';
    data.forEach(function(row, rowIndex) {
      var rowDiv = document.createElement('div');
      rowDiv.className = rowIndex === 0 && hasHeaders ? 'table-header-row' : 'table-row';
      row.forEach(function(cellData) {
        var cell = document.createElement('div');
        cell.className = rowIndex === 0 && hasHeaders ? 'table-header-cell' : 'table-cell';
        cell.textContent = cellData;
        rowDiv.appendChild(cell);
      });
      table.appendChild(rowDiv);
    });
  }
  function renderJSON(data) {
    table.innerHTML = '';
    if (!Array.isArray(data) || !data.length) {
      table.innerHTML = '<div class="table-row"><div class="table-cell">Нет данных</div></div>';
      return;
    }
    var headers = Object.keys(data[0]);
    var headerRow = document.createElement('div');
    headerRow.className = 'table-header-row';
    headers.forEach(function(header) {
      var cell = document.createElement('div');
      cell.className = 'table-header-cell';
      cell.textContent = header;
      headerRow.appendChild(cell);
    });
    table.appendChild(headerRow);
    data.forEach(function(row) {
      var rowDiv = document.createElement('div');
      rowDiv.className = 'table-row';
      headers.forEach(function(header) {
        var cell = document.createElement('div');
        cell.className = 'table-cell';
        cell.textContent = row[header] || '';
        rowDiv.appendChild(cell);
      });
      table.appendChild(rowDiv);
    });
  }
  showLoading();
  fetch(url).then(function(resp) {
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    return format === 'json' ? resp.json() : resp.text();
  }).then(function(data) {
    if (format === 'json') renderJSON(data);
    else renderCSV(parseCSV(data, delimiter), hasHeaders);
  }).catch(function(e) { showError(e.message); });
})();
`;
  }

  public show(cell: HTMLElement, x: number, y: number): void {
    this.activeCell = cell;
    this.contextMenu.show(cell, x, y);
  }

  public hide(): void {
    this.contextMenu.hide();
  }

  public destroy(): void {
    this.contextMenu.destroy();
    this.popupManager.destroy();
  }
}
