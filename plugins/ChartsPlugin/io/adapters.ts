import type { DocNode } from '@codemerge/kernel';
import { nextId } from '@codemerge/kernel';
import type { ChartPoint, ChartSeries, ChartType } from '../types';
import {
  isChartType,
  normalizeChartData,
  parseChartMode,
  parseChartOrientation,
} from '../utils/validation';

export type ChartAttrs = {
  chartType: ChartType;
  data: ChartSeries[] | ChartPoint[];
  title: string;
  width: number;
  height: number;
  showLegend: boolean;
  showGrid: boolean;
  mode: 'default' | 'stacked' | 'grouped';
  orientation: 'vertical' | 'horizontal';
  xAxisLabel: string;
  yAxisLabel: string;
  align: string;
};

export const DEFAULT_CHART_DATA: ChartSeries[] = [
  {
    name: 'Series 1',
    data: [
      { label: 'A', value: 3 },
      { label: 'B', value: 7 },
      { label: 'C', value: 5 },
    ],
  },
];

export function emptyChartAttrs(partial?: Partial<ChartAttrs>): ChartAttrs {
  return {
    chartType: 'bar',
    data: DEFAULT_CHART_DATA,
    title: 'Chart',
    width: 800,
    height: 400,
    showLegend: true,
    showGrid: true,
    mode: 'default',
    orientation: 'vertical',
    xAxisLabel: '',
    yAxisLabel: '',
    align: '',
    ...partial,
  };
}

export function isChartAttrs(value: unknown): value is ChartAttrs {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  if (!('chartType' in value) || !('data' in value)) {
    return false;
  }
  return typeof value.chartType === 'string' && Array.isArray(value.data);
}

export function normalizeChartAttrs(raw: unknown): ChartAttrs {
  if (!isChartAttrs(raw)) {
    return emptyChartAttrs();
  }
  const chartType = isChartType(raw.chartType) ? raw.chartType : 'bar';
  return emptyChartAttrs({
    chartType,
    data: normalizeChartData(raw.data),
    title: typeof raw.title === 'string' ? raw.title : 'Chart',
    width: Math.trunc(raw.width) || 800,
    height: Math.trunc(raw.height) || 400,
    showLegend: raw.showLegend,
    showGrid: raw.showGrid,
    mode: parseChartMode(raw.mode),
    orientation: parseChartOrientation(raw.orientation),
    xAxisLabel: typeof raw.xAxisLabel === 'string' ? raw.xAxisLabel : '',
    yAxisLabel: typeof raw.yAxisLabel === 'string' ? raw.yAxisLabel : '',
    align: typeof raw.align === 'string' ? raw.align : '',
  });
}

export function toEditorDoc(chart: DocNode): DocNode {
  if (chart.type !== 'chart') {
    throw new TypeError('toEditorDoc expects type "chart"');
  }
  return {
    type: 'doc',
    id: nextId('doc'),
    content: [chart],
  };
}

export function isChartEditorDoc(doc: DocNode): boolean {
  return (
    doc.type === 'doc' && (doc.content?.length ?? 0) === 1 && doc.content![0]?.type === 'chart'
  );
}

export function resolveChartNode(doc: DocNode): DocNode {
  if (doc.type === 'chart') {
    return doc;
  }
  if (doc.type === 'doc') {
    const child = doc.content?.[0];
    if (child?.type === 'chart') {
      return child;
    }
  }
  throw new TypeError('Expected doc→chart SoT');
}

export function attrsFromDoc(doc: DocNode): ChartAttrs {
  const node = resolveChartNode(doc);
  return normalizeChartAttrs(node.attrs ?? {});
}

export function emptyEditorDoc(attrs?: Partial<ChartAttrs>): DocNode {
  const a = emptyChartAttrs(attrs);
  return toEditorDoc({
    type: 'chart',
    id: nextId('chart'),
    attrs: { ...a },
  });
}

export function docFromAttrs(attrs: ChartAttrs): DocNode {
  return emptyEditorDoc(attrs);
}
