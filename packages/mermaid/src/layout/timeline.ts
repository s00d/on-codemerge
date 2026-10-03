import type { GanttIR, LayoutOptions, PositionedGraph, PositionedNode } from '../types';
import { measureLabel } from './text';

export function layoutGantt(ir: GanttIR, options: LayoutOptions): PositionedGraph {
  const padding = options.padding ?? 24;
  const rowH = 28;
  const labelW = 120;
  const unitW = 18;
  const maxEnd = ir.tasks.reduce((m, t) => Math.max(m, t.end), 1);

  const nodes: PositionedNode[] = ir.tasks.map((t, i) => {
    const m = measureLabel(t.label, 40);
    return {
      id: t.id,
      label: t.label,
      shape: 'stadium' as const,
      x: padding + labelW + t.start * unitW,
      y: padding + (ir.title !== undefined ? 28 : 0) + i * rowH,
      width: Math.max(m.width * 0.3, (t.end - t.start) * unitW),
      height: 20,
    };
  });

  // Label nodes on the left
  for (let i = 0; i < ir.tasks.length; i += 1) {
    const t = ir.tasks[i];
    if (t === undefined) {
      continue;
    }
    nodes.push({
      id: `${t.id}__label`,
      label: t.label,
      shape: 'rect',
      x: padding,
      y: padding + (ir.title !== undefined ? 28 : 0) + i * rowH,
      width: labelW - 8,
      height: 20,
    });
  }

  return {
    kind: 'gantt',
    title: ir.title,
    width: padding * 2 + labelW + maxEnd * unitW,
    height: padding * 2 + (ir.title !== undefined ? 28 : 0) + Math.max(1, ir.tasks.length) * rowH,
    nodes,
    edges: [],
  };
}
