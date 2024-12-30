import { PopupManager, type PopupItem } from '../../../core/ui/PopupManager';
import { ChartRenderer } from '../services/ChartRenderer';
import type { ChartType, ChartSeries } from '../types';
import { MultiSeriesDataEditor } from './MultiSeriesDataEditor';
import { ChartDataEditor } from './ChartDataEditor';
import { CHART_TYPE_CONFIGS } from '../constants/chartTypes';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';

export class ChartMenu {
  private editor: HTMLEditor;
  private popup: PopupManager;
  private renderer: ChartRenderer;
  private currentEditor: ChartDataEditor | MultiSeriesDataEditor;
  private selectedType: ChartType = 'bar';
  private onInsert: ((element: HTMLElement) => void) | null = null;
  private previewTimeout: number | null = null;
  private editingChart: HTMLElement | null = null;

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

    this.setupEventListeners();
  }

  private createPopupItems(): PopupItem[] {
    const items: PopupItem[] = [
      {
        type: 'custom', // Используем тип 'custom' для кастомного контента
        id: 'chart-type-selector',
        content: () => this.createChartTypeSelector(),
      },
      {
        type: 'custom', // Используем тип 'custom' для кастомного контента
        id: 'data-editor-container',
        content: () => this.createDataEditorContainer(),
      },
      {
        type: 'custom', // Используем тип 'custom' для кастомного контента
        id: 'preview-container',
        content: () => this.createPreviewContainer(),
      },
    ];

    return items;
  }

  private createChartTypeSelector(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'chart-type-selector mb-6';

    Object.entries(CHART_TYPE_CONFIGS).forEach(([type, config]) => {
      const button = document.createElement('button');
      button.className = `chart-type-option ${type === 'bar' ? 'selected' : ''}`;
      button.dataset.type = type;

      const icon = document.createElement('span');
      icon.className = 'chart-type-icon';
      icon.innerHTML = config.icon;

      const label = document.createElement('span');
      label.className = 'chart-type-label';
      label.textContent = config.name;

      button.appendChild(icon);
      button.appendChild(label);
      container.appendChild(button);
    });

    return container;
  }

  private createDataEditorContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'data-editor-container mb-6';
    this.updateEditor('bar', container);
    return container;
  }

  private createPreviewContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className =
      'preview-container h-64 bg-gray-50 rounded-lg flex items-center justify-center';
    container.innerHTML = '<div class="text-gray-400">Chart preview will appear here</div>';
    return container;
  }

  private handlePopupClick = (e: Event): void => {
    const button = (e.target as Element).closest('.chart-type-option');
    if (!button) return;

    const type = button.getAttribute('data-type') as ChartType;
    if (!type) return;

    const popupElement = this.popup.getElement();
    popupElement
      .querySelectorAll('.chart-type-option')
      .forEach((opt) => opt.classList.toggle('selected', opt === button));

    this.selectedType = type;
    this.updateEditor(type);
  };

  private setupEventListeners(): void {
    const popupElement = this.popup.getElement();
    popupElement.addEventListener('click', this.handlePopupClick);
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

  private schedulePreviewUpdate(data: ChartSeries[]): void {
    if (this.previewTimeout) {
      window.clearTimeout(this.previewTimeout);
    }

    this.previewTimeout = window.setTimeout(() => {
      this.updatePreview(data);
    }, 100);
  }

  private updatePreview(data: ChartSeries[]): void {
    const previewContainer = this.popup.getElement()?.querySelector('.preview-container');
    if (!previewContainer) return;

    const canvas = this.renderer.createChart(this.selectedType, data, {
      width: previewContainer.clientWidth || 400,
      height: previewContainer.clientHeight || 300,
    });

    previewContainer.innerHTML = '';
    previewContainer.appendChild(canvas);
  }

  private handleSubmit(): void {
    const data = this.currentEditor.getData();
    if (!data || (Array.isArray(data) && data.length === 0)) return;

    if (this.editingChart) {
      // Update existing chart
      this.editingChart.setAttribute('data-chart-type', this.selectedType);
      this.editingChart.setAttribute('data-chart-data', JSON.stringify(data));

      const canvas = this.renderer.createChart(this.selectedType, data, {
        width: this.editingChart.clientWidth || 800,
        height: this.editingChart.clientHeight || 400,
      });

      this.editingChart.innerHTML = '';
      this.editingChart.appendChild(canvas);
    } else {
      // Create new chart
      const chartContainer = document.createElement('div');
      chartContainer.className = 'chart-container';
      chartContainer.style.width = '100%';
      chartContainer.style.height = '400px';
      chartContainer.setAttribute('data-chart-type', this.selectedType);
      chartContainer.setAttribute('data-chart-data', JSON.stringify(data));

      const canvas = this.renderer.createChart(this.selectedType, data, {
        width: chartContainer.clientWidth || 800,
        height: chartContainer.clientHeight || 400,
      });
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

  public edit(chartElement: HTMLElement): void {
    this.editingChart = chartElement;

    // Get current chart data
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

        this.popup.show();
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

  public destroy(): void {
    // Очистка обработчиков событий
    const popupElement = this.popup.getElement();
    if (popupElement) {
      popupElement.removeEventListener('click', this.handlePopupClick);
    }

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
