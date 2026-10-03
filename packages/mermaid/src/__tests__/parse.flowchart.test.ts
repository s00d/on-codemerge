import { describe, expect, it } from 'vitest';
import { parse } from '../parse';

describe('parse flowchart', () => {
  it('parses compact A-->B into two nodes and one edge', () => {
    const r = parse('flowchart LR\n  A-->B');
    expect(r.ir?.type).toBe('flowchart');
    if (r.ir?.type !== 'flowchart') {
      return;
    }
    expect(r.ir.nodes.map((n) => n.id).toSorted()).toStrictEqual(['A', 'B']);
    expect(r.ir.edges).toHaveLength(1);
    expect(r.ir.edges[0]?.from).toBe('A');
    expect(r.ir.edges[0]?.to).toBe('B');
    expect(r.diagnostics.filter((d) => d.severity === 'error')).toStrictEqual([]);
  });

  it('parses shaped labels and edge labels', () => {
    const r = parse('flowchart TD\n  A[Source] -->|go| B(Sink)');
    expect(r.ir?.type).toBe('flowchart');
    if (r.ir?.type !== 'flowchart') {
      return;
    }
    expect(r.ir.nodes.find((n) => n.id === 'A')?.label).toBe('Source');
    expect(r.ir.nodes.find((n) => n.id === 'B')?.shape).toBe('rounded');
    expect(r.ir.edges[0]?.label).toBe('go');
  });

  it('keeps hyphenated ids without eating arrows', () => {
    const r = parse('flowchart LR\n  my-node-->other-node');
    expect(r.ir?.type).toBe('flowchart');
    if (r.ir?.type !== 'flowchart') {
      return;
    }
    expect(r.ir.nodes.map((n) => n.id).toSorted()).toStrictEqual(['my-node', 'other-node']);
    expect(r.ir.edges[0]?.from).toBe('my-node');
  });

  it('defaults directionless flowchart to TD', () => {
    const r = parse('flowchart\n  A-->B');
    expect(r.ir?.type).toBe('flowchart');
    if (r.ir?.type !== 'flowchart') {
      return;
    }
    expect(r.ir.direction).toBe('TD');
  });
});
