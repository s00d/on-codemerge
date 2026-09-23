import { PopupController, downloadUrl, foreign, h, mount, renderDetached } from '@on-codemerge/sdk';
import type { DisposableScope, EditorAPI, ViewSpec } from '@on-codemerge/sdk';
import { ChartRenderer } from '../services/ChartRenderer';
import type { ChartType, ChartSeries, ChartPoint } from '../types';
import { MultiSeriesDataEditor } from './MultiSeriesDataEditor';
import { ChartDataEditor } from './ChartDataEditor';
import { CHART_TYPE_CONFIGS } from '../constants/chartTypes';
import {
  isChartPoint,
  isChartSeries,
  isChartType,
  normalizeChartData,
  parseChartDataJson,
  parseChartMode,
  parseChartOrientation,
} from '../utils/validation';

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

/** Chart insert/edit — ViewSpec chrome; data editor + canvas preview in foreign hosts. */
export class ChartMenu {
  private readonly editor: EditorAPI;
  private readonly popups: PopupController;
  private readonly renderer: ChartRenderer;
  private currentEditor: ChartDataEditor | MultiSeriesDataEditor;
  private selectedType: ChartType = 'bar';
  private onInsert: ((element: HTMLElement) => void) | null = null;
  private previewTimeout: ReturnType<typeof setTimeout> | null = null;
  private editingChart: HTMLElement | null = null;
  private chartTitle = '';
  private xAxisLabel = '';
  private yAxisLabel = '';
  private showLegend = true;
  private chartWidth = 800;
  private chartHeight = 400;
  private showGrid = true;
  private chartMode: 'default' | 'stacked' | 'grouped' = 'default';
  private chartOrientation: 'vertical' | 'horizontal' = 'vertical';

  private editorHost: HTMLElement | null = null;
  private previewHost: HTMLElement | null = null;
  private readonly typeOptionEls = new Map<string, HTMLElement>();
  private pendingEditData: ChartSeries[] | ChartPoint[] | null = null;

  constructor(editor: EditorAPI, scope: DisposableScope) {
    this.editor = editor;
    this.popups = new PopupController((o) => editor.ui.popup.open(o), scope);
    this.renderer = new ChartRenderer(editor);
    this.currentEditor = new ChartDataEditor(editor, (data) => {
      this.schedulePreviewUpdate([{ name: 'Series 1', data }]);
    });
  }

  private schedulePreviewUpdate(data: ChartPoint[] | ChartSeries[]): void {
    if (this.previewTimeout) {
      globalThis.clearTimeout(this.previewTimeout);
    }
    this.previewTimeout = globalThis.setTimeout(() => {
      this.updatePreview(data);
    }, 100);
  }

  private bumpPreview(): void {
    this.schedulePreviewUpdate(this.currentEditor.getData());
  }

  private applyDataToEditor(data: ChartPoint[] | ChartSeries[]): void {
    if (this.currentEditor instanceof MultiSeriesDataEditor) {
      this.currentEditor.setData(normalizeChartData(data));
      return;
    }
    const first = data[0];
    if (first !== undefined && isChartSeries(first)) {
      this.currentEditor.setData(normalizeChartData(data)[0]?.data ?? []);
    } else if (data.every(isChartPoint)) {
      this.currentEditor.setData(data);
    }
  }

  private selectType(type: ChartType, data?: ChartPoint[] | ChartSeries[]): void {
    this.selectedType = type;
    for (const [key, el] of this.typeOptionEls) {
      el.classList.toggle('selected', key === type);
    }
    this.mountEditor(type);
    if (data) {
      globalThis.setTimeout(() => {
        this.applyDataToEditor(data);
        this.updatePreview(data);
      }, 0);
    } else {
      this.bumpPreview();
    }
  }

  private mountEditor(type: ChartType): void {
    const host = this.editorHost;
    if (!host) {
      return;
    }

    this.currentEditor.destroy();
    host.replaceChildren();

    const config = CHART_TYPE_CONFIGS[type];
    if (config.supportsMultipleSeries) {
      this.currentEditor = new MultiSeriesDataEditor(this.editor, (data) => {
        this.schedulePreviewUpdate(data);
      });
    } else {
      this.currentEditor = new ChartDataEditor(
        this.editor,
        (data) => {
          this.schedulePreviewUpdate([{ name: this.editor.t('charts.series1'), data }]);
        },
        'requiresXY' in config && config.requiresXY === true,
        type === 'scatter'
      );
    }
    this.currentEditor.mountInto(host);
  }

  private updatePreview(data: ChartPoint[] | ChartSeries[]): void {
    const previewContainer = this.previewHost;
    if (!previewContainer) {
      return;
    }

    const pad = 32;
    const width = Math.max(280, Math.floor((previewContainer.clientWidth || 560) - pad));
    const height = Math.max(200, Math.floor((previewContainer.clientHeight || 320) - pad));

    const options = {
      width,
      height,
      title: this.chartTitle,
      xAxis: { title: this.xAxisLabel },
      yAxis: { title: this.yAxisLabel },
      legend: { show: this.showLegend },
      grid: { show: this.showGrid },
      mode: this.chartMode,
      orientation: this.chartOrientation,
    };

    const chartEl = this.renderer.createChart(this.selectedType, data, options);
    chartEl.removeAttribute('width');
    chartEl.removeAttribute('height');
    chartEl.style.cssText =
      'display:block;max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;margin:0;';
    previewContainer.replaceChildren(chartEl);
  }

  private applyTemplate(key: string): void {
    const template = chartTemplates.find((t) => t.key === key);
    if (!template) {
      return;
    }
    if (!isChartType(template.type)) {
      return;
    }
    this.selectType(template.type, template.data);
  }

  private typeSelectorView(): ViewSpec {
    return h('div', { class: 'chart-type-selector' }, [
      h(
        'div',
        { class: 'text-sm font-medium text-gray-700 mb-4 block' },
        this.editor.t('charts.chartType')
      ),
      h(
        'div',
        { class: 'grid' },
        ...Object.keys(CHART_TYPE_CONFIGS)
          .filter(isChartType)
          .map((type) => {
            const config = CHART_TYPE_CONFIGS[type];
            return foreign(
              (host, scope) => {
                host.className = `chart-type-option ${type === this.selectedType ? 'selected' : ''}`;
                host.dataset.type = type;
                this.typeOptionEls.set(type, host);
                const inner = mount(
                  host,
                  h('fragment', null, [
                    h('div', {
                      class: 'w-10 h-10 mb-3 mx-auto flex items-center justify-center',
                      props: { innerHTML: config.icon },
                    }),
                    h('span', null, this.editor.t(config.name)),
                  ])
                );
                scope.own(inner);
                scope.on(host, 'click', () => {
                  this.selectType(type);
                });
                scope.disposable(() => {
                  if (this.typeOptionEls.get(type) === host) {
                    this.typeOptionEls.delete(type);
                  }
                });
              },
              { key: `chart-type-${type}` }
            );
          })
      ),
    ]);
  }

  private metaFieldsView(): ViewSpec {
    const field = (
      label: string,
      value: string,
      placeholder: string,
      onInput: (v: string) => void
    ) =>
      h('div', { class: 'flex flex-col gap-1' }, [
        h('span', { class: 'text-sm font-medium text-gray-700' }, label),
        h('input', {
          class:
            'meta-input px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all',
          attrs: { type: 'text', placeholder, value },
          on: {
            input: (e) => {
              const el = e.target;
              onInput(el instanceof HTMLInputElement ? el.value : '');
              this.bumpPreview();
            },
          },
        }),
      ]);

    return h('div', { class: 'meta-fields flex flex-col gap-3 mb-4' }, [
      field(
        this.editor.t('charts.chartTitle'),
        this.chartTitle,
        this.editor.t('charts.enterChartTitle'),
        (v) => {
          this.chartTitle = v;
        }
      ),
      field(
        this.editor.t('charts.xAxisLabel'),
        this.xAxisLabel,
        this.editor.t('charts.enterXAxisLabel'),
        (v) => {
          this.xAxisLabel = v;
        }
      ),
      field(
        this.editor.t('charts.yAxisLabel'),
        this.yAxisLabel,
        this.editor.t('charts.enterYAxisLabel'),
        (v) => {
          this.yAxisLabel = v;
        }
      ),
    ]);
  }

  private dimensionsView(): ViewSpec {
    const num = (
      label: string,
      value: number,
      min: number,
      max: number,
      onChange: (n: number) => void
    ) =>
      h('div', { class: 'flex flex-col gap-1' }, [
        h('span', { class: 'text-sm font-medium text-gray-700' }, label),
        h('input', {
          class: 'dimension-input px-2 py-1 rounded border border-gray-300 text-sm',
          attrs: {
            type: 'number',
            min: String(min),
            max: String(max),
            step: '50',
            value: String(value),
          },
          on: {
            change: (e) => {
              const el = e.target;
              onChange(Math.trunc(Number(el instanceof HTMLInputElement ? el.value : '')) || value);
              this.bumpPreview();
            },
          },
        }),
      ]);

    return h('div', { class: 'dimensions-selector flex gap-4 mb-4' }, [
      num(this.editor.t('common.width'), this.chartWidth, 200, 1200, (n) => {
        this.chartWidth = n;
      }),
      num(this.editor.t('common.height'), this.chartHeight, 150, 800, (n) => {
        this.chartHeight = n;
      }),
    ]);
  }

  private displaySettingsView(): ViewSpec {
    return h(
      'div',
      { class: 'display-settings flex flex-col gap-3 mb-4 p-3 bg-gray-50 rounded-lg' },
      [
        h(
          'span',
          { class: 'text-sm font-medium text-gray-700 mb-2' },
          this.editor.t('common.displaySettings')
        ),
        h('label', { class: 'flex items-center gap-2 text-sm' }, [
          h('input', {
            class: 'setting-checkbox',
            attrs: { type: 'checkbox' },
            props: { checked: this.showLegend },
            on: {
              change: (e) => {
                const el = e.target;
                this.showLegend = el instanceof HTMLInputElement ? el.checked : false;
                this.bumpPreview();
              },
            },
          }),
          this.editor.t('charts.showLegend'),
        ]),
        h('label', { class: 'flex items-center gap-2 text-sm' }, [
          h('input', {
            class: 'setting-checkbox',
            attrs: { type: 'checkbox' },
            props: { checked: this.showGrid },
            on: {
              change: (e) => {
                const el = e.target;
                this.showGrid = el instanceof HTMLInputElement ? el.checked : false;
                this.bumpPreview();
              },
            },
          }),
          this.editor.t('common.showGrid'),
        ]),
        h('div', { class: 'flex items-center gap-2' }, [
          h('span', { class: 'text-sm' }, this.editor.t('common.barAreaMode')),
          h(
            'select',
            {
              class: 'mode-select px-2 py-1 rounded border border-gray-300 text-sm',
              props: { value: this.chartMode },
              on: {
                change: (e) => {
                  const el = e.target;
                  if (el instanceof HTMLSelectElement) {
                    this.chartMode = parseChartMode(el.value);
                  }
                  this.bumpPreview();
                },
              },
            },
            ...(['default', 'stacked', 'grouped'] as const).map((mode) =>
              h(
                'option',
                { attrs: { value: mode } },
                this.editor.t(mode.charAt(0).toUpperCase() + mode.slice(1))
              )
            )
          ),
        ]),
        h('div', { class: 'flex items-center gap-2' }, [
          h('span', { class: 'text-sm' }, this.editor.t('common.orientation')),
          h(
            'select',
            {
              class: 'orientation-select px-2 py-1 rounded border border-gray-300 text-sm',
              props: { value: this.chartOrientation },
              on: {
                change: (e) => {
                  const el = e.target;
                  if (el instanceof HTMLSelectElement) {
                    this.chartOrientation = parseChartOrientation(el.value);
                  }
                  this.bumpPreview();
                },
              },
            },
            ...(['vertical', 'horizontal'] as const).map((orient) =>
              h(
                'option',
                { attrs: { value: orient } },
                this.editor.t(orient.charAt(0).toUpperCase() + orient.slice(1))
              )
            )
          ),
        ]),
      ]
    );
  }

  private templateSelectorView(): ViewSpec {
    return h('div', { class: 'template-selector flex flex-col gap-2 mb-4' }, [
      h('span', { class: 'text-sm font-medium text-gray-700' }, this.editor.t('common.templates')),
      h(
        'select',
        {
          class:
            'template-select px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white',
          on: {
            change: (e) => {
              const el = e.target;
              const key = el instanceof HTMLSelectElement ? el.value : '';
              if (key) {
                this.applyTemplate(key);
              }
            },
          },
        },
        h('option', { attrs: { value: '' } }, this.editor.t('templates.selectTemplate')),
        ...chartTemplates.map((tpl) => h('option', { attrs: { value: tpl.key } }, tpl.name))
      ),
    ]);
  }

  private exportView(): ViewSpec {
    return h('div', { class: 'export-container flex justify-center mt-4' }, [
      h(
        'button',
        {
          class:
            'export-btn px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 font-medium',
          attrs: { type: 'button' },
          on: {
            click: () => {
              this.exportPreviewAsPNG();
            },
          },
        },
        this.editor.t('charts.exportAsPng')
      ),
    ]);
  }

  private bodyView(): ViewSpec {
    return h('div', { class: 'chart-menu-body' }, [
      this.typeSelectorView(),
      this.metaFieldsView(),
      this.dimensionsView(),
      this.displaySettingsView(),
      this.templateSelectorView(),
      foreign(
        (host, scope) => {
          host.className = 'data-editor-container mb-6';
          this.editorHost = host;
          this.mountEditor(this.selectedType);
          if (this.pendingEditData) {
            const data = this.pendingEditData;
            this.pendingEditData = null;
            globalThis.setTimeout(() => {
              this.applyDataToEditor(data);
              this.updatePreview(data);
            }, 0);
          } else {
            this.bumpPreview();
          }
          scope.disposable(() => {
            if (this.editorHost === host) {
              this.editorHost = null;
            }
          });
        },
        { key: 'chart-data-editor' }
      ),
      foreign(
        (host, scope) => {
          host.className = 'preview-container';
          host.textContent = this.editor.t('math.chartPreviewWillAppearHere');
          this.previewHost = host;
          // Wait for popup layout so clientWidth/Height are real.
          requestAnimationFrame(() => {
            if (this.previewHost === host) {
              this.bumpPreview();
            }
          });
          scope.disposable(() => {
            if (this.previewHost === host) {
              this.previewHost = null;
            }
          });
        },
        { key: 'chart-preview' }
      ),
      this.exportView(),
    ]);
  }

  private openModal(): void {
    const editing = Boolean(this.editingChart);
    this.popups.open({
      title: editing ? this.editor.t('common.editChart') : this.editor.t('charts.insert'),
      className: 'chart-menu',
      size: 'lg',
      closeOnClickOutside: true,
      buttons: [
        {
          label: this.editor.t('common.cancel'),
          variant: 'secondary',
          onClick: () => {},
        },
        {
          label: editing ? this.editor.t('common.save') : this.editor.t('common.insert'),
          variant: 'primary',
          onClick: () => {
            this.handleSubmit();
          },
        },
      ],
      items: [{ type: 'view', id: 'chart-body', view: () => this.bodyView() }],
    });
  }

  private exportPreviewAsPNG(): void {
    const previewContainer = this.previewHost;
    if (!previewContainer) {
      return;
    }
    const img = previewContainer.querySelector('img.svg-chart');
    if (img instanceof HTMLImageElement && img.src) {
      downloadUrl(img.src, 'chart.png');
      return;
    }
    const canvas = previewContainer.querySelector('canvas');
    if (canvas) {
      downloadUrl(canvas.toDataURL('image/png'), 'chart.png');
    }
  }

  private handleSubmit(): void {
    const data = this.currentEditor.getData();
    // oxlint-disable-next-line typescript/strict-boolean-expressions -- non-null object guard
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return;
    }
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
      this.editingChart.dataset.chartType = this.selectedType;
      this.editingChart.dataset.chartData = JSON.stringify(data);
      this.editingChart.dataset.chartTitle = this.chartTitle;
      this.editingChart.dataset.showLegend = this.showLegend ? 'true' : 'false';
      this.editingChart.dataset.showGrid = this.showGrid ? 'true' : 'false';
      this.editingChart.dataset.mode = this.chartMode;
      this.editingChart.dataset.orientation = this.chartOrientation;
      this.editingChart.dataset.xAxisLabel = this.xAxisLabel;
      this.editingChart.dataset.yAxisLabel = this.yAxisLabel;
      this.editingChart.style.width = `${options.width}px`;
      this.editingChart.style.height = `${options.height}px`;
      const canvas = this.renderer.createChart(this.selectedType, data, options);
      this.editingChart.replaceChildren(canvas);
      const pathRaw = this.editingChart.dataset.ocmPath ?? this.editingChart.dataset.ocmBlock;
      if (pathRaw !== undefined) {
        const path = pathRaw.includes('.') ? pathRaw.split('.').map(Number) : [Number(pathRaw)];
        this.editor.run(() => [
          {
            type: 'set_attrs',
            path,
            attrs: {
              chartType: this.selectedType,
              data: JSON.stringify(data),
              title: this.chartTitle,
              width: options.width,
              height: options.height,
              showLegend: this.showLegend,
              showGrid: this.showGrid,
              mode: this.chartMode,
              orientation: this.chartOrientation,
              xAxisLabel: this.xAxisLabel,
              yAxisLabel: this.yAxisLabel,
            },
          },
        ]);
      }
    } else {
      const { el: chartContainer } = renderDetached(
        h('div', {
          class: 'chart-container',
          style: { width: `${options.width}px`, height: `${options.height}px` },
          attrs: {
            'data-chart-type': this.selectedType,
            'data-chart-data': JSON.stringify(data),
            'data-chart-title': this.chartTitle,
            'data-show-legend': this.showLegend ? 'true' : 'false',
            'data-show-grid': this.showGrid ? 'true' : 'false',
            'data-mode': this.chartMode,
            'data-orientation': this.chartOrientation,
            'data-x-axis-label': this.xAxisLabel,
            'data-y-axis-label': this.yAxisLabel,
          },
        })
      );
      chartContainer.append(this.renderer.createChart(this.selectedType, data, options));
      this.onInsert?.(chartContainer);
    }
    this.popups.close();
  }

  public show(onInsert: (element: HTMLElement) => void): void {
    this.editingChart = null;
    this.pendingEditData = null;
    this.chartTitle = '';
    this.xAxisLabel = '';
    this.yAxisLabel = '';
    this.showLegend = true;
    this.showGrid = true;
    this.chartWidth = 800;
    this.chartHeight = 400;
    this.chartMode = 'default';
    this.chartOrientation = 'vertical';
    this.selectedType = 'bar';
    this.onInsert = onInsert;
    this.openModal();
  }

  public edit(chartElement: HTMLElement, hidden = false): void {
    this.editingChart = chartElement;
    const typeRaw = chartElement.dataset.chartType ?? '';
    const dataStr = chartElement.dataset.chartData;
    if (!isChartType(typeRaw) || !dataStr) {
      return;
    }

    try {
      const data = parseChartDataJson(dataStr);
      this.selectedType = typeRaw;
      this.pendingEditData = data;
      this.chartTitle = chartElement.dataset.chartTitle ?? '';
      this.xAxisLabel = chartElement.dataset.xAxisLabel ?? '';
      this.yAxisLabel = chartElement.dataset.yAxisLabel ?? '';
      this.showLegend = chartElement.dataset.showLegend !== 'false';
      this.showGrid = chartElement.dataset.showGrid !== 'false';
      this.chartWidth = Math.trunc(Number(chartElement.style.width)) || 800;
      this.chartHeight = Math.trunc(Number(chartElement.style.height)) || 400;
      this.chartMode = parseChartMode(chartElement.dataset.mode ?? 'default');
      this.chartOrientation = parseChartOrientation(chartElement.dataset.orientation ?? 'vertical');
      if (hidden) {
        this.mountEditor(typeRaw);
        globalThis.setTimeout(() => {
          this.applyDataToEditor(data);
        }, 0);
      } else {
        this.openModal();
      }
    } catch (error) {
      console.error('Failed to parse chart data:', error);
    }
  }

  public redrawChart(
    container: HTMLElement,
    type: ChartType,
    data: ChartSeries[],
    dimensions: { width: number; height: number }
  ): void {
    container.replaceChildren(this.renderer.createChart(type, data, dimensions));
  }
}
