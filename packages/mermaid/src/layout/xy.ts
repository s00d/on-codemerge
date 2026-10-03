import type { LayoutOptions, PositionedGraph, XyChartIR } from '../types';

export function layoutXyChart(ir: XyChartIR, options: LayoutOptions): PositionedGraph {
  const padding = options.padding ?? 24;
  const titleH = ir.title !== undefined ? 28 : 0;
  const legendH = ir.series.some((s) => s.name !== undefined && s.name !== '') ? 22 : 0;
  const plotW = 360;
  const plotH = 200;
  const left = padding + 36;
  const top = padding + titleH + 8;
  return {
    kind: 'xychart',
    title: ir.title,
    width: left + plotW + padding + 16,
    height: top + plotH + padding + legendH + 28,
    nodes: [],
    edges: [],
    xychart: {
      plotX: left,
      plotY: top,
      plotW,
      plotH,
      categories: ir.categories,
      yMin: ir.yMin,
      yMax: ir.yMax <= ir.yMin ? ir.yMin + 1 : ir.yMax,
      yLabel: ir.yLabel,
      series: ir.series.map((s) => ({ ...s })),
    },
  };
}
