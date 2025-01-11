import { createButton, createContainer } from '../../../utils/helpers';

type InsertSymbolCallback = (symbol: string) => void;

export class MathToolbar {
  private container: HTMLElement;
  private onInsertSymbol: InsertSymbolCallback;
  private buttons: HTMLButtonElement[] = [];

  constructor(onInsertSymbol: InsertSymbolCallback) {
    this.container = createContainer('math-toolbar flex gap-2 mb-4');
    this.onInsertSymbol = onInsertSymbol;
    this.initialize();
  }

  private initialize(): void {
    const operations = [
      { label: '+', symbol: '+' },
      { label: '-', symbol: '-' },
      { label: '×', symbol: '\\times' },
      { label: '÷', symbol: '\\div' },
      { label: '√', symbol: '\\sqrt{}' },
      { label: '^', symbol: '^{}' },
      { label: '∫', symbol: '\\int_{}^{}' },
      { label: '∑', symbol: '\\sum_{}^{}' },
      { label: 'sin', symbol: '\\sin()' },
      { label: 'cos', symbol: '\\cos()' },
      { label: 'tan', symbol: '\\tan()' },
      { label: 'lim', symbol: '\\lim_{}' },
      { label: 'frac', symbol: '\\frac{}{}' },
      { label: '(', symbol: '\\left(\\right)' },
      { label: ')', symbol: '\\right)' },
    ];

    operations.forEach((op) => {
      const button = createButton(op.label, () => this.onInsertSymbol(op.symbol));
      button.className =
        'math-toolbar-button px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600';
      this.container.appendChild(button);

      this.buttons.push(button);
    });
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  public destroy(): void {
    // Удаляем все кнопки из DOM
    this.buttons.forEach((button) => button.remove());
    this.buttons = []; // Очищаем массив кнопок

    // Очищаем контейнер
    this.container.innerHTML = '';
  }
}
