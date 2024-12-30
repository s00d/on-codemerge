import type { ChartSeries, ChartPoint } from '../types';
import { deleteIcon } from '../../../icons';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';

export class MultiSeriesDataEditor {
  private editor: HTMLEditor;
  private container: HTMLElement;
  private series: ChartSeries[] = [];
  private onChange: (series: ChartSeries[]) => void;

  private section: HTMLDivElement[] = [];
  private nameInput: HTMLInputElement | null = null;

  constructor(editor: HTMLEditor, onChange: (series: ChartSeries[]) => void) {
    this.editor = editor;
    this.container = document.createElement('div');
    this.onChange = onChange;
    this.initialize();
  }

  private initialize(): void {
    this.container.className = 'chart-data-editor';

    // Основной контейнер
    const mainContainer = document.createElement('div');
    mainContainer.className = 'space-y-4';

    // Заголовок и кнопка добавления серии
    const header = document.createElement('div');
    header.className = 'flex justify-between items-center';

    const title = document.createElement('h4');
    title.className = 'text-sm font-medium text-gray-700';
    title.textContent = this.editor.t('Series Data');

    const addSeriesButton = document.createElement('button');
    addSeriesButton.type = 'button';
    addSeriesButton.className =
      'add-series-btn px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600';
    addSeriesButton.textContent = this.editor.t('Add Series');

    header.appendChild(title);
    header.appendChild(addSeriesButton);

    // Контейнер для серий
    const seriesContainer = document.createElement('div');
    seriesContainer.className = 'series-container space-y-6';

    // Сборка структуры
    mainContainer.appendChild(header);
    mainContainer.appendChild(seriesContainer);
    this.container.appendChild(mainContainer);

    // Настройка обработчиков событий
    this.setupEventListeners();

    // Добавление начальной серии
    this.addInitialSeries();
  }

  private setupEventListeners(): void {
    const addSeriesButton = this.container.querySelector('.add-series-btn');
    addSeriesButton?.addEventListener('click', () => {
      this.addSeries({
        name: `Series ${this.series.length + 1}`,
        color: this.getNextColor(),
        data: [],
      });
    });
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
    const section = document.createElement('div');
    section.className = 'series-section border rounded-lg p-4';

    // Заголовок серии
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between mb-4';

    const nameColorContainer = document.createElement('div');
    nameColorContainer.className = 'flex items-center gap-3';

    this.nameInput = document.createElement('input');
    this.nameInput.type = 'text';
    this.nameInput.className = 'series-name px-2 py-1 border rounded text-sm';
    this.nameInput.value = series.name;
    this.nameInput.placeholder = this.editor.t('Series name');

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.className = 'series-color w-8 h-8 rounded cursor-pointer';
    colorInput.value = series.color || '#3b82f6';

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-series-btn p-1 text-red-500 hover:text-red-700';
    deleteButton.innerHTML = deleteIcon;

    nameColorContainer.appendChild(this.nameInput);
    nameColorContainer.appendChild(colorInput);
    header.appendChild(nameColorContainer);
    header.appendChild(deleteButton);

    // Сетка данных
    const dataGrid = document.createElement('div');
    dataGrid.className = 'data-grid';

    const gridHeader = document.createElement('div');
    gridHeader.className = 'grid grid-cols-[0.9fr,60px,60px,60px,40px,60px] gap-2 pb-2 border-b';

    const labelHeader = document.createElement('div');
    labelHeader.className = 'text-sm font-medium text-gray-600';
    labelHeader.textContent = this.editor.t('Label');

    const valueHeader = document.createElement('div');
    valueHeader.className = 'text-sm font-medium text-gray-600';
    valueHeader.textContent = this.editor.t('Value');

    const xHeader = document.createElement('div');
    xHeader.className = 'text-sm font-medium text-gray-600';
    xHeader.textContent = this.editor.t('X');

    const yHeader = document.createElement('div');
    yHeader.className = 'text-sm font-medium text-gray-600';
    yHeader.textContent = this.editor.t('Y');

    const colorHeader = document.createElement('div');
    colorHeader.className = 'text-sm font-medium text-gray-600';
    colorHeader.textContent = this.editor.t('Color');

    const actionHeader = document.createElement('div');
    actionHeader.className = 'text-sm font-medium text-gray-600';
    actionHeader.textContent = '';

    gridHeader.appendChild(labelHeader);
    gridHeader.appendChild(valueHeader);
    gridHeader.appendChild(xHeader);
    gridHeader.appendChild(yHeader);
    gridHeader.appendChild(colorHeader);
    gridHeader.appendChild(actionHeader);
    dataGrid.appendChild(gridHeader);

    const dataRows = document.createElement('div');
    dataRows.className = 'data-rows space-y-2 mt-2';
    dataGrid.appendChild(dataRows);

    // Кнопка добавления точки данных
    const addPointButton = document.createElement('button');
    addPointButton.type = 'button';
    addPointButton.className =
      'add-point-btn mt-2 px-2 py-1 text-sm text-blue-600 hover:text-blue-700';
    addPointButton.textContent = this.editor.t('+ Add Data Point');

    // Сборка структуры
    section.appendChild(header);
    section.appendChild(dataGrid);
    section.appendChild(addPointButton);

    // Настройка обработчиков событий
    this.setupSeriesEventListeners(section);

    // Заполнение данных
    this.populateSeriesData(dataRows, series.data);

    return section;
  }

  private setupSeriesEventListeners(section: HTMLElement): void {
    const addPointButton = section.querySelector('.add-point-btn');
    addPointButton?.addEventListener('click', () => {
      this.addDataPoint(section);
    });

    const deleteButton = section.querySelector('.delete-series-btn');
    deleteButton?.addEventListener('click', () => {
      section.remove();
      this.updateData();
    });

    section.addEventListener('input', () => this.updateData());
  }

  private addDataPoint(section: HTMLElement, point?: ChartPoint): void {
    const dataRows = section.querySelector('.data-rows');
    if (!dataRows) return;

    const row = document.createElement('div');
    row.className = 'grid grid-cols-[0.9fr,60px,60px,60px,40px,60px] gap-2 items-center';

    const labelInput = document.createElement('input');
    labelInput.type = 'text';
    labelInput.className = 'label-input px-2 py-1 border rounded text-sm';
    labelInput.value = point?.label || '';

    const valueInput = document.createElement('input');
    valueInput.type = 'number';
    valueInput.className = 'value-input px-2 py-1 border rounded text-sm';
    valueInput.value = point?.value?.toString() || '';

    const xInput = document.createElement('input');
    xInput.type = 'number';
    xInput.className = 'x-input px-2 py-1 border rounded text-sm';
    xInput.value = point?.x?.toString() || '';

    const yInput = document.createElement('input');
    yInput.type = 'number';
    yInput.className = 'y-input px-2 py-1 border rounded text-sm';
    yInput.value = point?.y?.toString() || '';

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.className = 'color-input px-2 py-1 border rounded text-sm';
    colorInput.value = point?.color?.toString() || '';

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-point-btn p-1 pl-2 text-red-500 hover:text-red-700';
    deleteButton.innerHTML = deleteIcon;

    deleteButton.addEventListener('click', () => {
      row.remove();
      this.updateData();
    });

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
