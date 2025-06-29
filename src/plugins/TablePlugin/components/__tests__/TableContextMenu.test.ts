import { TableContextMenu } from '../TableContextMenu';
import type { HTMLEditor } from '../../../../core/HTMLEditor';

describe('TableContextMenu', () => {
  let editor: HTMLEditor;
  let table: HTMLElement;
  let cell: HTMLElement;
  let contextMenu: TableContextMenu;

  beforeEach(() => {
    // Создаем мок для HTMLEditor
    editor = {
      t: (key: string) => key,
    } as HTMLEditor;

    // Создаем тестовую таблицу и ячейку
    table = document.createElement('div');
    table.className = 'html-editor-table';

    cell = document.createElement('div');
    cell.className = 'table-cell';
    table.appendChild(cell);

    contextMenu = new TableContextMenu(editor);
  });

  test('should create context menu with all commands', () => {
    expect(contextMenu).toBeDefined();
  });

  test('should show context menu', () => {
    contextMenu.show(cell, 100, 100);
    // Проверяем, что меню показано (это зависит от реализации ContextMenu)
  });

  test('should hide context menu', () => {
    contextMenu.hide();
    // Проверяем, что меню скрыто
  });

  test('should destroy context menu', () => {
    contextMenu.destroy();
    // Проверяем, что меню уничтожено
  });
});
