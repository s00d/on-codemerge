import { ApplyTableResponsiveCommand } from '../ApplyTableResponsiveCommand';
import type { HTMLEditor } from '../../../../core/HTMLEditor';

describe('ApplyTableResponsiveCommand', () => {
  let editor: HTMLEditor;
  let table: HTMLElement;

  beforeEach(() => {
    // Создаем мок для HTMLEditor
    editor = {} as HTMLEditor;

    // Создаем тестовую таблицу
    table = document.createElement('div');
    table.className = 'html-editor-table';
    table.style.width = '800px';
  });

  test('should apply responsive classes correctly', () => {
    const options = {
      breakpoint: 768,
      enableScroll: true,
      enableTouch: true,
      enableCards: false,
    };

    const command = new ApplyTableResponsiveCommand(editor, table, options);
    command.execute();

    expect(table.classList.contains('breakpoint-768')).toBe(true);
    expect(table.classList.contains('responsive-table')).toBe(true);
    expect(table.classList.contains('responsive-table--scroll')).toBe(true);
    expect(table.classList.contains('responsive-table--touch')).toBe(true);
    expect(table.classList.contains('responsive-table--cards')).toBe(false);
    expect(table.style.width).toBe('');
  });

  test('should set CSS variables correctly', () => {
    const options = {
      breakpoint: 1024,
      enableScroll: false,
      enableTouch: true,
      enableCards: true,
    };

    const command = new ApplyTableResponsiveCommand(editor, table, options);
    command.execute();

    expect(table.style.getPropertyValue('--responsive-breakpoint')).toBe('1024px');
    expect(table.style.getPropertyValue('--responsive-enable-scroll')).toBe('0');
    expect(table.style.getPropertyValue('--responsive-enable-touch')).toBe('1');
    expect(table.style.getPropertyValue('--responsive-enable-cards')).toBe('1');
  });

  test('should undo changes correctly', () => {
    const originalClassName = 'html-editor-table test-class';
    const originalWidth = '800px';
    table.className = originalClassName;
    table.style.width = originalWidth;

    const options = {
      breakpoint: 768,
      enableScroll: true,
      enableTouch: true,
      enableCards: true,
    };

    const command = new ApplyTableResponsiveCommand(editor, table, options);
    command.execute();
    command.undo();

    expect(table.className).toBe(originalClassName);
    expect(table.style.width).toBe(originalWidth);
    expect(table.style.getPropertyValue('--responsive-breakpoint')).toBe('');
  });
});
