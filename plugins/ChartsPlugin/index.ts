import './style.scss';

import { definePlugin, insertAtomAfter, foreign, pluginToolbarPlacement } from '@on-codemerge/sdk';
import type { PluginToolbarOpts, WidgetContext, ViewSpec } from '@on-codemerge/sdk';
import { barIcon } from '@ocm/wysiwyg/icons';
import { ChartMenu } from './components/ChartMenu';
import { renderChartPublish } from './publish/preview';
import { mountChartWidget } from './widgets/mountChartWidget';
import { parseChartDataJson } from './utils/validation';

const DEFAULT_CHART_DATA = [
  {
    name: 'Series 1',
    data: [
      { label: 'A', value: 3 },
      { label: 'B', value: 7 },
      { label: 'C', value: 5 },
    ],
  },
];

function chartAttrsFromElement(el: HTMLElement): Record<string, unknown> {
  return {
    chartType: el.dataset.chartType ?? 'bar',
    // SoT: typed series array (DOM dataset via attrToHtmlValue).
    data: parseChartDataJson(el.dataset.chartData ?? '[]'),
    title: el.dataset.chartTitle ?? '',
    width: Math.trunc(Number(el.style.width)) || 800,
    height: Math.trunc(Number(el.style.height)) || 400,
    showLegend: el.dataset.showLegend !== 'false',
    showGrid: el.dataset.showGrid !== 'false',
    mode: el.dataset.mode || 'default',
    orientation: el.dataset.orientation || 'vertical',
    xAxisLabel: el.dataset.xAxisLabel ?? '',
    yAxisLabel: el.dataset.yAxisLabel ?? '',
  };
}

export function ChartsPlugin(opts?: PluginToolbarOpts) {
  return definePlugin({
    commands: {
      insertChart: insertAtomAfter('chart', {
        chartType: 'bar',
        data: DEFAULT_CHART_DATA,
        title: 'Chart',
        width: 800,
        height: 400,
      }),
    },
    hotkeys: [{ keys: 'Mod-Alt-g', command: 'insertChart', description: 'Insert chart' }],
    name: 'charts',
    nodes: [
      {
        name: 'chart',
        group: 'atom',
        atom: true,
        attrs: {
          chartType: 'bar',
          data: [],
          title: 'Chart',
          width: 800,
          height: 400,
          align: '',
          showLegend: true,
          showGrid: true,
          mode: 'default',
          orientation: 'vertical',
          xAxisLabel: '',
          yAxisLabel: '',
        },
      },
    ],
    setup(ctx) {
      const editor = ctx.editor;
      const menu = new ChartMenu(editor, ctx.scope);

      ctx.toolbar.add({
        id: 'chart',
        icon: barIcon,
        title: () => editor.t('charts.insert'),
        ...pluginToolbarPlacement({ menu: 'insert', order: 50 }, opts),
        onClick: () => {
          menu.show((chartElement) => {
            editor.run(insertAtomAfter('chart', chartAttrsFromElement(chartElement)));
          });
        },
      });
    },
    widgets: {
      chart: {
        render(attrs, wctx: WidgetContext): ViewSpec {
          return foreign((host, scope) => {
            mountChartWidget(host, attrs, () => wctx.editor, scope);
          });
        },
      },
    },
    publish: {
      node: 'chart',
      render: (attrs) => renderChartPublish(attrs),
    },
  });
}
