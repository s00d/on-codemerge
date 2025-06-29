import { PopupManager } from '../../../core/ui/PopupManager';
import type { HTMLEditor } from '../../../core/HTMLEditor';
import {
  InsertLazyTableCommand,
  type InsertLazyTableCommandOptions,
} from '../commands/InsertLazyTableCommand';
import {
  ImportTableFromHTMLCommand,
  type ImportTableFromHTMLCommandOptions,
} from '../commands/ImportTableFromHTMLCommand';

export interface LazyTableModalOptions extends Partial<InsertLazyTableCommandOptions> {
  isEdit?: boolean;
  isFillMode?: boolean;
  onSave?: (options: InsertLazyTableCommandOptions | ImportTableFromHTMLCommandOptions) => void;
}

export class LazyTableModal {
  private popup: PopupManager | null = null;
  private editor: HTMLEditor;
  private range: Range;
  private options: LazyTableModalOptions;

  constructor(editor: HTMLEditor, range: Range, options: LazyTableModalOptions = {}) {
    this.editor = editor;
    this.range = range.cloneRange();
    this.options = options;
  }

  show(): void {
    let title = this.editor.t('Insert Lazy Table');
    if (this.options.isEdit) {
      title = this.editor.t('Edit Lazy Table');
    } else if (this.options.isFillMode) {
      title = this.editor.t('Fill Table with Data');
    }

    this.popup = new PopupManager(this.editor, {
      title: title,
      className: 'lazy-table-modal',
      closeOnClickOutside: true,
      items: [
        {
          type: 'list',
          id: 'import-type',
          label: this.editor.t('Import Type'),
          options: ['json', 'csv', 'html'],
          value: this.options.format || 'json',
          onChange: (value) => this.onImportTypeChange(value as string),
        },
        {
          type: 'input',
          id: 'url',
          label: this.editor.t('Data URL'),
          placeholder: 'https://example.com/data.json',
          value: this.options.url || '',
        },
        {
          type: 'input',
          id: 'selector',
          label: this.editor.t('CSS Selector (for HTML)'),
          placeholder: 'table, .my-table, #data-table',
          value: '',
          className: 'html-only-field',
        },
        {
          type: 'checkbox',
          id: 'hasHeaders',
          label: this.editor.t('First row contains headers'),
          value: this.options.hasHeaders !== false,
          className: 'json-csv-only-field',
        },
        {
          type: 'input',
          id: 'delimiter',
          label: this.editor.t('CSV Delimiter'),
          placeholder: ',',
          value: this.options.delimiter || ',',
          className: 'csv-only-field',
        },
        {
          type: 'input',
          id: 'tableId',
          label: this.editor.t('Table ID (optional)'),
          placeholder: 'my-data-table',
          value: this.options.tableId || '',
        },
      ],
      buttons: [
        {
          label: this.editor.t('Cancel'),
          variant: 'secondary',
          onClick: () => this.popup?.hide(),
        },
        {
          label: this.options.isEdit
            ? this.editor.t('Update Table')
            : this.options.isFillMode
              ? this.editor.t('Fill Table')
              : this.editor.t('Insert Table'),
          variant: 'primary',
          onClick: () => this.insertTable(),
        },
      ],
    });

    // Инициализируем видимость полей
    this.onImportTypeChange(this.options.format || 'json');
    this.popup.show();
  }

  private onImportTypeChange(importType: string): void {
    if (!this.popup) return;

    // Скрываем/показываем поля в зависимости от типа импорта
    const htmlOnlyFields = this.popup.getElement().querySelectorAll('.html-only-field');
    const jsonCsvOnlyFields = this.popup.getElement().querySelectorAll('.json-csv-only-field');
    const csvOnlyFields = this.popup.getElement().querySelectorAll('.csv-only-field');

    htmlOnlyFields.forEach((field) => {
      const item = field.closest('.popup-item');
      if (item) {
        (item as HTMLElement).style.display = importType === 'html' ? 'block' : 'none';
      }
    });

    jsonCsvOnlyFields.forEach((field) => {
      const item = field.closest('.popup-item');
      if (item) {
        (item as HTMLElement).style.display =
          importType === 'json' || importType === 'csv' ? 'block' : 'none';
      }
    });

    csvOnlyFields.forEach((field) => {
      const item = field.closest('.popup-item');
      if (item) {
        (item as HTMLElement).style.display = importType === 'csv' ? 'block' : 'none';
      }
    });
  }

  private insertTable(): void {
    if (!this.popup) return;

    const importType = this.popup.getValue('import-type') as string;
    const url = this.popup.getValue('url') as string;

    if (!url) {
      alert(this.editor.t('Please enter a valid URL'));
      return;
    }

    if (importType === 'html') {
      // Импорт из HTML
      const options: ImportTableFromHTMLCommandOptions = {
        url: url,
        selector: this.popup.getValue('selector') as string,
        tableId: this.popup.getValue('tableId') as string,
      };

      if (this.options.onSave) {
        this.options.onSave(options);
      } else {
        const command = new ImportTableFromHTMLCommand(this.editor, options, this.range);
        command.execute();
      }
    } else {
      // Импорт JSON/CSV
      const options: InsertLazyTableCommandOptions = {
        url: url,
        format: importType as 'json' | 'csv',
        hasHeaders: this.popup.getValue('hasHeaders') as boolean,
        delimiter: this.popup.getValue('delimiter') as string,
        tableId: this.popup.getValue('tableId') as string,
      };

      if (this.options.onSave) {
        this.options.onSave(options);
      } else {
        const command = new InsertLazyTableCommand(this.editor, options, this.range);
        command.execute();
      }
    }

    this.popup.hide();
  }
}
