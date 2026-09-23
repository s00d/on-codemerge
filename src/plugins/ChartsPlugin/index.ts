import './style.scss';

import { definePlugin, insertAtomAfter, foreign } from '@on-codemerge/sdk';
import type { WidgetContext, ViewSpec } from '@on-codemerge/sdk';
import { barIcon } from '../../icons';
import { ChartMenu } from './components/ChartMenu';
import { mountChartWidget } from './widgets/mountChartWidget';

function chartAttrsFromElement(el: HTMLElement): Record<string, unknown> {
  return {
    chartType: el.dataset.chartType ?? 'bar',
    data: el.dataset.chartData ?? '[]',
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

export function ChartsPlugin() {
  return definePlugin({
    commands: {
      insertChart: insertAtomAfter('chart', {
        chartType: 'bar',
        data: JSON.stringify([
          {
            name: 'Series 1',
            data: [
              { label: 'A', value: 3 },
              { label: 'B', value: 7 },
              { label: 'C', value: 5 },
            ],
          },
        ]),
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
          data: '[]',
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
        title: editor.t('charts.insert'),
        menu: 'insert',
        order: 50,
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
  });
}
