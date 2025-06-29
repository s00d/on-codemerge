import type { Command } from '../../../core/commands/Command';
import type { HTMLEditor } from '../../../core/HTMLEditor';
import { LazyTableModal } from '../components/LazyTableModal';

export interface EditLazyTableCommandOptions {
  url?: string;
  format?: 'json' | 'csv';
  hasHeaders?: boolean;
  delimiter?: string;
  tableId?: string;
}

export class EditLazyTableCommand implements Command {
  private editor: HTMLEditor;
  private table: HTMLElement;

  constructor(editor: HTMLEditor, table: HTMLElement, _options: EditLazyTableCommandOptions = {}) {
    this.editor = editor;
    this.table = table;
  }

  execute(): void {
    // Получаем текущие параметры из таблицы
    const currentOptions = {
      url: this.table.getAttribute('data-lazy-url') || '',
      format: (this.table.getAttribute('data-lazy-format') as 'json' | 'csv') || 'json',
      hasHeaders: this.table.getAttribute('data-lazy-headers') !== 'false',
      delimiter: this.table.getAttribute('data-lazy-delimiter') || ',',
      tableId: this.table.id || '',
      isEdit: true,
      onSave: (newOptions: any) => this.updateTable(newOptions),
    };

    // Создаем модальное окно для редактирования
    const modal = new LazyTableModal(this.editor, document.createRange(), currentOptions);
    modal.show();
  }

  private updateTable(options: EditLazyTableCommandOptions): void {
    // Обновляем атрибуты таблицы
    if (options.url) this.table.setAttribute('data-lazy-url', options.url);
    if (options.format) this.table.setAttribute('data-lazy-format', options.format);
    if (options.delimiter) this.table.setAttribute('data-lazy-delimiter', options.delimiter);
    if (options.hasHeaders !== undefined) {
      this.table.setAttribute('data-lazy-headers', String(options.hasHeaders));
    }
    if (options.tableId) {
      this.table.id = options.tableId;
    }

    // Удаляем старый скрипт если есть
    const oldScript = this.table.nextElementSibling;
    if (oldScript && oldScript.tagName === 'SCRIPT') {
      oldScript.remove();
    }

    // Генерируем новый скрипт
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.textContent = this.generateLazyScript(this.table.id, {
      url: this.table.getAttribute('data-lazy-url') || '',
      format: (this.table.getAttribute('data-lazy-format') as 'json' | 'csv') || 'json',
      hasHeaders: this.table.getAttribute('data-lazy-headers') !== 'false',
      delimiter: this.table.getAttribute('data-lazy-delimiter') || ',',
    });

    // Вставляем новый скрипт после таблицы
    this.table.parentNode?.insertBefore(script, this.table.nextSibling);

    // Запускаем скрипт для загрузки новых данных
    setTimeout(() => {
      const scriptElement = document.createElement('script');
      scriptElement.textContent = script.textContent;
      document.head.appendChild(scriptElement);
      document.head.removeChild(scriptElement);
    }, 100);
  }

  private generateLazyScript(tableId: string, _options: EditLazyTableCommandOptions): string {
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
}
