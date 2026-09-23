import type { DocNode, Point, Selection } from './types';
import { getNodeAt, textLength } from './document';

export function createSelection(anchor: Point, focus: Point = anchor): Selection {
  return {
    anchor: { ...anchor, path: [...anchor.path] },
    focus: { ...focus, path: [...focus.path] },
  };
}

export function collapsedAt(path: number[], offset: number): Selection {
  return createSelection({ offset, path: [...path] });
}

export function isCollapsed(sel: Selection): boolean {
  return (
    sel.anchor.offset === sel.focus.offset &&
    sel.anchor.path.length === sel.focus.path.length &&
    sel.anchor.path.every((v, i) => v === sel.focus.path[i])
  );
}

/** Resolve a point inside a paragraph path to ensure offset is within text bounds. */
export function clampPoint(doc: DocNode, point: Point): Point {
  try {
    let path = [...point.path];
    let node = getNodeAt(doc, path);
    // Selection must address a text-bearing block, never a text leaf
    while (node.type === 'text' && path.length > 0) {
      path = path.slice(0, -1);
      node = path.length === 0 ? doc : getNodeAt(doc, path);
    }
    if (path.length === 0 || node.type === 'doc') {
      return { offset: 0, path: [0] };
    }
    const max = textLength(node);
    return { offset: Math.max(0, Math.min(point.offset, max)), path };
  } catch {
    // Path became invalid mid-transaction (structural edits) — fall back to doc start.
    return { offset: 0, path: [0] };
  }
}

export function clampSelection(doc: DocNode, sel: Selection): Selection {
  return {
    anchor: clampPoint(doc, sel.anchor),
    focus: clampPoint(doc, sel.focus),
  };
}

/** Compare points: -1 if a < b, 0 equal, 1 if a > b (path then offset). */
export function comparePoints(a: Point, b: Point): number {
  const len = Math.max(a.path.length, b.path.length);
  for (let i = 0; i < len; i++) {
    const av = a.path[i] ?? -1,
      bv = b.path[i] ?? -1;
    if (av !== bv) {
      return av < bv ? -1 : 1;
    }
  }
  if (a.offset !== b.offset) {
    return a.offset < b.offset ? -1 : 1;
  }
  return 0;
}

export function orderedRange(sel: Selection): { from: Point; to: Point } {
  return comparePoints(sel.anchor, sel.focus) <= 0
    ? { from: sel.anchor, to: sel.focus }
    : { from: sel.focus, to: sel.anchor };
}
