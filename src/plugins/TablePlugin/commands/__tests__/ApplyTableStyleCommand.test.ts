import { ApplyTableStyleCommand } from '../ApplyTableStyleCommand';
import type { HTMLEditor } from '../../../../core/HTMLEditor';

describe('ApplyTableStyleCommand', () => {
  let editor: HTMLEditor;
  let table: HTMLElement;

  beforeEach(() => {
    // Создаем мок для HTMLEditor
    editor = {} as HTMLEditor;

    // Создаем тестовую таблицу
    table = document.createElement('div');
    table.className = 'html-editor-table';
    table.style.width = '800px';
    table.style.borderStyle = 'solid';
    table.style.borderWidth = '2px';
    table.style.borderColor = '#000';

    // Добавляем заголовок
    const header = document.createElement('div');
    header.className = 'table-header-cell';
    header.style.backgroundColor = '#f0f0f0';
    header.style.color = '#333';
    table.appendChild(header);
  });

  test('should apply table styles correctly', () => {
    const options = {
      style: 'modern',
      theme: 'blue',
      width: '100%',
      cellPadding: '12px',
      borderStyle: 'dashed',
      borderWidth: '1px',
      borderColor: '#ccc',
      headerBackground: '#007bff',
      headerColor: '#fff',
      zebraStripe: true,
      hoverEffect: true,
    };

    const command = new ApplyTableStyleCommand(editor, table, options);
    command.execute();

    expect(table.classList.contains('table-modern')).toBe(true);
    expect(table.classList.contains('theme-blue')).toBe(true);
    expect(table.classList.contains('table-striped')).toBe(true);
    expect(table.classList.contains('table-hover')).toBe(true);
    expect(table.style.width).toBe('100%');
    expect(table.style.getPropertyValue('--cell-padding')).toBe('12px');
    expect(table.style.borderStyle).toBe('dashed');
    expect(table.style.borderWidth).toBe('1px');
    expect(table.style.borderColor).toBe('#ccc');
  });

  test('should apply header styles correctly', () => {
    const options = {
      headerBackground: '#28a745',
      headerColor: '#fff',
    };

    const command = new ApplyTableStyleCommand(editor, table, options);
    command.execute();

    const header = table.querySelector('.table-header-cell') as HTMLElement;
    expect(header.style.backgroundColor).toBe('#28a745');
    expect(header.style.color).toBe('#fff');
  });

  test('should undo changes correctly', () => {
    const originalClassName = 'html-editor-table original-class';
    const originalWidth = '800px';
    const originalBorderStyle = 'solid';

    table.className = originalClassName;
    table.style.width = originalWidth;
    table.style.borderStyle = originalBorderStyle;

    const options = {
      style: 'modern',
      theme: 'blue',
      width: '100%',
      borderStyle: 'dashed',
    };

    const command = new ApplyTableStyleCommand(editor, table, options);
    command.execute();
    command.undo();

    expect(table.className).toBe(originalClassName);
    expect(table.style.width).toBe(originalWidth);
    expect(table.style.borderStyle).toBe(originalBorderStyle);
  });

  test('should handle empty options gracefully', () => {
    const options = {};

    const command = new ApplyTableStyleCommand(editor, table, options);
    command.execute();

    expect(table.className).toBe('html-editor-table');
    expect(table.style.width).toBe('');
  });
});
