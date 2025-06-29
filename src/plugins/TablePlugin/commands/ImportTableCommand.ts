import type { HTMLEditor } from '../../../core/HTMLEditor';
import type { Command } from '../../../core/commands/Command';
import { PopupManager } from '../../../core/ui/PopupManager';
import { TableExportService } from '../services/TableExportService';

export class ImportTableCommand implements Command {
  private editor: HTMLEditor;
  private exportService: TableExportService;

  constructor(editor: HTMLEditor) {
    this.editor = editor;
    this.exportService = new TableExportService();
  }

  execute(): void {
    // Показываем диалог импорта напрямую
    this.showImportDialog();
  }

  private showImportDialog(): void {
    if (!this.editor) return;

    const importPopup: PopupManager = new PopupManager(this.editor, {
      title: this.editor.t('Import Table'),
      className: 'import-dialog-popup',
      closeOnClickOutside: true,
      buttons: [
        {
          label: this.editor.t('Cancel'),
          variant: 'secondary',
          onClick: () => importPopup.hide(),
        },
      ],
      items: [
        {
          type: 'custom',
          id: 'import-options',
          content: () => {
            const container = document.createElement('div');
            container.className = 'p-4 space-y-4';

            // Формат импорта
            const formatSelect = document.createElement('select');
            formatSelect.className = 'w-full p-2 border border-gray-300 rounded-md';

            const formats = [
              { value: 'csv', label: 'CSV' },
              { value: 'json', label: 'JSON' },
            ];

            formats.forEach((format) => {
              const option = document.createElement('option');
              option.value = format.value;
              option.textContent = format.label;
              formatSelect.appendChild(option);
            });

            container.appendChild(formatSelect);

            // Файл для импорта
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.className = 'w-full p-2 border border-gray-300 rounded-md';
            fileInput.accept = '.csv,.json,.html,.txt';
            container.appendChild(fileInput);

            // Кнопка импорта
            const importButton = document.createElement('button');
            importButton.className =
              'w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600';
            importButton.textContent = this.editor.t('Import');
            importButton.onclick = () => {
              if (fileInput.files && fileInput.files[0]) {
                this.performImport(fileInput.files[0], formatSelect.value);
                importPopup.hide();
              }
            };

            container.appendChild(importButton);
            return container;
          },
        },
      ],
    });

    importPopup.show();
  }

  private performImport(file: File, format: string): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;

      try {
        let table: HTMLElement;

        switch (format) {
          case 'csv':
            table = this.exportService.importFromCSV(content);
            break;
          case 'json':
            table = this.exportService.importFromJSON(content);
            break;
          default:
            throw new Error(`Unsupported format: ${format}`);
        }

        // Вставляем таблицу в редактор
        if (this.editor) {
          const container = this.editor.getContainer();
          if (container) {
            container.appendChild(table);
          }
        }
      } catch (error) {
        console.error('Import failed:', error);
      }
    };
    reader.readAsText(file);
  }

  undo(): void {
    // Отмена импорта не требуется
  }
}
