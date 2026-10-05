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
import type { ChartAttrs } from '../io/adapters';
import { emptyChartAttrs } from '../io/adapters';
import { ChartDataTable } from './ChartDataTable';
import { DRIVERS, getDriver } from '../drivers/registry';
import { renderChart } from '../drivers/renderChart';
import {
  isChartType,
  normalizeChartData,
  parseChartDataJson,
  parseChartMode,
  parseChartOrientation,
} from '../utils/validation';
import { downloadPngFromHost, optionsFromAttrs } from '../utils/options';
import { isMermaidChartType } from '../drivers/toMermaidSource';
import { CHART_TEMPLATES } from '../templates/starters';

type EditorTab = 'type' | 'data' | 'settings';

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
  private previewRo: ResizeObserver | null = null;
  private previewSize = { w: 0, h: 0 };
  private titleHost: HTMLElement | null = null;
  private titleMount: MountHandle | null = null;
  private settingsHost: HTMLElement | null = null;
  private settingsMount: MountHandle | null = null;
  private readonly typeOptionEls = new Map<string, HTMLElement>();
  private pendingEditData: ChartSeries[] | null = null;
  private liveChange: (() => void) | null = null;
  private studioMount: MountHandle | null = null;
  private tabsMount: MountHandle | null = null;
  private editorTabsMount: MountHandle | null = null;
  private studioBody: HTMLElement | null = null;
  private tabsHost: HTMLElement | null = null;
  private editorPane: HTMLElement | null = null;
  private editorTabsHost: HTMLElement | null = null;
  /** Left-pane sub-tab: type grid, series data, or chart settings. */
  private editorTab: EditorTab = 'type';
  /** Narrow viewport: editor column vs preview. */
  private mobilePanel: 'editor' | 'main' = 'main';
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

  private bindPreviewHost(host: HTMLElement): void {
    this.previewRo?.disconnect();
    this.previewHost = host;
    this.previewSize = { w: 0, h: 0 };
    if (typeof ResizeObserver !== 'undefined') {
      this.previewRo = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry === undefined) {
          return;
        }
        const w = Math.floor(entry.contentRect.width);
        const height = Math.floor(entry.contentRect.height);
        if (w < 64 || height < 64) {
          return;
        }
        if (Math.abs(w - this.previewSize.w) < 8 && Math.abs(height - this.previewSize.h) < 8) {
          return;
        }
        this.previewSize = { w, h: height };
        this.bumpPreview();
      });
      this.previewRo.observe(host);
    }
    this.bumpPreview();
  }

  private unbindPreviewHost(host: HTMLElement): void {
    if (this.previewHost === host) {
      this.previewRo?.disconnect();
      this.previewRo = null;
      this.previewHost = null;
      this.previewSize = { w: 0, h: 0 };
    }
  }

  private updatePreview(series: ChartSeries[]): void {
    const host = this.previewHost;
    if (!host) {
      return;
    }
    const pad = 8;
    const width = Math.max(240, Math.floor((this.previewSize.w || host.clientWidth || 560) - pad));
    const height = Math.max(
      180,
      Math.floor((this.previewSize.h || host.clientHeight || 360) - pad)
    );
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
      'display:block;width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain;margin:0;';
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
    this.remountSettings();
    this.bumpPreview();
    // After picking a chart type, jump to series editing.
    this.setEditorTab('data');
  }

  public exportPng(): void {
    if (this.previewHost) {
      downloadPngFromHost(this.previewHost);
    }
  }

  private setEditorTab(tab: EditorTab): void {
    if (this.editorTab === tab && this.editorPane?.dataset.editorTab === tab) {
      return;
    }
    this.editorTab = tab;
    if (this.editorPane) {
      this.editorPane.dataset.editorTab = tab;
    }
    this.refreshEditorTabs();
  }

  private remountTitle(): void {
    if (!this.titleHost) {
      return;
    }
    this.titleMount?.destroy();
    this.titleMount = mount(this.titleHost, this.titleFieldView());
  }

  private remountSettings(): void {
    if (!this.settingsHost) {
      return;
    }
    this.settingsMount?.destroy();
    this.settingsMount = mount(
      this.settingsHost,
      h('div', { class: 'chart-ws-editor__settings-body flex flex-col gap-4' }, [
        this.axisFieldsView(),
        this.displaySettingsView(),
      ])
    );
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

  private metaField(
    label: string,
    value: string,
    placeholder: string,
    onInput: (v: string) => void
  ): ViewSpec {
    return h('div', { class: 'flex flex-col gap-1' }, [
      h('span', { class: 'text-sm font-medium text-ocm-text' }, label),
      h('input', {
        class:
          'meta-input w-full rounded-ocm-sm border border-ocm-border bg-ocm-surface px-2.5 py-2 text-sm text-ocm-text',
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
  }

  /** Always visible above editor tabs — rename without leaving Type/Data. */
  private titleFieldView(): ViewSpec {
    return h('div', { class: 'chart-ws-editor__title shrink-0' }, [
      this.metaField(
        this.editor.t('charts.chartTitle'),
        this.chartTitle,
        this.editor.t('charts.enterChartTitle'),
        (v) => {
          this.chartTitle = v;
        }
      ),
    ]);
  }

  private axisFieldsView(): ViewSpec {
    return h('div', { class: 'meta-fields flex flex-col gap-3' }, [
      this.metaField(
        this.editor.t('charts.xAxisLabel'),
        this.xAxisLabel,
        this.editor.t('charts.enterXAxisLabel'),
        (v) => {
          this.xAxisLabel = v;
        }
      ),
      this.metaField(
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
    const kids: ViewSpec[] = [];
    // Legend/grid/orientation only affect canvas (scatter/bubble). Mermaid-backed
    // types ignore them in SVG — keep attrs for SoT but don't show dead toggles.
    if (!isMermaidChartType(this.selectedType)) {
      kids.push(
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
          this.editor.t('common.showGrid') || 'Grid',
        ])
      );
    }
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
    const titleForeign = foreign(
      (host, scope) => {
        host.className = 'chart-ws-editor__title-host shrink-0';
        this.titleHost = host;
        this.remountTitle();
        scope.disposable(() => {
          if (this.titleHost === host) {
            this.titleMount?.destroy();
            this.titleMount = null;
            this.titleHost = null;
          }
        });
      },
      { key: 'chart-title' }
    );

    const typePanel = h(
      'div',
      {
        class: 'chart-ws-editor__type',
        attrs: { 'data-chart-editor-panel': 'type' },
      },
      [this.typeSelectorView(), this.templateSelectorView()]
    );

    const dataForeign = foreign(
      (host, scope) => {
        host.className = 'data-editor-container chart-ws-editor__data';
        host.dataset.chartEditorPanel = 'data';
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

    const settingsForeign = foreign(
      (host, scope) => {
        host.className = 'chart-ws-editor__settings';
        host.dataset.chartEditorPanel = 'settings';
        this.settingsHost = host;
        this.remountSettings();
        scope.disposable(() => {
          if (this.settingsHost === host) {
            this.settingsMount?.destroy();
            this.settingsMount = null;
            this.settingsHost = null;
          }
        });
      },
      { key: 'chart-settings' }
    );

    const previewForeign = foreign(
      (host, scope) => {
        host.className = 'preview-container chart-ws-preview';
        this.bindPreviewHost(host);
        scope.disposable(() => {
          this.unbindPreviewHost(host);
        });
      },
      { key: 'chart-preview' }
    );

    const editorCol = h(
      'div',
      {
        class: 'chart-ws-editor',
        attrs: {
          'data-ocm-studio-pane': 'editor',
          'data-editor-tab': this.editorTab,
        },
      },
      [
        titleForeign,
        h('div', { class: 'chart-ws-editor__tabs-host' }),
        typePanel,
        dataForeign,
        settingsForeign,
      ]
    );

    return h('div', { class: 'ocm-studio chart-ws' }, [
      h('div', { class: 'ocm-studio__tabs-host' }),
      h(
        'div',
        {
          class: 'ocm-studio__body',
          style: { '--ocm-studio-cols': 'minmax(0,1fr) minmax(0,1fr)' },
          attrs: { 'data-panel': this.mobilePanel },
        },
        [
          editorCol,
          h(
            'div',
            {
              class: 'chart-ws-main',
              attrs: { 'data-ocm-studio-pane': 'main' },
            },
            [previewForeign]
          ),
        ]
      ),
    ]);
  }

  private editorTabButton(id: EditorTab, label: string): ViewSpec {
    return h(
      'button',
      {
        class: `chart-ws-editor__tab${this.editorTab === id ? ' is-active' : ''}`,
        attrs: {
          type: 'button',
          role: 'tab',
          'aria-selected': this.editorTab === id ? 'true' : 'false',
          'data-chart-editor-tab': id,
        },
        on: {
          click: () => {
            this.setEditorTab(id);
          },
        },
      },
      label
    );
  }

  private refreshEditorTabs(): void {
    if (!this.editorTabsHost) {
      return;
    }
    this.editorTabsMount?.destroy();
    const typeLabel = this.editor.t('charts.chartType') || 'Chart type';
    const dataLabel = this.editor.t('charts.seriesData') || 'Data';
    const settingsLabel = this.editor.t('charts.settings') || 'Settings';
    this.editorTabsMount = mount(
      this.editorTabsHost,
      h('div', { class: 'chart-ws-editor__tabs', attrs: { role: 'tablist' } }, [
        this.editorTabButton('type', typeLabel),
        this.editorTabButton('data', dataLabel),
        this.editorTabButton('settings', settingsLabel),
      ])
    );
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
          { id: 'main', label: this.editor.t('charts.preview') || 'Preview' },
          { id: 'editor', label: this.editor.t('charts.edit') || 'Edit' },
        ],
        this.mobilePanel,
        (id) => {
          if (id === 'main' || id === 'editor') {
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
    this.remountTitle();
    this.remountSettings();
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
    this.editorTabsMount?.destroy();
    this.tabsMount?.destroy();
    this.studioMount?.destroy();
    host.classList.add('chart-ws-root', 'chart-ws-host');
    // Shell content also carries ocm-content padding/overflow-auto — pin fill height.
    host.style.overflow = 'hidden';
    host.style.padding = '0';
    host.style.minHeight = '0';
    host.style.flex = '1 1 0';
    host.style.display = 'flex';
    host.style.flexDirection = 'column';
    this.studioMount = mount(host, this.bodyView());
    this.studioBody = host.querySelector('.ocm-studio__body');
    this.tabsHost = host.querySelector('.ocm-studio__tabs-host');
    this.editorPane = host.querySelector('.chart-ws-editor');
    this.editorTabsHost = host.querySelector('.chart-ws-editor__tabs-host');
    if (this.editorPane) {
      this.editorPane.dataset.editorTab = this.editorTab;
    }
    if (this.studioBody) {
      syncStudioPanel(this.studioBody, this.mobilePanel);
    }
    this.refreshEditorTabs();
    this.refreshTabs();
    return {
      destroy: () => {
        this.editorTabsMount?.destroy();
        this.editorTabsMount = null;
        this.tabsMount?.destroy();
        this.tabsMount = null;
        this.titleMount?.destroy();
        this.titleMount = null;
        this.titleHost = null;
        this.settingsMount?.destroy();
        this.settingsMount = null;
        this.settingsHost = null;
        this.studioMount?.destroy();
        this.studioMount = null;
        this.studioBody = null;
        this.tabsHost = null;
        this.editorPane = null;
        this.editorTabsHost = null;
        this.liveChange = null;
        this.previewRo?.disconnect();
        this.previewRo = null;
        this.clearTimers();
        this.table.destroy();
        host.classList.remove('chart-ws-root', 'chart-ws-host');
        host.style.overflow = '';
        host.style.padding = '';
        host.style.minHeight = '';
        host.style.flex = '';
        host.style.display = '';
        host.style.flexDirection = '';
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
