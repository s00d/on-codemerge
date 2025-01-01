import type { ChartSeries, ChartPoint } from '../types';
import { deleteIcon } from '../../../icons';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';
import {
  createButton,
  createContainer,
  createH,
  createInputField,
} from '../../../utils/helpers.ts';

export class MultiSeriesDataEditor {
  private editor: HTMLEditor;
  private container: HTMLElement;
  private series: ChartSeries[] = [];
  private onChange: (series: ChartSeries[]) => void;

  private section: HTMLDivElement[] = [];
  private nameInput: HTMLInputElement | null = null;

  constructor(editor: HTMLEditor, onChange: (series: ChartSeries[]) => void) {
    this.editor = editor;
    this.container = createContainer('chart-data-editor');
    this.onChange = onChange;
    this.initialize();
  }

  private initialize(): void {
    const mainContainer = createContainer('space-y-4');
    const header = createContainer('flex justify-between items-center');
    const title = createH('h4', 'text-sm font-medium text-gray-700', this.editor.t('Series Data'));

    const addSeriesButton = createButton(this.editor.t('Add Series'), () => {
      this.addSeries({
        name: `Series ${this.series.length + 1}`,
        color: this.getNextColor(),
        data: [],
      });
    });
    addSeriesButton.className =
      'add-series-btn px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600';

    header.appendChild(title);
    header.appendChild(addSeriesButton);

    // Контейнер для серий
    const seriesContainer = createContainer('series-container space-y-6');

    // Сборка структуры
    mainContainer.appendChild(header);
    mainContainer.appendChild(seriesContainer);
    this.container.appendChild(mainContainer);

    // Добавление начальной серии
    this.addInitialSeries();
  }

  private addInitialSeries(): void {
    const defaultSeries: ChartSeries = {
      name: this.editor.t('Series 1'),
      color: '#3b82f6',
      data: [
        {
          label: this.editor.t('Jan'),
          value: 10,
          r: 5,
          x: 1,
          y: 1,
          color: this.getNextColor(),
        },
        {
          label: this.editor.t('Feb'),
          value: 20,
          r: 10,
          x: 2,
          y: 2,
          color: this.getNextColor(),
        },
        {
          label: this.editor.t('Mar'),
          value: 15,
          r: 7,
          x: 3,
          y: 3,
          color: this.getNextColor(),
        },
      ],
    };

    this.addSeries(defaultSeries);
  }

  private getNextColor(): string {
    const colors = [
      '#3b82f6',
      '#ef4444',
      '#10b981',
      '#f59e0b',
      '#6366f1',
      '#ec4899',
      '#8b5cf6',
      '#14b8a6',
      '#f97316',
      '#06b6d4',
    ];
    return colors[this.series.length % colors.length];
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  public getData(): ChartSeries[] {
    return this.series;
  }

  private addSeries(series: ChartSeries): void {
    const container = this.container.querySelector('.series-container');
    if (!container) return;

    const section = this.createSeriesSection(series);
    container.appendChild(section);
    this.section.push(section);
    this.updateData();
  }

  private createSeriesSection(series: ChartSeries): HTMLDivElement {
    const section = createContainer('series-section border rounded-lg p-4');
    const header = createContainer('flex items-center justify-between mb-4');
    const nameColorContainer = createContainer('flex items-center gap-3');
    this.nameInput = createInputField(
      'text',
      this.editor.t('Series name'),
      series.name,
      (value) => {
        series.name = value;
      }
    );
    this.nameInput.className = 'series-name px-2 py-1 border rounded text-sm';

    const colorInput = createInputField(
      'color',
      this.editor.t('Color'),
      series.color || '#3b82f6',
      (value) => {
        series.color = value;
      }
    );
    colorInput.className = 'series-color w-8 h-8 rounded cursor-pointer';

    const deleteButton = createButton('', () => {
      section.remove();
      this.updateData();
    });
    deleteButton.className = 'delete-series-btn p-1 text-red-500 hover:text-red-700';
    deleteButton.innerHTML = deleteIcon;

    nameColorContainer.appendChild(this.nameInput);
    nameColorContainer.appendChild(colorInput);
    header.appendChild(nameColorContainer);
    header.appendChild(deleteButton);

    // Сетка данных
    const dataGrid = createContainer('data-grid');
    const gridHeader = createContainer(
      'grid grid-cols-[0.9fr,60px,60px,60px,40px,60px] gap-2 pb-2 border-b'
    );
    const labelHeader = createContainer(
      'text-sm font-medium text-gray-600',
      this.editor.t('Label')
    );
    const valueHeader = createContainer(
      'text-sm font-medium text-gray-600',
      this.editor.t('Value')
    );
    const xHeader = createContainer('text-sm font-medium text-gray-600', this.editor.t('X'));
    const yHeader = createContainer('text-sm font-medium text-gray-600', this.editor.t('Y'));
    const colorHeader = createContainer(
      'text-sm font-medium text-gray-600',
      this.editor.t('Color')
    );
    const actionHeader = createContainer('text-sm font-medium text-gray-600');

    gridHeader.appendChild(labelHeader);
    gridHeader.appendChild(valueHeader);
    gridHeader.appendChild(xHeader);
    gridHeader.appendChild(yHeader);
    gridHeader.appendChild(colorHeader);
    gridHeader.appendChild(actionHeader);
    dataGrid.appendChild(gridHeader);

    const dataRows = createContainer('data-rows space-y-2 mt-2');
    dataGrid.appendChild(dataRows);

    // Кнопка добавления точки данных
    const addPointButton = createButton(this.editor.t('+ Add Data Point'), () => {
      this.addDataPoint(section);
    });
    addPointButton.className =
      'add-point-btn mt-2 px-2 py-1 text-sm text-blue-600 hover:text-blue-700';

    // Сборка структуры
    section.appendChild(header);
    section.appendChild(dataGrid);
    section.appendChild(addPointButton);

    // Заполнение данных
    this.populateSeriesData(dataRows, series.data);

    return section;
  }

  private addDataPoint(section: HTMLElement, point?: ChartPoint): void {
    const dataRows = section.querySelector('.data-rows');
    if (!dataRows) return;

    const row = createContainer(
      'grid grid-cols-[0.9fr,60px,60px,60px,40px,60px] gap-2 items-center'
    );

    const labelInput = createInputField('text', 'label', point?.label || '', (value) => {
      if (point) point.label = value;
    });
    labelInput.className = 'label-input px-2 py-1 border rounded text-sm';

    const valueInput = createInputField('number', 'value', point?.value?.toString(), (value) => {
      if (point) point.value = parseInt(value);
    });
    valueInput.className = 'value-input px-2 py-1 border rounded text-sm';

    const xInput = createInputField('number', 'X', point?.x?.toString() || '', (value) => {
      if (point) point.x = parseInt(value);
    });
    xInput.className = 'x-input px-2 py-1 border rounded text-sm';

    const yInput = createInputField('number', 'Y', point?.y?.toString() || '', (value) => {
      if (point) point.y = parseInt(value);
    });
    yInput.className = 'y-input px-2 py-1 border rounded text-sm';

    const colorInput = createInputField('color', 'Color', point?.y?.toString() || '', (value) => {
      colorInput.value = value;
    });
    colorInput.className = 'color-input px-2 py-1 border rounded text-sm';

    const deleteButton = createButton('', () => {
      row.remove();
      this.updateData();
    });
    deleteButton.className = 'delete-point-btn p-1 pl-2 text-red-500 hover:text-red-700';
    deleteButton.innerHTML = deleteIcon;

    row.appendChild(labelInput);
    row.appendChild(valueInput);
    row.appendChild(xInput);
    row.appendChild(yInput);
    row.appendChild(colorInput);
    row.appendChild(deleteButton);
    dataRows.appendChild(row);

    this.updateData();
  }

  private populateSeriesData(dataRows: HTMLElement, data: ChartPoint[]): void {
    data.forEach((point) => {
      this.addDataPoint(dataRows.parentElement?.parentElement as HTMLElement, point);
    });
  }

  private updateData(): void {
    const sections = this.section;
    if (!sections) return;

    this.series = Array.from(sections).map((section) => {
      const name = (section.querySelector('.series-name') as HTMLInputElement).value;
      const color = (section.querySelector('.series-color') as HTMLInputElement).value;
      const rows = section.querySelectorAll('.data-rows > div');

      const data = Array.from(rows)
        .map((row) => ({
          label:
            (row.querySelector('.label-input') as HTMLInputElement).value +
            ' (' +
            (parseFloat((row.querySelector('.value-input') as HTMLInputElement).value) || 0) +
            ')',
          value: parseFloat((row.querySelector('.value-input') as HTMLInputElement).value) || 0,
          r: parseFloat((row.querySelector('.value-input') as HTMLInputElement).value) || 0,
          x: parseFloat((row.querySelector('.x-input') as HTMLInputElement).value) || 0,
          y: parseFloat((row.querySelector('.y-input') as HTMLInputElement).value) || 0,
          color: (row.querySelector('.color-input') as HTMLInputElement).value || '#3b82f6',
        }))
        .filter((point) => point.label && !isNaN(point.value));

      return { name, color, data };
    });

    this.onChange(this.series);
  }

  /**
   * Уничтожение редактора
   */
  public destroy(): void {
    // Удаляем все обработчики событий
    const addSeriesButton = this.container.querySelector('.add-series-btn');
    addSeriesButton?.removeEventListener('click', () => {});

    // Удаляем все секции
    this.section.forEach((section) => {
      section.removeEventListener('input', () => {});
      section.remove();
    });

    // Очищаем массив секций
    this.section = [];

    // Удаляем контейнер
    if (this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }

    // Очищаем ссылки
    this.container = null!;
    this.editor = null!;
    this.series = [];
    this.onChange = null!;
  }
}
