import { PopupManager, type PopupItem } from '../../../core/ui/PopupManager';
import { ChartRenderer } from '../services/ChartRenderer';
import type { ChartType, ChartSeries, ChartPoint } from '../types';
import { MultiSeriesDataEditor } from './MultiSeriesDataEditor';
import { ChartDataEditor } from './ChartDataEditor';
import { CHART_TYPE_CONFIGS } from '../constants/chartTypes';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';
import { createButton, createContainer, createSpan } from '../../../utils/helpers.ts';

const chartTemplates = [
  {
    key: 'bar-sales',
    name: 'Bar: Sales',
    type: 'bar',
    data: [
      { label: 'Jan', value: 120 },
      { label: 'Feb', value: 90 },
      { label: 'Mar', value: 150 },
      { label: 'Apr', value: 80 },
      { label: 'May', value: 200 },
    ],
  },
  {
    key: 'pie-expenses',
    name: 'Pie: Expenses',
    type: 'pie',
    data: [
      { label: 'Rent', value: 40 },
      { label: 'Salary', value: 30 },
      { label: 'Marketing', value: 15 },
      { label: 'Other', value: 15 },
    ],
  },
  {
    key: 'line-visitors',
    name: 'Line: Visitors',
    type: 'line',
    data: [
      { label: 'Mon', value: 100 },
      { label: 'Tue', value: 120 },
      { label: 'Wed', value: 90 },
      { label: 'Thu', value: 140 },
      { label: 'Fri', value: 180 },
      { label: 'Sat', value: 220 },
      { label: 'Sun', value: 160 },
    ],
  },
  {
    key: 'doughnut-browsers',
    name: 'Doughnut: Browsers',
    type: 'doughnut',
    data: [
      { label: 'Chrome', value: 65 },
      { label: 'Firefox', value: 15 },
      { label: 'Safari', value: 10 },
      { label: 'Edge', value: 7 },
      { label: 'Other', value: 3 },
    ],
  },
];

export class ChartMenu {
  private editor: HTMLEditor;
  private popup: PopupManager;
  private renderer: ChartRenderer;
  private currentEditor: ChartDataEditor | MultiSeriesDataEditor;
  private selectedType: ChartType = 'bar';
  private onInsert: ((element: HTMLElement) => void) | null = null;
  private previewTimeout: number | null = null;
  private editingChart: HTMLElement | null = null;
  private chartTitle: string = '';
  private xAxisLabel: string = '';
  private yAxisLabel: string = '';
  private showLegend: boolean = true;
  private chartWidth: number = 800;
  private chartHeight: number = 400;
  private showGrid: boolean = true;
  private chartMode: 'default' | 'stacked' | 'grouped' = 'default';
  private chartOrientation: 'vertical' | 'horizontal' = 'vertical';

  constructor(editor: HTMLEditor) {
    this.editor = editor;
    this.renderer = new ChartRenderer(editor);
    this.popup = new PopupManager(editor, {
      title: editor.t('Insert'),
      className: 'chart-menu',
      closeOnClickOutside: true,
      buttons: [
        {
          label: editor.t('Cancel'),
          variant: 'secondary',
          onClick: () => this.popup.hide(),
        },
        {
          label: editor.t('Insert'),
          variant: 'primary',
          onClick: () => this.handleSubmit(),
        },
      ],
      items: this.createPopupItems(), // Динамически создаем элементы
    });

    this.currentEditor = new ChartDataEditor(editor, (data) =>
      this.schedulePreviewUpdate([{ name: 'Series 1', data }])
    );
  }

  private createPopupItems(): PopupItem[] {
    const items: PopupItem[] = [
      // 1. Chart type selector
      {
        type: 'custom',
        id: 'chart-type-selector',
        content: () => this.createChartTypeSelector(),
      },
      // 2. Заголовки (title, x/y axis)
      {
        type: 'custom',
        id: 'meta-fields',
        content: () => this.createMetaFields(),
      },
      // 3. Размеры графика
      {
        type: 'custom',
        id: 'chart-dimensions',
        content: () => this.createDimensionsSelector(),
      },
      // 4. Настройки отображения
      {
        type: 'custom',
        id: 'display-settings',
        content: () => this.createDisplaySettings(),
      },
      // 5. Templates (над редактором данных)
      {
        type: 'custom',
        id: 'template-selector',
        content: () => this.createTemplateSelector(),
      },
      // 6. Data editor (теперь над предпросмотром)
      {
        type: 'custom',
        id: 'data-editor-container',
        content: () => this.createDataEditorContainer(),
      },
      // 7. Preview (график)
      {
        type: 'custom',
        id: 'preview-container',
        content: () => this.createPreviewContainer(),
      },
      // 8. Export (под графиком)
      {
        type: 'custom',
        id: 'export-btn',
        content: () => this.createExportButton(),
      },
    ];
    return items;
  }

  private createMetaFields(): HTMLElement {
    const container = createContainer('meta-fields flex flex-col gap-3 mb-4');

    // Chart Title
    const titleGroup = createContainer('flex flex-col gap-1');
    const titleLabel = createSpan('text-sm font-medium text-gray-700');
    titleLabel.textContent = this.editor.t('Chart Title');
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.placeholder = this.editor.t('Enter chart title...');
    titleInput.value = this.chartTitle;
    titleInput.className =
      'meta-input px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all';
    titleInput.oninput = (e) => {
      this.chartTitle = (e.target as HTMLInputElement).value;
      this.schedulePreviewUpdate(this.currentEditor.getData());
    };
    titleGroup.appendChild(titleLabel);
    titleGroup.appendChild(titleInput);

    // X Axis Label
    const xGroup = createContainer('flex flex-col gap-1');
    const xLabel = createSpan('text-sm font-medium text-gray-700');
    xLabel.textContent = this.editor.t('X Axis Label');
    const xInput = document.createElement('input');
    xInput.type = 'text';
    xInput.placeholder = this.editor.t('Enter X axis label...');
    xInput.value = this.xAxisLabel;
    xInput.className =
      'meta-input px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all';
    xInput.oninput = (e) => {
      this.xAxisLabel = (e.target as HTMLInputElement).value;
      this.schedulePreviewUpdate(this.currentEditor.getData());
    };
    xGroup.appendChild(xLabel);
    xGroup.appendChild(xInput);

    // Y Axis Label
    const yGroup = createContainer('flex flex-col gap-1');
    const yLabel = createSpan('text-sm font-medium text-gray-700');
    yLabel.textContent = this.editor.t('Y Axis Label');
    const yInput = document.createElement('input');
    yInput.type = 'text';
    yInput.placeholder = this.editor.t('Enter Y axis label...');
    yInput.value = this.yAxisLabel;
    yInput.className =
      'meta-input px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all';
    yInput.oninput = (e) => {
      this.yAxisLabel = (e.target as HTMLInputElement).value;
      this.schedulePreviewUpdate(this.currentEditor.getData());
    };
    yGroup.appendChild(yLabel);
    yGroup.appendChild(yInput);

    container.appendChild(titleGroup);
    container.appendChild(xGroup);
    container.appendChild(yGroup);
    return container;
  }

  private createTemplateSelector(): HTMLElement {
    const container = createContainer('template-selector flex flex-col gap-2 mb-4');

    const title = createSpan('text-sm font-medium text-gray-700');
    title.textContent = this.editor.t('Templates');
    container.appendChild(title);

    const select = document.createElement('select');
    select.className =
      'template-select px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = this.editor.t('Select template...');
    select.appendChild(defaultOption);

    chartTemplates.forEach((tpl) => {
      const option = document.createElement('option');
      option.value = tpl.key;
      option.textContent = tpl.name;
      select.appendChild(option);
    });

    select.onchange = (e) => {
      const selectedKey = (e.target as HTMLSelectElement).value;
      if (selectedKey) {
        const template = chartTemplates.find((t) => t.key === selectedKey);
        if (template) {
          this.selectedType = template.type as ChartType;
          this.updateEditor(template.type as ChartType);

          // Обновляем селектор типа графика
          const typeOptions = this.popup.getElement()?.querySelectorAll('[data-type]');
          typeOptions?.forEach((opt) => opt.classList.remove('selected'));
          const selectedTypeOption = this.popup
            .getElement()
            ?.querySelector(`[data-type="${template.type}"]`);
          if (selectedTypeOption) {
            selectedTypeOption.classList.add('selected');
          }

          // Устанавливаем данные
          setTimeout(() => {
            if (this.currentEditor) {
              if ('setData' in this.currentEditor) {
                (this.currentEditor as any).setData(template.data);
              }
              this.updatePreview(template.data);
            }
          }, 100);
        }
      }
    };

    container.appendChild(select);
    return container;
  }

  private createChartTypeSelector(): HTMLElement {
    const container = createContainer('chart-type-selector');

    const title = createSpan('text-sm font-medium text-gray-700 mb-4 block');
    title.textContent = this.editor.t('Chart Type');
    container.appendChild(title);

    const grid = createContainer('grid');

    Object.entries(CHART_TYPE_CONFIGS).forEach(([type, config]) => {
      const option = createContainer(
        `chart-type-option ${type === this.selectedType ? 'selected' : ''}`
      );
      option.setAttribute('data-type', type);

      const icon = createContainer('w-10 h-10 mb-3 mx-auto flex items-center justify-center');
      icon.innerHTML = config.icon;

      const label = createSpan();
      label.textContent = this.editor.t(config.name);

      option.appendChild(icon);
      option.appendChild(label);

      option.onclick = () => {
        // Убираем выделение с предыдущего
        grid.querySelectorAll('.chart-type-option').forEach((opt) => {
          opt.classList.remove('selected');
        });

        // Выделяем текущий
        option.classList.add('selected');

        this.selectedType = type as ChartType;
        this.updateEditor(type as ChartType);
      };

      grid.appendChild(option);
    });

    container.appendChild(grid);
    return container;
  }

  private createDataEditorContainer(): HTMLElement {
    const container = createContainer('data-editor-container mb-6');
    this.updateEditor('bar', container);
    return container;
  }

  private createPreviewContainer(): HTMLElement {
    const container = createContainer(
      'preview-container h-64 bg-gray-50 rounded-lg flex items-center justify-center'
    );
    container.innerHTML = '<div class="text-gray-400">Chart preview will appear here</div>';
    return container;
  }

  private createExportButton(): HTMLElement {
    const container = createContainer('export-container flex justify-center mt-4');

    const btn = createButton('', () => this.exportPreviewAsPNG());
    btn.className =
      'export-btn px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 font-medium';

    const icon = createContainer('w-4 h-4');
    icon.innerHTML =
      '<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>';

    const text = createSpan();
    text.textContent = this.editor.t('Export as PNG');

    btn.appendChild(icon);
    btn.appendChild(text);
    container.appendChild(btn);

    return container;
  }
  private exportPreviewAsPNG(): void {
    const previewContainer = this.popup.getElement()?.querySelector('.preview-container');
    if (!previewContainer) return;
    const img = previewContainer.querySelector('img.svg-chart') as HTMLImageElement;
    if (img && img.src) {
      const link = document.createElement('a');
      link.href = img.src;
      link.download = 'chart.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Если используется canvas (например, для предпросмотра)
      const canvas = previewContainer.querySelector('canvas') as HTMLCanvasElement;
      if (canvas) {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = 'chart.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  }

  private updateEditor(type: ChartType, container?: HTMLElement): void {
    const config = CHART_TYPE_CONFIGS[type];
    const editorContainer =
      container ?? this.popup.getElement().querySelector('.data-editor-container');
    if (!editorContainer) return;

    editorContainer.innerHTML = '';

    if (config.supportsMultipleSeries) {
      this.currentEditor = new MultiSeriesDataEditor(this.editor, (data) =>
        this.schedulePreviewUpdate(data)
      );
    } else {
      this.currentEditor = new ChartDataEditor(
        this.editor,
        (data) =>
          this.schedulePreviewUpdate([
            {
              name: this.editor.t('Series 1'),
              data,
            },
          ]),
        (config as unknown as any).requiresXY,
        type === 'scatter'
      );
    }

    editorContainer.appendChild(this.currentEditor.getElement());
  }

  private schedulePreviewUpdate(data: ChartPoint[] | ChartSeries[]): void {
    if (this.previewTimeout) {
      window.clearTimeout(this.previewTimeout);
    }
    this.previewTimeout = window.setTimeout(() => {
      this.updatePreview(data);
    }, 100);
  }

  private updatePreview(data: ChartPoint[] | ChartSeries[]): void {
    const previewContainer = this.popup.getElement()?.querySelector('.preview-container');
    if (!previewContainer) return;

    const options = {
      width: 400,
      height: 200,
      title: this.chartTitle,
      xAxis: { title: this.xAxisLabel },
      yAxis: { title: this.yAxisLabel },
      legend: { show: this.showLegend },
      grid: { show: this.showGrid },
      mode: this.chartMode,
      orientation: this.chartOrientation,
    };

    const canvas = this.renderer.createChart(this.selectedType, data, options);
    previewContainer.innerHTML = '';
    previewContainer.appendChild(canvas);
  }

  private handleSubmit(): void {
    const data = this.currentEditor.getData();
    if (!data || (Array.isArray(data) && data.length === 0)) return;
    const options = {
      width: this.chartWidth,
      height: this.chartHeight,
      title: this.chartTitle,
      xAxis: { title: this.xAxisLabel },
      yAxis: { title: this.yAxisLabel },
      legend: { show: this.showLegend },
      grid: { show: this.showGrid },
      mode: this.chartMode,
      orientation: this.chartOrientation,
    };
    if (this.editingChart) {
      this.editingChart.setAttribute('data-chart-type', this.selectedType);
      this.editingChart.setAttribute('data-chart-data', JSON.stringify(data));
      const canvas = this.renderer.createChart(this.selectedType, data, options);
      this.editingChart.innerHTML = '';
      this.editingChart.appendChild(canvas);
    } else {
      const chartContainer = createContainer('chart-container');
      chartContainer.style.width = options.width + 'px';
      chartContainer.style.height = options.height + 'px';
      chartContainer.setAttribute('data-chart-type', this.selectedType);
      chartContainer.setAttribute('data-chart-data', JSON.stringify(data));
      const canvas = this.renderer.createChart(this.selectedType, data, options);
      chartContainer.appendChild(canvas);
      if (this.onInsert) {
        this.onInsert(chartContainer);
      }
    }
    this.popup.hide();
  }

  public show(onInsert: (element: HTMLElement) => void): void {
    this.editingChart = null;
    this.onInsert = onInsert;
    this.popup.show();
  }

  public edit(chartElement: HTMLElement, hidden = false): void {
    this.editingChart = chartElement;
    const type = chartElement.getAttribute('data-chart-type') as ChartType;
    const dataStr = chartElement.getAttribute('data-chart-data');

    if (type && dataStr) {
      try {
        const data = JSON.parse(dataStr) as ChartSeries[];

        // Update type selector
        const typeOption = this.popup.getElement()?.querySelector(`[data-type="${type}"]`);
        if (typeOption) {
          typeOption.classList.add('selected');
        }

        this.selectedType = type;
        this.updateEditor(type);

        // Set data in editor after a short delay to ensure editor is initialized
        setTimeout(() => {
          (this.currentEditor as ChartDataEditor).setData(data);
          this.updatePreview(data);
        }, 100);

        if (!hidden) this.popup.show();
      } catch (e) {
        console.error('Failed to parse chart data:', e);
      }
    }
  }

  public redrawChart(
    container: HTMLElement,
    type: ChartType,
    data: ChartSeries[],
    dimensions: { width: number; height: number }
  ): void {
    const canvas = this.renderer.createChart(type, data, dimensions);
    container.innerHTML = '';
    container.appendChild(canvas);
  }

  private createDimensionsSelector(): HTMLElement {
    const container = createContainer('dimensions-selector flex gap-4 mb-4');

    // Width
    const widthGroup = createContainer('flex flex-col gap-1');
    const widthLabel = createSpan('text-sm font-medium text-gray-700');
    widthLabel.textContent = this.editor.t('Width');
    const widthInput = document.createElement('input');
    widthInput.type = 'number';
    widthInput.min = '200';
    widthInput.max = '1200';
    widthInput.step = '50';
    widthInput.value = this.chartWidth.toString();
    widthInput.className = 'dimension-input px-2 py-1 rounded border border-gray-300 text-sm';
    widthInput.onchange = (e) => {
      this.chartWidth = parseInt((e.target as HTMLInputElement).value);
      this.schedulePreviewUpdate(this.currentEditor.getData());
    };
    widthGroup.appendChild(widthLabel);
    widthGroup.appendChild(widthInput);

    // Height
    const heightGroup = createContainer('flex flex-col gap-1');
    const heightLabel = createSpan('text-sm font-medium text-gray-700');
    heightLabel.textContent = this.editor.t('Height');
    const heightInput = document.createElement('input');
    heightInput.type = 'number';
    heightInput.min = '150';
    heightInput.max = '800';
    heightInput.step = '50';
    heightInput.value = this.chartHeight.toString();
    heightInput.className = 'dimension-input px-2 py-1 rounded border border-gray-300 text-sm';
    heightInput.onchange = (e) => {
      this.chartHeight = parseInt((e.target as HTMLInputElement).value);
      this.schedulePreviewUpdate(this.currentEditor.getData());
    };
    heightGroup.appendChild(heightLabel);
    heightGroup.appendChild(heightInput);

    container.appendChild(widthGroup);
    container.appendChild(heightGroup);
    return container;
  }

  private createDisplaySettings(): HTMLElement {
    const container = createContainer(
      'display-settings flex flex-col gap-3 mb-4 p-3 bg-gray-50 rounded-lg'
    );
    const title = createSpan('text-sm font-medium text-gray-700 mb-2');
    title.textContent = this.editor.t('Display Settings');
    container.appendChild(title);

    // Show Legend
    const legendGroup = createContainer('flex items-center gap-2');
    const legendCheckbox = document.createElement('input');
    legendCheckbox.type = 'checkbox';
    legendCheckbox.checked = this.showLegend;
    legendCheckbox.className = 'setting-checkbox';
    legendCheckbox.onchange = (e) => {
      this.showLegend = (e.target as HTMLInputElement).checked;
      this.schedulePreviewUpdate(this.currentEditor.getData());
    };
    const legendLabel = createSpan('text-sm');
    legendLabel.textContent = this.editor.t('Show Legend');
    legendGroup.appendChild(legendCheckbox);
    legendGroup.appendChild(legendLabel);

    // Show Grid
    const gridGroup = createContainer('flex items-center gap-2');
    const gridCheckbox = document.createElement('input');
    gridCheckbox.type = 'checkbox';
    gridCheckbox.checked = this.showGrid;
    gridCheckbox.className = 'setting-checkbox';
    gridCheckbox.onchange = (e) => {
      this.showGrid = (e.target as HTMLInputElement).checked;
      this.schedulePreviewUpdate(this.currentEditor.getData());
    };
    const gridLabel = createSpan('text-sm');
    gridLabel.textContent = this.editor.t('Show Grid');
    gridGroup.appendChild(gridCheckbox);
    gridGroup.appendChild(gridLabel);

    // Mode selector (stacked/grouped/default)
    const modeGroup = createContainer('flex items-center gap-2');
    const modeLabel = createSpan('text-sm');
    modeLabel.textContent = this.editor.t('Bar/Area Mode');
    const modeSelect = document.createElement('select');
    modeSelect.className = 'mode-select px-2 py-1 rounded border border-gray-300 text-sm';
    ['default', 'stacked', 'grouped'].forEach((mode) => {
      const opt = document.createElement('option');
      opt.value = mode;
      opt.textContent = this.editor.t(mode.charAt(0).toUpperCase() + mode.slice(1));
      modeSelect.appendChild(opt);
    });
    modeSelect.value = this.chartMode;
    modeSelect.onchange = (e) => {
      this.chartMode = (e.target as HTMLSelectElement).value as any;
      this.schedulePreviewUpdate(this.currentEditor.getData());
    };
    modeGroup.appendChild(modeLabel);
    modeGroup.appendChild(modeSelect);

    // Orientation selector
    const orientGroup = createContainer('flex items-center gap-2');
    const orientLabel = createSpan('text-sm');
    orientLabel.textContent = this.editor.t('Orientation');
    const orientSelect = document.createElement('select');
    orientSelect.className = 'orientation-select px-2 py-1 rounded border border-gray-300 text-sm';
    ['vertical', 'horizontal'].forEach((orient) => {
      const opt = document.createElement('option');
      opt.value = orient;
      opt.textContent = this.editor.t(orient.charAt(0).toUpperCase() + orient.slice(1));
      orientSelect.appendChild(opt);
    });
    orientSelect.value = this.chartOrientation;
    orientSelect.onchange = (e) => {
      this.chartOrientation = (e.target as HTMLSelectElement).value as any;
      this.schedulePreviewUpdate(this.currentEditor.getData());
    };
    orientGroup.appendChild(orientLabel);
    orientGroup.appendChild(orientSelect);

    container.appendChild(legendGroup);
    container.appendChild(gridGroup);
    container.appendChild(modeGroup);
    container.appendChild(orientGroup);
    return container;
  }

  public destroy(): void {
    // Очистка таймеров
    if (this.previewTimeout) {
      window.clearTimeout(this.previewTimeout);
      this.previewTimeout = null;
    }

    // Уничтожение зависимых объектов
    this.popup.destroy();
    if (this.currentEditor) {
      this.currentEditor.destroy();
    }

    // Очистка ссылок
    this.editor = null!;
    this.popup = null!;
    this.renderer = null!;
    this.currentEditor = null!;
    this.onInsert = null;
    this.editingChart = null;
  }
}
