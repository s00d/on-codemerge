import type { Command } from '../../../core/commands/Command';
import type { HTMLEditor } from '../../../core/HTMLEditor';
import { Table } from '../components/Table';

export interface InsertLazyTableCommandOptions {
  url: string;
  format: 'json' | 'csv';
  hasHeaders?: boolean;
  delimiter?: string;
  tableId?: string;
}

export class InsertLazyTableCommand implements Command {
  private options: InsertLazyTableCommandOptions;
  private range: Range;

  constructor(_editor: HTMLEditor, options: InsertLazyTableCommandOptions, range: Range) {
    this.options = options;
    this.range = range.cloneRange();
  }

  execute(): void {
    const tableId = this.options.tableId || `lazy-table-${Date.now()}`;
    // Вставляем обычную таблицу (1x1, без заголовка)
    const table = new Table({ hasHeader: false, rows: 1, cols: 1 });
    const tableElement = table.getElement();
    tableElement.id = tableId;
    tableElement.setAttribute('data-lazy-url', this.options.url);
    tableElement.setAttribute('data-lazy-format', this.options.format);
    if (this.options.delimiter)
      tableElement.setAttribute('data-lazy-delimiter', this.options.delimiter);
    if (this.options.hasHeaders !== undefined)
      tableElement.setAttribute('data-lazy-headers', String(this.options.hasHeaders));
    tableElement.classList.add('lazy-table');
    // Плейсхолдер
    const cell = tableElement.querySelector('.table-cell');
    if (cell) cell.textContent = 'Загрузка...';
    // Вставляем в документ
    this.range.deleteContents();
    // Вставляем таблицу и скрипт в один fragment
    const fragment = document.createDocumentFragment();
    fragment.appendChild(tableElement);
    // Генерируем автономный скрипт
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.textContent = this.generateLazyScript(tableId, this.options);
    fragment.appendChild(script);
    this.range.insertNode(fragment);
    table.focusFirstCell();
  }

  private generateLazyScript(tableId: string, _options: InsertLazyTableCommandOptions): string {
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
