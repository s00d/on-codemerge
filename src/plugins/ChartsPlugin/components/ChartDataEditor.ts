import type { ChartPoint } from '../types';
import { DataRow } from './DataRow';
import { getRandomColor } from '../utils/colors';
import type { ChartData } from '../types/ChartData.ts';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';
import { createButton, createContainer } from '../../../utils/helpers.ts';

export class ChartDataEditor {
  private container: HTMLElement;
  private editor: HTMLEditor;
  private data: ChartPoint[] = [];
  private onChange: (data: ChartPoint[]) => void;
  private requiresXY: boolean;
  private isScatter: boolean;
  private dataRows: HTMLDivElement | null = null;
  private addButton: HTMLButtonElement | null = null;

  constructor(
    editor: HTMLEditor,
    onChange: (data: ChartPoint[]) => void,
    requiresXY = false,
    isScatter = false
  ) {
    this.editor = editor;
    this.container = createContainer('chart-data-editor');
    this.onChange = onChange;
    this.requiresXY = requiresXY;
    this.isScatter = isScatter;
    this.initialize();
  }

  private initialize(): void {
    // Основной контейнер
    const mainContainer = createContainer('space-y-4');

    // Заголовок и кнопка добавления
    const header = createContainer('flex items-center justify-between mb-4');

    const title = createContainer(
      'text-sm font-medium text-gray-700',
      this.editor.t('Data Points')
    );

    this.addButton = createButton(this.editor.t('Add Point'), () => {
      this.addRow();
    });
    this.addButton.className =
      'add-row-btn px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600';

    header.appendChild(title);
    header.appendChild(this.addButton);

    // Сетка данных
    const dataGrid = createContainer('data-grid');

    // Заголовки столбцов
    const headerGrid = createContainer(`grid ${this.getHeaderGridCols()} gap-2 pb-2 border-b`);

    const labelHeader = createContainer(
      'text-sm font-medium text-gray-600',
      this.editor.t('Label')
    );

    headerGrid.appendChild(labelHeader);

    if (this.requiresXY) {
      const xHeader = createContainer('text-sm font-medium text-gray-600', this.editor.t('X'));
      const yHeader = createContainer('text-sm font-medium text-gray-600', this.editor.t('Y'));

      headerGrid.appendChild(xHeader);
      headerGrid.appendChild(yHeader);

      if (!this.isScatter) {
        const sizeHeader = createContainer(
          'text-sm font-medium text-gray-600',
          this.editor.t('Size')
        );
        const colorHeader = createContainer(
          'text-sm font-medium text-gray-600',
          this.editor.t('Color')
        );
        headerGrid.appendChild(sizeHeader);
        headerGrid.appendChild(colorHeader);
      }
    } else {
      const valueHeader = createContainer(
        'text-sm font-medium text-gray-600',
        this.editor.t('Value')
      );
      const colorHeader = createContainer(
        'text-sm font-medium text-gray-600',
        this.editor.t('Color')
      );
      headerGrid.appendChild(valueHeader);
      headerGrid.appendChild(colorHeader);
    }

    // Пустой элемент для выравнивания
    const emptyHeader = createContainer();
    headerGrid.appendChild(emptyHeader);

    // Контейнер для строк данных
    this.dataRows = createContainer('data-rows space-y-2 mt-2');

    // Сборка структуры
    dataGrid.appendChild(headerGrid);
    dataGrid.appendChild(this.dataRows);
    mainContainer.appendChild(header);
    mainContainer.appendChild(dataGrid);
    this.container.appendChild(mainContainer);

    // Добавление начальных строк
    this.addInitialRows();
  }

  private getHeaderGridCols(): string {
    if (this.requiresXY) {
      return this.isScatter
        ? 'grid-cols-[1fr,80px,80px,40px]'
        : 'grid-cols-[1fr,80px,80px,80px,40px,40px]';
    }
    return 'grid-cols-[1fr,120px,40px,40px]';
  }

  private addInitialRows(): void {
    const defaultData: Partial<ChartPoint>[] = [
      { label: 'Point 1', value: 10 },
      { label: 'Point 2', value: 20 },
      { label: 'Point 3', value: 15 },
    ];

    defaultData.forEach((data) => {
      if (this.requiresXY) {
        data.x = data.value;
        data.y = Math.random() * 30;
        if (!this.isScatter) {
          data.r = 5;
          data.color = getRandomColor();
        }
      }
      this.addRow(data);
    });
  }

  private addRow(data: Partial<ChartPoint> = {}): void {
    const row = new DataRow(
      data,
      this.requiresXY,
      this.isScatter,
      () => this.updateData(),
      () => {
        row.element.remove();
        this.updateData();
      }
    );

    this.dataRows?.appendChild(row.element);
    this.updateData();
  }

  private updateData(): void {
    if (!this.dataRows) return;

    const rows = Array.from(this.dataRows?.querySelectorAll('div'));
    this.data = rows
      .map((row) => {
        const dataRow = new DataRow(
          {},
          this.requiresXY,
          this.isScatter,
          () => {},
          () => {}
        );
        dataRow.element = row as HTMLElement;
        return dataRow.getData() as ChartPoint;
      })
      .filter((point) => point.label);

    this.onChange(this.data);
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  public getData(): ChartPoint[] {
    return this.data;
  }

  public setData(data: ChartData[]): void {
    if (this.dataRows) this.dataRows.innerHTML = '';
    data.forEach((point) => this.addRow(point));
  }

  public destroy(): void {
    // Удаляем обработчик события для кнопки добавления
    if (this.addButton) {
      this.addButton.removeEventListener('click', () => this.addRow());
      this.addButton = null;
    }

    // Удаляем контейнер из DOM
    if (this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }

    // Очищаем ссылки на внутренние объекты
    this.dataRows = null;
    this.container = null!;
    this.editor = null!;
    this.data = [];
    this.onChange = null!;
  }
}
