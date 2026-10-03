import type { LayoutOptions, MindmapIR, PieIR, PositionedGraph, PositionedNode } from '../types';
import { measureLabel } from './text';

export function layoutPie(ir: PieIR, options: LayoutOptions): PositionedGraph {
  const padding = options.padding ?? 24;
  const r = 80;
  const cx = padding + r + 40;
  const cy = padding + r + (ir.title !== undefined ? 28 : 8);
  const total = ir.slices.reduce((s, x) => s + x.value, 0) || 1;

  let angle = -Math.PI / 2;
  const slices = ir.slices.map((slice) => {
    const sweep = (slice.value / total) * Math.PI * 2;
    const entry = { start: angle, sweep, label: slice.label, value: slice.value };
    angle += sweep;
    return entry;
  });
  const hole = Math.min(0.9, Math.max(0, ir.hole ?? 0));

  return {
    kind: 'pie',
    title: ir.title,
    width: cx + r + padding + 80,
    height: cy + r + padding,
    nodes: [],
    edges: [],
    pie: { cx, cy, r, hole, showData: ir.showData === true, slices },
  };
}

export function layoutMindmap(ir: MindmapIR, options: LayoutOptions): PositionedGraph {
  const padding = options.padding ?? 24;
  const nodes: PositionedNode[] = [];
  const edges: PositionedGraph['edges'] = [];
  const byId = new Map<string, PositionedNode>();

  const place = (
    node: typeof ir.root,
    depth: number,
    index: number,
    siblings: number,
    px: number,
    py: number
  ): void => {
    const m = measureLabel(node.label, 40);
    const spread = Math.max(siblings, 1);
    const x = depth === 0 ? padding + 120 : px + 140;
    const y = depth === 0 ? padding + 80 : py + (index - (spread - 1) / 2) * (m.height + 24);
    const positioned: PositionedNode = {
      id: node.id,
      label: node.label,
      shape: depth === 0 ? 'rounded' : 'rect',
      x,
      y,
      width: m.width,
      height: m.height,
    };
    nodes.push(positioned);
    byId.set(node.id, positioned);
    for (let i = 0; i < node.children.length; i += 1) {
      const child = node.children[i];
      if (child === undefined) {
        continue;
      }
      place(child, depth + 1, i, node.children.length, x + m.width, y + m.height / 2);
      edges.push({ from: node.id, to: child.id, points: [] });
    }
  };

  place(ir.root, 0, 0, 1, 0, 0);

  for (const e of edges) {
    const a = byId.get(e.from);
    const b = byId.get(e.to);
    if (a === undefined || b === undefined) {
      continue;
    }
    e.points = [
      { x: a.x + a.width, y: a.y + a.height / 2 },
      { x: b.x, y: b.y + b.height / 2 },
    ];
  }

  let maxX = padding;
  let maxY = padding;
  for (const n of nodes) {
    maxX = Math.max(maxX, n.x + n.width);
    maxY = Math.max(maxY, n.y + n.height);
  }
  return { kind: 'mindmap', width: maxX + padding, height: maxY + padding, nodes, edges };
}
