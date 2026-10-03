import type { LayoutOptions, PositionedGraph, RadarIR } from '../types';

export function layoutRadar(ir: RadarIR, options: LayoutOptions): PositionedGraph {
  const padding = options.padding ?? 24;
  const titleH = ir.title !== undefined ? 28 : 0;
  const legendH = ir.showLegend ? 24 : 0;
  const r = 90;
  const cx = padding + r + 48;
  const cy = padding + titleH + r + 16;
  return {
    kind: 'radar',
    title: ir.title,
    width: cx + r + padding + 80,
    height: cy + r + padding + legendH,
    nodes: [],
    edges: [],
    radar: {
      cx,
      cy,
      r,
      axes: ir.axes,
      curves: ir.curves,
      min: ir.min,
      max: ir.max <= ir.min ? ir.min + 1 : ir.max,
      ticks: ir.ticks,
      showLegend: ir.showLegend,
    },
  };
}
