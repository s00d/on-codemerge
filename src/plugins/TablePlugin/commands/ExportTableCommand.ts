import type { HTMLEditor } from '../../../core/HTMLEditor';
import type { Command } from '../../../core/commands/Command';
import { PopupManager } from '../../../core/ui/PopupManager';
import { TableExportService } from '../services/TableExportService';

export class ExportTableCommand implements Command {
  private editor: HTMLEditor;
  private table: HTMLElement;
  private exportService: TableExportService;

  constructor(editor: HTMLEditor, table: HTMLElement) {
    this.editor = editor;
    this.table = table;
    this.exportService = new TableExportService();
  }

  execute(): void {
    // Показываем диалог экспорта напрямую
    this.showExportDialog();
  }

  private showExportDialog(): void {
    if (!this.editor) return;

    const exportPopup: PopupManager = new PopupManager(this.editor, {
      title: this.editor.t('Export Table'),
      className: 'export-dialog-popup',
      closeOnClickOutside: true,
      buttons: [
        {
          label: this.editor.t('Cancel'),
          variant: 'secondary',
          onClick: () => exportPopup.hide(),
        },
      ],
      items: [
        {
          type: 'custom',
          id: 'export-options',
          content: () => {
            const container = document.createElement('div');
            container.className = 'p-4 space-y-4';

            // Формат экспорта
            const formatSelect = document.createElement('select');
            formatSelect.className = 'w-full p-2 border border-gray-300 rounded-md';

            const formats = [
              { value: 'csv', label: 'CSV' },
              { value: 'json', label: 'JSON' },
              { value: 'html', label: 'HTML' },
              { value: 'excel', label: 'Excel' },
            ];

            formats.forEach((format) => {
              const option = document.createElement('option');
              option.value = format.value;
              option.textContent = format.label;
              formatSelect.appendChild(option);
            });

            container.appendChild(formatSelect);

            // Кнопка экспорта
            const exportButton = document.createElement('button');
            exportButton.className =
              'w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600';
            exportButton.textContent = this.editor.t('Export');
            exportButton.onclick = () => {
              this.performExport(formatSelect.value);
              exportPopup.hide();
            };

            container.appendChild(exportButton);
            return container;
          },
        },
      ],
    });

    exportPopup.show();
  }

  private performExport(format: string): void {
    try {
      let content: string;
      let mimeType: string;

      switch (format) {
        case 'csv':
          content = this.exportService.exportToCSV(this.table);
          mimeType = 'text/csv';
          break;
        case 'json':
          content = this.exportService.exportToJSON(this.table);
          mimeType = 'application/json';
          break;
        case 'html':
          content = this.exportService.exportToHTML(this.table);
          mimeType = 'text/html';
          break;
        case 'excel':
          content = this.exportService.exportToExcel(this.table);
          mimeType = 'application/vnd.ms-excel';
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      // Создаем и скачиваем файл
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `table.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  }

  undo(): void {
    // Отмена экспорта не требуется
  }
}
