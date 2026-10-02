import { attrString, h, img } from '@codemerge/sdk';
import type { ViewSpec } from '@codemerge/sdk';
import type { ChartI18n } from '../drivers';
import { renderChart } from '../drivers';
import { optionsFromAttrs } from '../utils/options';
import {
  parseChartDataJson,
  parseChartMode,
  parseChartOrientation,
  parseChartType,
} from '../utils/validation';

const stubI18n: ChartI18n = {
  t: (key: string) => key,
};

/** Static published chart — PNG data-URL from canvas (no runtime hydrate). */
export function renderChartPublish(
  attrs: Record<string, unknown>,
  editor: ChartI18n = stubI18n
): ViewSpec {
  const type = parseChartType(attrString(attrs.chartType, 'bar'));
  const data = parseChartDataJson(attrs.data);
  const width = Number(attrs.width) || 800;
  const height = Number(attrs.height) || 400;
  const title = attrString(attrs.title);
  let src = '';
  try {
    const el = renderChart(
      type,
      data,
      optionsFromAttrs({
        title,
        width,
        height,
        showLegend: attrs.showLegend !== false,
        showGrid: attrs.showGrid !== false,
        mode: parseChartMode(attrString(attrs.mode, 'default')),
        orientation: parseChartOrientation(attrString(attrs.orientation, 'vertical')),
        xAxisLabel: attrString(attrs.xAxisLabel),
        yAxisLabel: attrString(attrs.yAxisLabel),
      }),
      editor
    );
    src = el.src;
  } catch {
    src = '';
  }
  if (!src) {
    return h(
      'div',
      {
        class: 'ocm-chart-publish is-empty chart-container',
        attrs: { 'data-node': 'chart', 'data-chart-type': type },
      },
      title || 'Chart'
    );
  }
  return h(
    'div',
    {
      class: 'ocm-chart-publish chart-container',
      attrs: { 'data-node': 'chart', 'data-chart-type': type },
      style: { width: `${width}px`, maxWidth: '100%' },
    },
    [
      img({
        class: 'svg-chart',
        src,
        alt: title || 'Chart',
        attrs: { width: String(width), height: String(height) },
      }),
    ]
  );
}
