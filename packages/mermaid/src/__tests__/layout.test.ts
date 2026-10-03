import { describe, expect, it } from 'vitest';
import { layout } from '../layout';
import { parse } from '../parse';
import type { FlowchartIR, PositionedGraph } from '../types';

function nodePositions(g: PositionedGraph): Record<string, { x: number; y: number }> {
  return Object.fromEntries(g.nodes.map((n) => [n.id, { x: n.x, y: n.y }]));
}

describe('layout', () => {
  it('places flowchart nodes without identical centers and edges with 2 points', () => {
    const r = parse('flowchart LR\n  A-->B\n  B-->C');
    expect(r.ir).not.toBeNull();
    if (r.ir === null) {
      return;
    }
    const g = layout(r.ir);
    expect(g.nodes.length).toBeGreaterThanOrEqual(3);
    expect(g.edges.length).toBe(2);
    for (const e of g.edges) {
      expect(e.points.length).toBeGreaterThanOrEqual(2);
    }
    const centers = g.nodes.map((n) => `${n.x + n.width / 2},${n.y + n.height / 2}`);
    expect(new Set(centers).size).toBe(centers.length);
  });

  it('is deterministic for the same IR', () => {
    const r = parse('flowchart TB\n  A-->B');
    expect(r.ir).not.toBeNull();
    if (r.ir === null) {
      return;
    }
    const a = layout(r.ir);
    const b = layout(r.ir);
    expect(a).toStrictEqual(b);
  });

  it('is stable when node order in IR is shuffled', () => {
    const r = parse('flowchart TB\n  A-->B\n  B-->C');
    expect(r.ir?.type).toBe('flowchart');
    if (r.ir?.type !== 'flowchart') {
      return;
    }
    const shuffled: FlowchartIR = {
      ...r.ir,
      nodes: r.ir.nodes.toReversed(),
    };
    const a = layout(r.ir);
    const b = layout(shuffled);
    expect(nodePositions(a)).toStrictEqual(nodePositions(b));
  });

  it('BT places sink above source vs TB', () => {
    const tb = parse('flowchart TB\n  A-->B');
    const bt = parse('flowchart BT\n  A-->B');
    if (tb.ir === null || bt.ir === null) {
      expect.fail('parse failed');
    }
    const gTb = layout(tb.ir);
    const gBt = layout(bt.ir);
    const aTb = gTb.nodes.find((n) => n.id === 'A');
    const bTb = gTb.nodes.find((n) => n.id === 'B');
    const aBt = gBt.nodes.find((n) => n.id === 'A');
    const bBt = gBt.nodes.find((n) => n.id === 'B');
    expect(aTb && bTb && aBt && bBt).toBeTruthy();
    if (aTb === undefined || bTb === undefined || aBt === undefined || bBt === undefined) {
      return;
    }
    expect(bTb.y).toBeGreaterThan(aTb.y);
    expect(bBt.y).toBeLessThan(aBt.y);
  });

  it('RL places sink left of source vs LR', () => {
    const lr = parse('flowchart LR\n  A-->B');
    const rl = parse('flowchart RL\n  A-->B');
    if (lr.ir === null || rl.ir === null) {
      expect.fail('parse failed');
    }
    const gLr = layout(lr.ir);
    const gRl = layout(rl.ir);
    const aLr = gLr.nodes.find((n) => n.id === 'A');
    const bLr = gLr.nodes.find((n) => n.id === 'B');
    const aRl = gRl.nodes.find((n) => n.id === 'A');
    const bRl = gRl.nodes.find((n) => n.id === 'B');
    expect(aLr && bLr && aRl && bRl).toBeTruthy();
    if (aLr === undefined || bLr === undefined || aRl === undefined || bRl === undefined) {
      return;
    }
    expect(bLr.x).toBeGreaterThan(aLr.x);
    expect(bRl.x).toBeLessThan(aRl.x);
  });

  it('handles cycles without throwing', () => {
    const r = parse('flowchart LR\n  A-->B\n  B-->A');
    expect(r.ir).not.toBeNull();
    if (r.ir === null) {
      return;
    }
    const g = layout(r.ir);
    expect(g.nodes.map((n) => n.id).toSorted()).toStrictEqual(['A', 'B']);
    expect(g.edges.length).toBe(2);
  });

  it('sequence assigns distinct participant columns', () => {
    const r = parse('sequenceDiagram\n  Alice->>Bob: hi\n  Bob-->>Alice: ok');
    expect(r.ir?.type).toBe('sequence');
    if (r.ir?.type !== 'sequence') {
      return;
    }
    const g = layout(r.ir);
    const xs = g.nodes.map((n) => n.x);
    expect(new Set(xs).size).toBe(xs.length);
    expect(g.edges).toHaveLength(2);
  });
});
