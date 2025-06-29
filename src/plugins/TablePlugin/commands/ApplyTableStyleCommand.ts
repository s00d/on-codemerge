import type { HTMLEditor } from '../../../core/HTMLEditor';
import type { Command } from '../../../core/commands/Command';

export interface TableStyleOptions {
  style?: string;
  theme?: string;
  width?: string;
  cellPadding?: string;
  borderStyle?: string;
  borderWidth?: string;
  borderColor?: string;
  headerBackground?: string;
  headerColor?: string;
  zebraStripe?: boolean;
  hoverEffect?: boolean;
}

interface TableStylePreviousState {
  className: string;
  styles: Map<string, string>;
  headerStyles: Map<string, Array<[string, string]>>;
}

export class ApplyTableStyleCommand implements Command {
  private table: HTMLElement;
  private options: TableStyleOptions;
  private previousState: TableStylePreviousState;

  constructor(_editor: HTMLEditor, table: HTMLElement, options: TableStyleOptions) {
    this.table = table;
    this.options = options;

    // Сохраняем предыдущее состояние для отмены
    this.previousState = {
      className: this.table.className,
      styles: new Map(),
      headerStyles: new Map(),
    };

    // Сохраняем текущие стили
    const currentStyles = [
      'width',
      '--cell-padding',
      'border-style',
      'border-width',
      'border-color',
    ];
    currentStyles.forEach((style) => {
      const value = this.table.style.getPropertyValue(style);
      if (value) {
        this.previousState.styles.set(style, value);
      }
    });

    // Сохраняем стили заголовков
    const headers = this.table.querySelectorAll('.table-header-cell');
    headers.forEach((header, index) => {
      const headerElement = header as HTMLElement;
      const headerStyles: Array<[string, string]> = [];
      ['backgroundColor', 'color'].forEach((style) => {
        const value = headerElement.style[style as any];
        if (value) {
          headerStyles.push([style, value]);
        }
      });
      this.previousState.headerStyles.set(index.toString(), headerStyles);
    });
  }

  execute(): void {
    // Очищаем все классы и стили
    this.table.className = 'html-editor-table';
    this.table.style.removeProperty('width');
    this.table.style.removeProperty('--cell-padding');
    this.table.style.removeProperty('border-style');
    this.table.style.removeProperty('border-width');
    this.table.style.removeProperty('border-color');

    // Применяем базовые стили
    if (this.options.style) {
      this.table.classList.add(`table-${this.options.style}`);
    }
    if (this.options.theme) {
      this.table.classList.add(`theme-${this.options.theme}`);
    }
    if (this.options.zebraStripe) {
      this.table.classList.add('table-striped');
    }
    if (this.options.hoverEffect) {
      this.table.classList.add('table-hover');
    }

    // Применяем размеры
    if (this.options.width) {
      this.table.style.width = this.options.width;
    }
    if (this.options.cellPadding) {
      this.table.style.setProperty('--cell-padding', this.options.cellPadding);
    }

    // Применяем границы
    if (this.options.borderStyle) {
      this.table.style.borderStyle = this.options.borderStyle;
    }
    if (this.options.borderWidth) {
      this.table.style.borderWidth = this.options.borderWidth;
    }
    if (this.options.borderColor) {
      this.table.style.borderColor = this.options.borderColor;
    }

    // Apply header styles
    const headers = this.table.querySelectorAll('.table-header-cell');
    headers.forEach((header) => {
      if (this.options.headerBackground) {
        (header as HTMLElement).style.backgroundColor = this.options.headerBackground;
      }
      if (this.options.headerColor) {
        (header as HTMLElement).style.color = this.options.headerColor;
      }
    });
  }

  undo(): void {
    // Восстанавливаем предыдущее состояние
    this.table.className = this.previousState.className;

    // Восстанавливаем стили
    this.previousState.styles.forEach((value, style) => {
      this.table.style.setProperty(style, value);
    });

    // Восстанавливаем стили заголовков
    const headers = this.table.querySelectorAll('.table-header-cell');
    headers.forEach((header, index) => {
      const headerStylesData = this.previousState.headerStyles.get(index.toString());
      if (headerStylesData) {
        const headerElement = header as HTMLElement;
        headerStylesData.forEach(([style, value]) => {
          headerElement.style.setProperty(style, value);
        });
      }
    });
  }
}
