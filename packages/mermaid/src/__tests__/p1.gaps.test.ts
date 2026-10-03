import { describe, expect, it } from 'vitest';
import { parse, render } from '../index';
import { seqNotes } from './seqHelpers';

describe('P1 mermaid gaps', () => {
  it('parses chained flowchart edges A-->B-->C', () => {
    const r = parse('flowchart LR\n  A-->B-->C');
    expect(r.ir?.type).toBe('flowchart');
    if (r.ir?.type !== 'flowchart') {
      return;
    }
    expect(r.ir.edges).toHaveLength(2);
    expect(r.ir.nodes.map((n) => n.id).toSorted()).toStrictEqual(['A', 'B', 'C']);
  });

  it('parses stadium and cylinder shapes', () => {
    const r = parse('flowchart LR\n  A([stadium])-->B[(cyl)]');
    expect(r.ir?.type).toBe('flowchart');
    if (r.ir?.type !== 'flowchart') {
      return;
    }
    expect(r.ir.nodes.find((n) => n.id === 'A')?.shape).toBe('stadium');
    expect(r.ir.nodes.find((n) => n.id === 'B')?.shape).toBe('cyl');
    const svg = render('flowchart LR\n  A([stadium])-->B[(cyl)]');
    expect(svg).toContain('stadium');
    expect(svg).toMatch(/ellipse|path/);
  });

  it('parses sequence Note', () => {
    const r = parse('sequenceDiagram\n  Alice->>Bob: hi\n  Note left of Alice: hello');
    expect(r.ir?.type).toBe('sequence');
    if (r.ir?.type !== 'sequence') {
      return;
    }
    expect(seqNotes(r.ir)[0]?.label).toBe('hello');
    expect(seqNotes(r.ir)[0]?.participant).toBe('Alice');
  });

  it('gantt uses ISO date offsets', () => {
    const r = parse(
      'gantt\n  title Plan\n  section S\n  Build :a1, 2024-01-01, 10d\n  Test :a2, 2024-01-11, 5d'
    );
    expect(r.ir?.type).toBe('gantt');
    if (r.ir?.type !== 'gantt') {
      return;
    }
    const build = r.ir.tasks.find((t) => t.id === 'a1');
    const test = r.ir.tasks.find((t) => t.id === 'a2');
    expect(build?.start).toBe(0);
    expect(test?.start).toBe(10);
  });
});
