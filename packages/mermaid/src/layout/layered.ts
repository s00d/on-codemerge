import type {
  Direction,
  FlowEdge,
  FlowNode,
  LayoutOptions,
  PositionedEdge,
  PositionedGraph,
  PositionedNode,
} from '../types';
import { measureLabel } from './text';

interface Sized {
  width: number;
  height: number;
  node: FlowNode;
}

function rankNodes(
  ids: string[],
  succ: Map<string, string[]>,
  pred: Map<string, string[]>
): Map<string, number> {
  const rank = new Map<string, number>();
  const visiting = new Set<string>();

  const visit = (id: string, r: number): void => {
    if (visiting.has(id)) {
      return;
    }
    const prev = rank.get(id) ?? -1;
    if (r <= prev) {
      return;
    }
    rank.set(id, r);
    visiting.add(id);
    for (const n of succ.get(id) ?? []) {
      visit(n, r + 1);
    }
    visiting.delete(id);
  };

  const roots = ids.filter((id) => (pred.get(id) ?? []).length === 0);
  const seeds = roots.length > 0 ? roots : ids.slice(0, 1);
  for (const r of seeds) {
    visit(r, 0);
  }
  for (const id of ids) {
    if (!rank.has(id)) {
      visit(id, 0);
    }
  }
  return rank;
}

function sizeNodes(nodes: FlowNode[]): Map<string, Sized> {
  const sized = new Map<string, Sized>();
  for (const node of nodes) {
    if (node.shape === 'start' || node.shape === 'end') {
      sized.set(node.id, { width: 18, height: 18, node });
      continue;
    }
    if (node.shape === 'circle') {
      const m = measureLabel(node.label, 36, 24, 24);
      const s = Math.max(m.width, m.height);
      sized.set(node.id, { width: s, height: s, node });
      continue;
    }
    const m = measureLabel(node.label);
    const extra = node.shape === 'diamond' || node.shape === 'odd' ? 12 : 0;
    sized.set(node.id, {
      width: m.width + extra,
      height: m.height + (node.shape === 'diamond' ? 12 : 0),
      node,
    });
  }
  return sized;
}

function borderPoint(
  node: PositionedNode,
  center: { x: number; y: number },
  toward: { x: number; y: number }
): { x: number; y: number } {
  const dx = toward.x - center.x;
  const dy = toward.y - center.y;
  if (dx === 0 && dy === 0) {
    return { x: center.x, y: center.y };
  }
  const hw = node.width / 2;
  const hh = node.height / 2;
  const scale = Math.min(
    dx === 0 ? Number.POSITIVE_INFINITY : hw / Math.abs(dx),
    dy === 0 ? Number.POSITIVE_INFINITY : hh / Math.abs(dy)
  );
  return { x: center.x + dx * scale, y: center.y + dy * scale };
}

export function layoutLayered(
  kind: 'flowchart' | 'state' | 'class' | 'er',
  nodes: FlowNode[],
  edges: FlowEdge[],
  direction: Direction,
  options: LayoutOptions
): PositionedGraph {
  const padding = options.padding ?? 24;
  const nodeSpacing = options.nodeSpacing ?? 28;
  const layerSpacing = options.layerSpacing ?? 56;

  const horiz = direction === 'LR' || direction === 'RL';
  const flipMajor = direction === 'BT' || direction === 'RL';

  const ids = nodes.map((n) => n.id);
  const idSet = new Set(ids);
  const succ = new Map<string, string[]>();
  const pred = new Map<string, string[]>();
  for (const id of ids) {
    succ.set(id, []);
    pred.set(id, []);
  }
  for (const e of edges) {
    if (!idSet.has(e.from) || !idSet.has(e.to)) {
      continue;
    }
    succ.get(e.from)?.push(e.to);
    pred.get(e.to)?.push(e.from);
  }

  const rank = rankNodes(ids, succ, pred);
  const layers = new Map<number, string[]>();
  let maxRank = 0;
  for (const id of ids) {
    const r = rank.get(id) ?? 0;
    maxRank = Math.max(maxRank, r);
    const list = layers.get(r) ?? [];
    list.push(id);
    layers.set(r, list);
  }
  for (const list of layers.values()) {
    list.sort((a, b) => a.localeCompare(b));
  }

  const sized = sizeNodes(nodes);
  type Slot = { id: string; x: number; y: number; w: number; h: number; node: FlowNode };
  const slots: Slot[] = [];
  let majorCursor = padding;

  for (let r = 0; r <= maxRank; r += 1) {
    const layer = layers.get(r) ?? [];
    let band = 0;
    for (const id of layer) {
      const s = sized.get(id);
      if (s === undefined) {
        throw new Error(`layout: missing size for node ${id}`);
      }
      band = Math.max(band, horiz ? s.width : s.height);
    }
    let minor = padding;
    for (const id of layer) {
      const s = sized.get(id);
      if (s === undefined) {
        throw new Error(`layout: missing size for node ${id}`);
      }
      const x = horiz ? majorCursor + (band - s.width) / 2 : minor;
      const y = horiz ? minor : majorCursor + (band - s.height) / 2;
      slots.push({ id, x, y, w: s.width, h: s.height, node: s.node });
      minor += (horiz ? s.height : s.width) + nodeSpacing;
    }
    majorCursor += band + layerSpacing;
  }

  let maxMajor = padding;
  for (const s of slots) {
    maxMajor = Math.max(maxMajor, horiz ? s.x + s.w : s.y + s.h);
  }

  const positioned: PositionedNode[] = [];
  const byId = new Map<string, PositionedNode>();
  const centers = new Map<string, { x: number; y: number }>();

  for (const s of slots) {
    let { x, y } = s;
    if (flipMajor) {
      if (horiz) {
        x = maxMajor - (s.x + s.w) + padding;
      } else {
        y = maxMajor - (s.y + s.h) + padding;
      }
    }
    const node: PositionedNode = {
      id: s.id,
      label: s.node.label,
      shape: s.node.shape,
      x,
      y,
      width: s.w,
      height: s.h,
    };
    positioned.push(node);
    byId.set(s.id, node);
    centers.set(s.id, { x: x + s.w / 2, y: y + s.h / 2 });
  }

  const posEdges: PositionedEdge[] = [];
  for (const e of edges) {
    const a = centers.get(e.from);
    const b = centers.get(e.to);
    const fromNode = byId.get(e.from);
    const toNode = byId.get(e.to);
    if (a === undefined || b === undefined || fromNode === undefined || toNode === undefined) {
      continue;
    }
    const p0 = borderPoint(fromNode, a, b);
    const p1 = borderPoint(toNode, b, a);
    // Orthogonal elbow (docs-style) instead of a single diagonal.
    const mid = horiz ? { x: (p0.x + p1.x) / 2, y: p0.y } : { x: p0.x, y: (p0.y + p1.y) / 2 };
    const mid2 = horiz ? { x: (p0.x + p1.x) / 2, y: p1.y } : { x: p1.x, y: (p0.y + p1.y) / 2 };
    const points =
      Math.abs(p0.x - p1.x) < 2 || Math.abs(p0.y - p1.y) < 2 ? [p0, p1] : [p0, mid, mid2, p1];
    posEdges.push({
      from: e.from,
      to: e.to,
      label: e.label,
      dashed: e.dashed,
      thick: e.thick,
      points,
    });
  }

  let maxX = padding;
  let maxY = padding;
  for (const n of positioned) {
    maxX = Math.max(maxX, n.x + n.width);
    maxY = Math.max(maxY, n.y + n.height);
  }

  return {
    kind,
    width: maxX + padding,
    height: maxY + padding,
    nodes: positioned,
    edges: posEdges,
  };
}
