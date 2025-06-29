import type { Command } from '../../../core/commands/Command';
import type { HTMLEditor } from '../../../core/HTMLEditor';
import { Table } from '../components/Table';

export interface ImportTableFromHTMLCommandOptions {
  url: string;
  selector?: string;
  tableId?: string;
}

export class ImportTableFromHTMLCommand implements Command {
  private options: ImportTableFromHTMLCommandOptions;
  private range: Range;

  constructor(_editor: HTMLEditor, options: ImportTableFromHTMLCommandOptions, range: Range) {
    this.options = options;
    this.range = range.cloneRange();
  }

  execute(): void {
    const tableId = this.options.tableId || `imported-table-${Date.now()}`;

    // Создаем временную таблицу с индикатором загрузки
    const table = new Table({ hasHeader: false, rows: 1, cols: 1 });
    const tableElement = table.getElement();
    tableElement.id = tableId;
    tableElement.classList.add('imported-table');
    tableElement.setAttribute('data-import-url', this.options.url);
    if (this.options.selector) {
      tableElement.setAttribute('data-import-selector', this.options.selector);
    }

    // Плейсхолдер загрузки
    const cell = tableElement.querySelector('.table-cell');
    if (cell) cell.textContent = 'Импорт таблицы...';

    // Вставляем таблицу
    this.range.deleteContents();
    const fragment = document.createDocumentFragment();
    fragment.appendChild(tableElement);

    // Генерируем скрипт для импорта
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.textContent = this.generateImportScript(tableId, this.options);
    fragment.appendChild(script);

    this.range.insertNode(fragment);
    table.focusFirstCell();
  }

  private generateImportScript(tableId: string, _options: ImportTableFromHTMLCommandOptions): string {
    return `
(function() {
  var table = document.getElementById('${tableId}');
  if (!table) return;
  
  var url = table.getAttribute('data-import-url');
  var selector = table.getAttribute('data-import-selector') || 'table';
  
  function showLoading() {
    table.innerHTML = '<div class="table-row"><div class="table-cell" style="text-align:center;padding:20px;">Импорт таблицы...</div></div>';
  }
  
  function showError(msg) {
    table.innerHTML = '<div class="table-row"><div class="table-cell" style="text-align:center;padding:20px;color:#e74c3c;">Ошибка импорта: ' + msg + '</div></div>';
  }
  
  function parseHTMLTable(htmlTable) {
    var rows = [];
    var headerRow = null;
    
    // Обрабатываем заголовки
    var headers = htmlTable.querySelectorAll('thead tr, tr:first-child');
    if (headers.length > 0) {
      var headerCells = headers[0].querySelectorAll('th, td');
      headerRow = Array.from(headerCells).map(function(cell) {
        return cell.textContent.trim();
      });
    }
    
    // Обрабатываем строки данных
    var dataRows = htmlTable.querySelectorAll('tbody tr, tr:not(:first-child)');
    if (dataRows.length === 0) {
      dataRows = htmlTable.querySelectorAll('tr');
    }
    
    dataRows.forEach(function(row) {
      var cells = row.querySelectorAll('td, th');
      var rowData = Array.from(cells).map(function(cell) {
        return cell.textContent.trim();
      });
      if (rowData.length > 0) {
        rows.push(rowData);
      }
    });
    
    return { headers: headerRow, rows: rows };
  }
  
  function renderTable(data) {
    table.innerHTML = '';
    
    // Добавляем заголовки если есть
    if (data.headers && data.headers.length > 0) {
      var headerRow = document.createElement('div');
      headerRow.className = 'table-header-row';
      data.headers.forEach(function(header) {
        var cell = document.createElement('div');
        cell.className = 'table-header-cell';
        cell.textContent = header;
        headerRow.appendChild(cell);
      });
      table.appendChild(headerRow);
    }
    
    // Добавляем строки данных
    data.rows.forEach(function(row) {
      var rowDiv = document.createElement('div');
      rowDiv.className = 'table-row';
      row.forEach(function(cellData) {
        var cell = document.createElement('div');
        cell.className = 'table-cell';
        cell.textContent = cellData;
        rowDiv.appendChild(cell);
      });
      table.appendChild(rowDiv);
    });
    
    // Если нет данных, показываем сообщение
    if (data.rows.length === 0) {
      table.innerHTML = '<div class="table-row"><div class="table-cell">Таблица не найдена</div></div>';
    }
  }
  
  showLoading();
  
  // Используем прокси для обхода CORS (если доступен)
  var proxyUrl = 'https://api.allorigins.win/raw?url=';
  
  fetch(proxyUrl + encodeURIComponent(url))
    .then(function(resp) {
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      return resp.text();
    })
    .then(function(html) {
      // Создаем временный DOM для парсинга HTML
      var parser = new DOMParser();
      var doc = parser.parseFromString(html, 'text/html');
      
      // Ищем таблицу по селектору
      var htmlTable = doc.querySelector(selector);
      if (!htmlTable) {
        throw new Error('Таблица не найдена по селектору: ' + selector);
      }
      
      var data = parseHTMLTable(htmlTable);
      renderTable(data);
    })
    .catch(function(e) {
      showError(e.message);
    });
})();
`;
  }
}
