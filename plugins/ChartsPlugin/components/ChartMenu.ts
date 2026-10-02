import {
  PopupController,
  STUDIO_POPUP_CLASS,
  foreign,
  h,
  mount,
  studioPaneTabs,
  syncStudioPanel,
} from '@codemerge/sdk';
import type { DisposableScope, EditorAPI, MountHandle, ViewSpec } from '@codemerge/sdk';
import type { ChartType, ChartSeries } from '../types';
import type { ChartAttrs } from '../io';
import { emptyChartAttrs } from '../io';
import { ChartDataTable } from './ChartDataTable';
import { DRIVERS, getDriver, renderChart } from '../drivers';
import {
  isChartType,
  normalizeChartData,
  parseChartDataJson,
  parseChartMode,
  parseChartOrientation,
} from '../utils/validation';
import { downloadPngFromHost, optionsFromAttrs } from '../utils/options';
import { CHART_TEMPLATES } from '../templates/starters';

/** Chart studio — type grid, options, preview, driver-backed data table. */
export class ChartMenu {
  private readonly editor: EditorAPI;
  private readonly popups: PopupController;
  private table: ChartDataTable;
  private selectedType: ChartType = 'bar';
  private chartTitle = '';
  private xAxisLabel = '';
  private yAxisLabel = '';
  private showLegend = true;
  private showGrid = true;
  private chartWidth = 800;
  private chartHeight = 400;
  private chartMode: 'default' | 'stacked' | 'grouped' = 'default';
  private chartOrientation: 'vertical' | 'horizontal' = 'vertical';
  private editorHost: HTMLElement | null = null;
  private previewHost: HTMLElement | null = null;
  private readonly typeOptionEls = new Map<string, HTMLElement>();
  private pendingEditData: ChartSeries[] | null = null;
  private liveChange: (() => void) | null = null;
  private studioMount: MountHandle | null = null;
  private tabsMount: MountHandle | null = null;
  private studioBody: HTMLElement | null = null;
  private tabsHost: HTMLElement | null = null;
  private mobilePanel: 'options' | 'main' = 'main';
  private previewTimeout: ReturnType<typeof setTimeout> | null = null;
  private deferTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(editor: EditorAPI, scope: DisposableScope) {
    this.editor = editor;
    this.popups = new PopupController((o) => editor.ui.popup.open(o), scope);
    this.table = new ChartDataTable(editor, 'bar', (series) => {
      this.schedulePreview(series);
    });
    scope.disposable(() => this.clearTimers());
  }

  private clearTimers(): void {
    if (this.previewTimeout !== null) {
      globalThis.clearTimeout(this.previewTimeout);
      this.previewTimeout = null;
    }
    if (this.deferTimeout !== null) {
      globalThis.clearTimeout(this.deferTimeout);
      this.deferTimeout = null;
    }
  }

  private defer(fn: () => void): void {
    if (this.deferTimeout !== null) {
      globalThis.clearTimeout(this.deferTimeout);
    }
    this.deferTimeout = globalThis.setTimeout(() => {
      this.deferTimeout = null;
      fn();
    }, 0);
  }

  private schedulePreview(series: ChartSeries[]): void {
    if (this.previewTimeout !== null) {
      globalThis.clearTimeout(this.previewTimeout);
    }
    this.previewTimeout = globalThis.setTimeout(() => {
      this.previewTimeout = null;
      this.updatePreview(series);
      this.liveChange?.();
    }, 100);
  }

  private bumpPreview(): void {
    this.schedulePreview(this.table.getSeries());
  }

  private updatePreview(series: ChartSeries[]): void {
    const host = this.previewHost;
    if (!host) {
      return;
    }
    const pad = 32;
    const width = Math.max(280, Math.floor((host.clientWidth || 560) - pad));
    const height = Math.max(200, Math.floor((host.clientHeight || 320) - pad));
    const opts = optionsFromAttrs({
      title: this.chartTitle,
      width,
      height,
      showLegend: this.showLegend,
      showGrid: this.showGrid,
      mode: this.chartMode,
      orientation: this.chartOrientation,
      xAxisLabel: this.xAxisLabel,
      yAxisLabel: this.yAxisLabel,
    });
    const chartEl = renderChart(this.selectedType, series, opts, this.editor);
    chartEl.removeAttribute('width');
    chartEl.removeAttribute('height');
    chartEl.style.cssText =
      'display:block;max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;margin:0;';
    host.replaceChildren(chartEl);
  }

  private selectType(type: ChartType, data?: ChartSeries[]): void {
    const prev = data ?? this.table.getSeries();
    this.selectedType = type;
    for (const [key, el] of this.typeOptionEls) {
      el.classList.toggle('selected', key === type);
    }
    this.table.setType(type, prev);
    this.mountTable();
    this.bumpPreview();
  }

  private mountTable(): void {
    if (!this.editorHost) {
      return;
    }
    this.table.mountInto(this.editorHost);
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
        ...Object.values(DRIVERS).map((driver) =>
          foreign(
            (host, scope) => {
              host.className = `chart-type-option ${driver.type === this.selectedType ? 'selected' : ''}`;
              host.dataset.type = driver.type;
              this.typeOptionEls.set(driver.type, host);
              const inner = mount(
                host,
                h('fragment', null, [
                  h('div', {
                    class: 'w-10 h-10 mb-3 mx-auto flex items-center justify-center',
                    props: { innerHTML: driver.icon },
                  }),
                  h('span', null, driver.name),
                ])
              );
              scope.own(inner);
              scope.on(host, 'click', () => this.selectType(driver.type));
              scope.disposable(() => {
                if (this.typeOptionEls.get(driver.type) === host) {
                  this.typeOptionEls.delete(driver.type);
                }
              });
            },
            { key: `chart-type-${driver.type}` }
          )
        )
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

  private displaySettingsView(): ViewSpec {
    const driver = getDriver(this.selectedType);
    const kids: ViewSpec[] = [
      h('label', { class: 'flex items-center gap-2 text-sm' }, [
        h('input', {
          attrs: { type: 'checkbox' },
          props: { checked: this.showLegend },
          on: {
            change: (e) => {
              const t = e.target;
              this.showLegend = t instanceof HTMLInputElement ? t.checked : true;
              this.bumpPreview();
            },
          },
        }),
        this.editor.t('charts.showLegend'),
      ]),
      h('label', { class: 'flex items-center gap-2 text-sm' }, [
        h('input', {
          attrs: { type: 'checkbox' },
          props: { checked: this.showGrid },
          on: {
            change: (e) => {
              const t = e.target;
              this.showGrid = t instanceof HTMLInputElement ? t.checked : true;
              this.bumpPreview();
            },
          },
        }),
        'Grid',
      ]),
    ];
    if (driver.supportsMode) {
      kids.push(
        h(
          'select',
          {
            class: 'mode-select w-full rounded-ocm-sm border border-ocm-border px-2 py-1.5 text-sm',
            props: { value: this.chartMode },
            on: {
              change: (e) => {
                const t = e.target;
                if (t instanceof HTMLSelectElement) {
                  this.chartMode = parseChartMode(t.value);
                  this.bumpPreview();
                }
              },
            },
          },
          [
            h('option', { attrs: { value: 'default' } }, 'Default'),
            h('option', { attrs: { value: 'grouped' } }, 'Grouped'),
            h('option', { attrs: { value: 'stacked' } }, 'Stacked'),
          ]
        )
      );
    }
    if (driver.supportsOrientation) {
      kids.push(
        h(
          'select',
          {
            class:
              'orientation-select w-full rounded-ocm-sm border border-ocm-border px-2 py-1.5 text-sm',
            props: { value: this.chartOrientation },
            on: {
              change: (e) => {
                const t = e.target;
                if (t instanceof HTMLSelectElement) {
                  this.chartOrientation = parseChartOrientation(t.value);
                  this.bumpPreview();
                }
              },
            },
          },
          [
            h('option', { attrs: { value: 'vertical' } }, 'Vertical'),
            h('option', { attrs: { value: 'horizontal' } }, 'Horizontal'),
          ]
        )
      );
    }
    return h('div', { class: 'display-settings flex flex-col gap-2' }, kids);
  }

  private templateSelectorView(): ViewSpec {
    return h('div', { class: 'template-selector' }, [
      h(
        'select',
        {
          class:
            'template-select w-full rounded-ocm-sm border border-ocm-border px-2 py-1.5 text-sm',
          on: {
            change: (e) => {
              const t = e.target;
              if (!(t instanceof HTMLSelectElement) || !t.value) {
                return;
              }
              const tpl = CHART_TEMPLATES.find((x) => x.key === t.value);
              if (tpl) {
                this.selectType(tpl.type, tpl.data);
              }
              t.value = '';
            },
          },
        },
        [
          h('option', { attrs: { value: '' } }, this.editor.t('templates.selectTemplate')),
          ...CHART_TEMPLATES.map((tpl) => h('option', { attrs: { value: tpl.key } }, tpl.name)),
        ]
      ),
    ]);
  }

  private bodyView(): ViewSpec {
    const optionsCol = h(
      'div',
      {
        class: 'chart-ws-options',
        attrs: { 'data-ocm-studio-pane': 'options' },
      },
      [
        this.typeSelectorView(),
        this.metaFieldsView(),
        this.displaySettingsView(),
        this.templateSelectorView(),
      ]
    );

    const dataForeign = foreign(
      (host, scope) => {
        host.className = 'data-editor-container';
        this.editorHost = host;
        this.mountTable();
        if (this.pendingEditData) {
          const data = this.pendingEditData;
          this.pendingEditData = null;
          this.defer(() => {
            this.table.setSeries(data);
            this.bumpPreview();
          });
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
    );

    const previewForeign = foreign(
      (host, scope) => {
        host.className = 'preview-container';
        this.previewHost = host;
        this.bumpPreview();
        scope.disposable(() => {
          if (this.previewHost === host) {
            this.previewHost = null;
          }
        });
      },
      { key: 'chart-preview' }
    );

    const exportBtn = h('div', { class: 'export-container flex justify-center' }, [
      h(
        'button',
        {
          class: 'export-btn px-3 py-1.5 text-sm rounded-lg bg-green-600 text-white',
          attrs: { type: 'button' },
          on: {
            click: () => {
              if (this.previewHost) {
                downloadPngFromHost(this.previewHost);
              }
            },
          },
        },
        this.editor.t('charts.exportAsPng')
      ),
    ]);

    return h('div', { class: 'ocm-studio chart-ws' }, [
      h('div', { class: 'ocm-studio__tabs-host' }),
      h(
        'div',
        {
          class: 'ocm-studio__body',
          style: { '--ocm-studio-cols': 'minmax(16rem,20rem) minmax(0,1fr)' },
          attrs: { 'data-panel': this.mobilePanel },
        },
        [
          optionsCol,
          h(
            'div',
            {
              class: 'chart-ws-main',
              attrs: { 'data-ocm-studio-pane': 'main' },
            },
            [previewForeign, dataForeign, exportBtn]
          ),
        ]
      ),
    ]);
  }

  private refreshTabs(): void {
    if (!this.tabsHost) {
      return;
    }
    this.tabsMount?.destroy();
    this.tabsMount = mount(
      this.tabsHost,
      studioPaneTabs(
        [
          { id: 'main', label: 'Chart' },
          { id: 'options', label: this.editor.t('charts.chartType') || 'Options' },
        ],
        this.mobilePanel,
        (id) => {
          if (id === 'main' || id === 'options') {
            this.mobilePanel = id;
            if (this.studioBody) {
              syncStudioPanel(this.studioBody, id);
            }
            this.refreshTabs();
          }
        }
      )
    );
  }

  public getChartAttrs(): ChartAttrs {
    return emptyChartAttrs({
      chartType: this.selectedType,
      data: this.table.getSeries(),
      title: this.chartTitle,
      width: this.chartWidth,
      height: this.chartHeight,
      showLegend: this.showLegend,
      showGrid: this.showGrid,
      mode: this.chartMode,
      orientation: this.chartOrientation,
      xAxisLabel: this.xAxisLabel,
      yAxisLabel: this.yAxisLabel,
    });
  }

  public applyChartAttrs(attrs: ChartAttrs): void {
    this.selectedType = attrs.chartType;
    this.chartTitle = attrs.title;
    this.xAxisLabel = attrs.xAxisLabel;
    this.yAxisLabel = attrs.yAxisLabel;
    this.showLegend = attrs.showLegend;
    this.showGrid = attrs.showGrid;
    this.chartWidth = attrs.width;
    this.chartHeight = attrs.height;
    this.chartMode = attrs.mode;
    this.chartOrientation = attrs.orientation;
    const coerced = getDriver(attrs.chartType).coerce(normalizeChartData(attrs.data));
    this.pendingEditData = coerced;
    this.table = new ChartDataTable(this.editor, attrs.chartType, (series) => {
      this.schedulePreview(series);
    });
    if (this.editorHost) {
      this.mountTable();
      this.defer(() => {
        if (this.pendingEditData) {
          this.table.setSeries(this.pendingEditData);
          this.pendingEditData = null;
        }
        for (const [key, el] of this.typeOptionEls) {
          el.classList.toggle('selected', key === this.selectedType);
        }
        this.bumpPreview();
      });
    }
  }

  public mountStudio(
    host: HTMLElement,
    opts?: { onChange?: () => void; layout?: 'popup' | 'workspace' }
  ): { destroy: () => void } {
    this.liveChange = opts?.onChange ?? null;
    this.tabsMount?.destroy();
    this.studioMount?.destroy();
    host.classList.add('chart-ws-root', 'chart-ws-host');
    this.studioMount = mount(host, this.bodyView());
    this.studioBody = host.querySelector('.ocm-studio__body');
    this.tabsHost = host.querySelector('.ocm-studio__tabs-host');
    if (this.studioBody) {
      syncStudioPanel(this.studioBody, this.mobilePanel);
    }
    this.refreshTabs();
    return {
      destroy: () => {
        this.tabsMount?.destroy();
        this.tabsMount = null;
        this.studioMount?.destroy();
        this.studioMount = null;
        this.studioBody = null;
        this.tabsHost = null;
        this.liveChange = null;
        this.clearTimers();
        this.table.destroy();
        host.classList.remove('chart-ws-root', 'chart-ws-host');
        host.replaceChildren();
      },
    };
  }

  /** Context-menu edit → atom-style studio popup. */
  public edit(chartElement: HTMLElement): void {
    const typeRaw = chartElement.dataset.chartType ?? '';
    const dataStr = chartElement.dataset.chartData;
    if (!isChartType(typeRaw) || !dataStr) {
      return;
    }
    const attrs = emptyChartAttrs({
      chartType: typeRaw,
      data: parseChartDataJson(dataStr),
      title: chartElement.dataset.chartTitle ?? '',
      showLegend: chartElement.dataset.showLegend !== 'false',
      showGrid: chartElement.dataset.showGrid !== 'false',
      mode: parseChartMode(chartElement.dataset.mode ?? 'default'),
      orientation: parseChartOrientation(chartElement.dataset.orientation ?? 'vertical'),
      xAxisLabel: chartElement.dataset.xAxisLabel ?? '',
      yAxisLabel: chartElement.dataset.yAxisLabel ?? '',
      width: Math.trunc(Number(chartElement.style.width)) || 800,
      height: Math.trunc(Number(chartElement.style.height)) || 400,
    });
    this.applyChartAttrs(attrs);
    this.popups.open({
      title: this.editor.t('charts.editChart'),
      className: `${STUDIO_POPUP_CLASS} chart-menu`,
      size: 'lg',
      closeOnClickOutside: false,
      buttons: [
        { label: this.editor.t('common.cancel'), variant: 'secondary', onClick: () => {} },
        {
          label: this.editor.t('common.save'),
          variant: 'primary',
          onClick: () => {
            const next = this.getChartAttrs();
            chartElement.dataset.chartType = next.chartType;
            chartElement.dataset.chartData = JSON.stringify(next.data);
            this.popups.close();
          },
        },
      ],
      items: [
        {
          type: 'view',
          id: 'chart-studio',
          view: () =>
            foreign((host, scope) => {
              const studio = this.mountStudio(host, { layout: 'workspace' });
              scope.disposable(() => studio.destroy());
            }),
        },
      ],
    });
  }
}
