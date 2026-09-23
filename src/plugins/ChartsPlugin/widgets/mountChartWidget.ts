import type { EditorAPI } from '@on-codemerge/sdk';
import { attrString } from '@on-codemerge/sdk';
import type { DisposableScope } from '@on-codemerge/sdk';
import { ChartMenu } from '../components/ChartMenu';
import { ChartContextMenu } from '../components/ChartContextMenu';
import { ChartRenderer } from '../services/ChartRenderer';
import { Resizer } from '../../../utils/Resizer';
import { atomAlignStyle } from '../../../utils/atomAlign';
import type { ChartSeries, ChartType } from '../types';

/** Mount chart into atom host; all teardown via `scope`. */
export function mountChartWidget(
  el: HTMLElement,
  attrs: Record<string, unknown>,
  getApi: () => EditorAPI | null,
  scope: DisposableScope
): void {
  el.className = 'ocm-atom ocm-chart chart-container';
  el.textContent = '';
  scope.disposable(() => {
    el.textContent = '';
  });

  const api = getApi();
  if (!api) {
    el.textContent = '[chart]';
    return;
  }

  const renderer = new ChartRenderer(api);
  const type = attrString(attrs.chartType, 'bar') as ChartType;
  let data: ChartSeries[] = [];
  try {
    const raw = attrs.data;
    data = JSON.parse(typeof raw === 'string' ? raw : '[]') as ChartSeries[];
  } catch {
    data = [];
  }
  const width = Number(attrs.width) || 800;
  const height = Number(attrs.height) || 400;
  el.style.width = `${width}px`;
  el.style.height = `${height}px`;
  el.style.marginLeft = '';
  el.style.marginRight = '';
  el.style.display = '';
  const align = attrString(attrs.align, '');
  Object.assign(el.style, atomAlignStyle(align));
  el.dataset.chartType = type;
  el.dataset.chartData = JSON.stringify(data);
  el.dataset.chartTitle = attrString(attrs.title);
  el.dataset.showLegend = attrs.showLegend === false ? 'false' : 'true';
  el.dataset.showGrid = attrs.showGrid === false ? 'false' : 'true';
  el.dataset.mode = attrString(attrs.mode, 'default');
  el.dataset.orientation = attrString(attrs.orientation, 'vertical');
  el.dataset.xAxisLabel = attrString(attrs.xAxisLabel);
  el.dataset.yAxisLabel = attrString(attrs.yAxisLabel);

  const img = renderer.createChart(type, data, {
    width,
    height,
    title: attrString(attrs.title),
    xAxis: { title: attrString(attrs.xAxisLabel) },
    yAxis: { title: attrString(attrs.yAxisLabel) },
    legend: { show: attrs.showLegend !== false },
    grid: { show: attrs.showGrid !== false },
    mode: (attrs.mode as 'default' | 'stacked' | 'grouped') || 'default',
    orientation: (attrs.orientation as 'vertical' | 'horizontal') || 'vertical',
  });
  el.append(img);

  const resizer = scope.slot<Resizer>();
  const menu = new ChartMenu(api, scope);
  const ctxMenu = scope.own(new ChartContextMenu(api, menu));

  scope.on(el, 'click', () => {
    resizer.replace(
      new Resizer(el, {
        aspect: 'free',
        onBlur: () => {
          resizer.clear();
        },
        onResizeEnd: () => {
          const w = el.offsetWidth;
          const h = el.offsetHeight;
          el.style.width = `${w}px`;
          el.style.height = `${h}px`;
          const pathRaw = el.dataset.ocmPath ?? el.dataset.ocmBlock;
          if (pathRaw === undefined) {
            return;
          }
          const path = pathRaw.includes('.') ? pathRaw.split('.').map(Number) : [Number(pathRaw)];
          api.run(() => [{ type: 'set_attrs', path, attrs: { width: w, height: h } }]);
        },
      })
    );
  });

  scope.on(el, 'contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    ctxMenu.show(el, e.clientX, e.clientY);
  });
}
