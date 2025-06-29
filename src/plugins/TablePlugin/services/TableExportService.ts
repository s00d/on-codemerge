export interface ExportOptions {
  format: 'csv' | 'json' | 'html' | 'excel';
  includeHeaders?: boolean;
  delimiter?: string;
  encoding?: string;
}

export interface ImportOptions {
  format: 'csv' | 'json' | 'html';
  delimiter?: string;
  hasHeaders?: boolean;
}

export class TableExportService {
  /**
   * Экспорт таблицы в CSV формат
   */
  public exportToCSV(table: HTMLElement, options: ExportOptions = { format: 'csv' }): string {
    const rows = Array.from(table.querySelectorAll('.table-header-row, .table-row'));
    const delimiter = options.delimiter || ',';
    const includeHeaders = options.includeHeaders !== false;

    const csvRows: string[] = [];

    rows.forEach((row, rowIndex) => {
      // Пропускаем заголовки если не нужно их включать
      if (!includeHeaders && rowIndex === 0 && table.querySelector('.table-header-row')) {
        return;
      }

      const cells = Array.from(row.querySelectorAll('.table-header-cell, .table-cell'));
      const csvCells = cells.map((cell) => {
        let content = cell.textContent || '';

        // Экранируем кавычки и оборачиваем в кавычки если есть запятые или переносы строк
        if (content.includes(delimiter) || content.includes('"') || content.includes('\n')) {
          content = content.replace(/"/g, '""');
          content = `"${content}"`;
        }

        return content;
      });

      csvRows.push(csvCells.join(delimiter));
    });

    return csvRows.join('\n');
  }

  /**
   * Экспорт таблицы в JSON формат
   */
  public exportToJSON(table: HTMLElement, options: ExportOptions = { format: 'json' }): string {
    const includeHeaders = options.includeHeaders !== false;
    const headers: string[] = [];
    const data: Record<string, string>[] = [];

    // Получаем заголовки
    if (includeHeaders && table.querySelector('.table-header-row')) {
      const headerRow = table.querySelector('.table-header-row') as HTMLElement;
      if (headerRow) {
        const headerCells = headerRow.querySelectorAll('.table-header-cell');
        headers.push(...Array.from(headerCells).map((cell) => cell.textContent || ''));
      }
    }

    // Получаем данные
    const dataRows = table.querySelectorAll('.table-row');
    dataRows.forEach((row) => {
      const cells = Array.from(row.querySelectorAll('.table-cell'));
      const rowData: Record<string, string> = {};

      cells.forEach((cell, index) => {
        const key = headers[index] || `column_${index + 1}`;
        rowData[key] = cell.textContent || '';
      });

      data.push(rowData);
    });

    return JSON.stringify(data, null, 2);
  }

  /**
   * Экспорт таблицы в HTML формат
   */
  public exportToHTML(table: HTMLElement, _options: ExportOptions = { format: 'html' }): string {
    const clonedTable = table.cloneNode(true) as HTMLElement;

    // Добавляем базовые стили для экспорта
    clonedTable.style.display = 'table';
    clonedTable.style.borderCollapse = 'collapse';
    clonedTable.style.width = '100%';
    clonedTable.style.border = '1px solid #ddd';

    // Применяем стили к ячейкам
    const cells = clonedTable.querySelectorAll('.table-cell, .table-header-cell');
    cells.forEach((cell) => {
      if (cell instanceof HTMLElement) {
        cell.style.display = 'table-cell';
        cell.style.border = '1px solid #ddd';
        cell.style.padding = '8px';
        cell.style.textAlign = 'left';
      }
    });

    // Применяем стили к заголовкам
    const headers = clonedTable.querySelectorAll('.table-header-cell');
    headers.forEach((header) => {
      if (header instanceof HTMLElement) {
        header.style.backgroundColor = '#f2f2f2';
        header.style.fontWeight = 'bold';
      }
    });

    return clonedTable.outerHTML;
  }

  /**
   * Экспорт таблицы в Excel-совместимый формат (HTML с расширенными стилями)
   */
  public exportToExcel(table: HTMLElement, _options: ExportOptions = { format: 'excel' }): string {
    const clonedTable = table.cloneNode(true) as HTMLElement;

    // Создаем HTML документ с Excel-совместимыми стилями
    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="UTF-8">
          <style>
            table { border-collapse: collapse; width: 100%; }
            td, th { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .number { mso-number-format: "0.00"; }
            .date { mso-number-format: "dd/mm/yyyy"; }
          </style>
        </head>
        <body>
          ${clonedTable.outerHTML}
        </body>
      </html>
    `;

    return html;
  }

  /**
   * Импорт CSV в таблицу
   */
  public importFromCSV(csvData: string, options: ImportOptions = { format: 'csv' }): HTMLElement {
    const table = document.createElement('div');
    table.className = 'html-editor-table table-modern';

    const delimiter = options.delimiter || ',';
    const hasHeaders = options.hasHeaders !== false;

    const rows = csvData.trim().split('\n');

    rows.forEach((row, rowIndex) => {
      const tr = document.createElement('div');
      tr.className = rowIndex === 0 && hasHeaders ? 'table-header-row' : 'table-row';

      // Парсим CSV строку с учетом кавычек
      const cells = this.parseCSVRow(row, delimiter);

      cells.forEach((cellContent) => {
        const cell = document.createElement('div');
        cell.className = rowIndex === 0 && hasHeaders ? 'table-header-cell' : 'table-cell';
        cell.textContent = cellContent;
        cell.contentEditable = 'true';
        tr.appendChild(cell);
      });

      table.appendChild(tr);
    });

    return table;
  }

  /**
   * Импорт JSON в таблицу
   */
  public importFromJSON(
    jsonData: string,
    _options: ImportOptions = { format: 'json' }
  ): HTMLElement {
    const table = document.createElement('div');
    table.className = 'html-editor-table table-modern';

    try {
      const data = JSON.parse(jsonData);

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Invalid JSON data format');
      }

      const headers = Object.keys(data[0]);

      // Создаем заголовки
      const headerRow = document.createElement('div');
      headerRow.className = 'table-header-row';

      headers.forEach((header) => {
        const th = document.createElement('div');
        th.className = 'table-header-cell';
        th.textContent = header;
        headerRow.appendChild(th);
      });

      table.appendChild(headerRow);

      // Создаем строки данных
      data.forEach((rowData) => {
        const tr = document.createElement('div');
        tr.className = 'table-row';

        headers.forEach((header) => {
          const td = document.createElement('div');
          td.className = 'table-cell';
          td.textContent = rowData[header] || '';
          td.contentEditable = 'true';
          tr.appendChild(td);
        });

        table.appendChild(tr);
      });
    } catch (error) {
      console.error('Error parsing JSON:', error);
      throw new Error('Invalid JSON format');
    }

    return table;
  }

  /**
   * Скачивание файла
   */
  public downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  /**
   * Парсинг CSV строки с учетом кавычек
   */
  private parseCSVRow(row: string, delimiter: string): string[] {
    const cells: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];

      if (char === '"') {
        if (inQuotes && row[i + 1] === '"') {
          // Экранированная кавычка
          currentCell += '"';
          i++; // Пропускаем следующую кавычку
        } else {
          // Начало или конец кавычек
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        // Конец ячейки
        cells.push(currentCell);
        currentCell = '';
      } else {
        // Обычный символ
        currentCell += char;
      }
    }

    // Добавляем последнюю ячейку
    cells.push(currentCell);

    return cells;
  }

  /**
   * Получение MIME типа для формата
   */
  public getMimeType(format: string): string {
    switch (format) {
      case 'csv':
        return 'text/csv';
      case 'json':
        return 'application/json';
      case 'html':
        return 'text/html';
      case 'excel':
        return 'application/vnd.ms-excel';
      default:
        return 'text/plain';
    }
  }

  /**
   * Получение расширения файла для формата
   */
  public getFileExtension(format: string): string {
    switch (format) {
      case 'csv':
        return '.csv';
      case 'json':
        return '.json';
      case 'html':
        return '.html';
      case 'excel':
        return '.xls';
      default:
        return '.txt';
    }
  }
}
