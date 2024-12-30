import { PopupManager } from '../../../core/ui/PopupManager';
import type { TableOptions } from './Table';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';

export class TablePopup {
  private editor: HTMLEditor;
  private popup: PopupManager;
  private selectedRows = 0;
  private selectedCols = 0;
  private hasHeader = false;
  private callback: ((options: TableOptions) => void) | null = null;

  // Ссылки на элементы
  private grid: HTMLElement | null = null;
  private label: HTMLElement | null = null;
  private headerCheckbox: HTMLInputElement | null = null;

  constructor(editor: HTMLEditor) {
    this.editor = editor;
    this.popup = new PopupManager(editor, {
      title: editor.t('Insert Table'),
      className: 'table-popup',
      closeOnClickOutside: true,
      buttons: [
        {
          label: editor.t('Cancel'),
          variant: 'secondary',
          onClick: () => this.popup.hide(),
        },
      ],
      items: [
        {
          type: 'custom',
          id: 'table-content',
          content: () => this.createContent(),
        },
      ],
    });
  }

  private createContent(): HTMLElement {
    // Основной контейнер
    const container = document.createElement('div');
    container.className = 'p-4';

    // Опция для заголовка таблицы
    const headerOption = document.createElement('div');
    headerOption.className = 'table-options mb-4';

    const headerLabel = document.createElement('label');
    headerLabel.className = 'flex items-center gap-2';

    this.headerCheckbox = document.createElement('input');
    this.headerCheckbox.type = 'checkbox';
    this.headerCheckbox.className = 'table-option-checkbox';
    this.headerCheckbox.id = 'tableHeader';

    const headerText = document.createElement('span');
    headerText.className = 'table-option-label';
    headerText.textContent = this.editor.t('Include header row');

    headerLabel.appendChild(this.headerCheckbox);
    headerLabel.appendChild(headerText);
    headerOption.appendChild(headerLabel);

    // Сетка для выбора размера таблицы
    this.grid = document.createElement('div');
    this.grid.className = 'table-size-grid';

    for (let i = 0; i < 100; i++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      this.grid.appendChild(cell);
    }

    // Подпись с выбранным размером
    this.label = document.createElement('div');
    this.label.className = 'text-sm text-gray-600 mt-2';
    this.label.textContent = '0 x 0';

    // Сборка структуры
    container.appendChild(headerOption);
    container.appendChild(this.grid);
    container.appendChild(this.label);

    // Настройка обработчиков событий
    this.setupEventListeners();

    return container;
  }

  private setupEventListeners(): void {
    if (!this.grid || !this.label || !this.headerCheckbox) return;

    this.grid.addEventListener('mousemove', this.handleGridMouseMove);
    this.grid.addEventListener('mouseleave', this.handleGridMouseLeave);
    this.grid.addEventListener('click', this.handleGridClick);
    this.headerCheckbox.addEventListener('change', this.handleHeaderCheckboxChange);
  }

  private handleGridMouseMove = (e: MouseEvent): void => {
    const cell = e.target as HTMLElement;
    const cells = Array.from(this.grid!.children) as HTMLElement[];
    const index = cells.indexOf(cell);
    if (index >= 0) {
      const row = Math.floor(index / 10);
      const col = index % 10;
      this.selectedRows = row + 1;
      this.selectedCols = col + 1;

      cells.forEach((cell, i) => {
        const currentRow = Math.floor(i / 10);
        const currentCol = i % 10;
        cell.classList.toggle(
          'selected',
          currentRow < this.selectedRows && currentCol < this.selectedCols
        );
      });

      this.label!.textContent = `${this.selectedRows} x ${this.selectedCols}`;
    }
  };

  private handleGridMouseLeave = (): void => {
    const cells = Array.from(this.grid!.children) as HTMLElement[];
    cells.forEach((cell) => cell.classList.remove('selected'));
    this.label!.textContent = '0 x 0';
  };

  private handleGridClick = (): void => {
    if (this.selectedRows > 0 && this.selectedCols > 0) {
      this.callback?.({
        rows: this.selectedRows,
        cols: this.selectedCols,
        hasHeader: this.hasHeader,
      });
      this.popup.hide();
    }
  };

  private handleHeaderCheckboxChange = (e: Event): void => {
    this.hasHeader = (e.target as HTMLInputElement).checked;
  };

  public show(callback: (options: TableOptions) => void): void {
    this.callback = callback;
    this.popup.show();
  }

  public destroy(): void {
    // Удаляем обработчики событий
    if (this.grid) {
      this.grid.removeEventListener('mousemove', this.handleGridMouseMove);
      this.grid.removeEventListener('mouseleave', this.handleGridMouseLeave);
      this.grid.removeEventListener('click', this.handleGridClick);
    }

    if (this.headerCheckbox) {
      this.headerCheckbox.removeEventListener('change', this.handleHeaderCheckboxChange);
    }

    // Уничтожаем PopupManager
    this.popup.destroy();

    // Очищаем ссылки на элементы
    this.grid = null;
    this.label = null;
    this.headerCheckbox = null;

    // Очищаем callback
    this.callback = null;
  }
}
