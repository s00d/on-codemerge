import type { HTMLEditor } from '../../../core/HTMLEditor';
import type { Command } from '../../../core/commands/Command';
import { PopupManager } from '../../../core/ui/PopupManager';

export class SortTableCommand implements Command {
  private editor: HTMLEditor;
  private table: HTMLElement;

  constructor(editor: HTMLEditor, table: HTMLElement) {
    this.editor = editor;
    this.table = table;
  }

  execute(): void {
    // Показываем диалог сортировки напрямую
    this.showSortDialog();
  }

  private showSortDialog(): void {
    if (!this.editor) return;

    const sortPopup: PopupManager = new PopupManager(this.editor, {
      title: this.editor.t('Sort Table'),
      className: 'sort-dialog-popup',
      closeOnClickOutside: true,
      buttons: [
        {
          label: this.editor.t('Cancel'),
          variant: 'secondary',
          onClick: () => sortPopup.hide(),
        },
      ],
      items: [
        {
          type: 'custom',
          id: 'sort-options',
          content: () => {
            const container = document.createElement('div');
            container.className = 'p-4 space-y-4';

            // Получаем количество столбцов из первой строки
            const firstRow = this.table.querySelector(
              '.table-header-row, .table-row'
            ) as HTMLElement;
            if (firstRow) {
              const colCount = firstRow.querySelectorAll('.table-cell, .table-header-cell').length;
              const columnSelect = document.createElement('select');
              columnSelect.className = 'w-full p-2 border border-gray-300 rounded-md';
              for (let i = 0; i < colCount; i++) {
                const option = document.createElement('option');
                option.value = i.toString();
                // Пытаемся получить заголовок столбца
                const header = firstRow.querySelectorAll('.table-header-cell')[i];
                if (header && header.textContent?.trim()) {
                  option.textContent = header.textContent.trim();
                } else {
                  option.textContent = `Column ${i + 1}`;
                }
                columnSelect.appendChild(option);
              }
              container.appendChild(columnSelect);

              // Выбор направления сортировки
              const directionSelect = document.createElement('select');
              directionSelect.className = 'w-full p-2 border border-gray-300 rounded-md';
              const ascOption = document.createElement('option');
              ascOption.value = 'asc';
              ascOption.textContent = this.editor?.t('Ascending') || 'Ascending';
              directionSelect.appendChild(ascOption);
              const descOption = document.createElement('option');
              descOption.value = 'desc';
              descOption.textContent = this.editor?.t('Descending') || 'Descending';
              directionSelect.appendChild(descOption);
              container.appendChild(directionSelect);

              // Кнопка сортировки
              const sortButton = document.createElement('button');
              sortButton.className =
                'w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600';
              sortButton.textContent = this.editor.t('Sort');
              sortButton.onclick = () => {
                this.performSort(
                  parseInt(columnSelect.value),
                  directionSelect.value as 'asc' | 'desc'
                );
                sortPopup.hide();
              };

              container.appendChild(sortButton);
            }

            return container;
          },
        },
      ],
    });

    sortPopup.show();
  }

  private performSort(columnIndex: number, direction: 'asc' | 'desc'): void {
    const rows = Array.from(this.table.querySelectorAll('.table-row'));
    const headerRow = this.table.querySelector('.table-header-row') as HTMLElement;

    if (rows.length === 0) return;

    // Сортируем строки
    rows.sort((a, b) => {
      const aCell = a.querySelectorAll('.table-cell')[columnIndex] as HTMLElement;
      const bCell = b.querySelectorAll('.table-cell')[columnIndex] as HTMLElement;

      if (!aCell || !bCell) return 0;

      const aValue = aCell.textContent || '';
      const bValue = bCell.textContent || '';

      if (direction === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

    // Перестраиваем таблицу
    if (headerRow) {
      this.table.appendChild(headerRow);
    }

    rows.forEach((row) => {
      this.table.appendChild(row);
    });
  }

  undo(): void {
    // Отмена сортировки не требуется
  }
}
