import { describe, expect, it } from 'vitest';
import { parse } from '../parse';
import { seqMessages } from './seqHelpers';

describe('parse sequence/state/class/er/pie/gantt/mindmap', () => {
  it('parses sequence messages and participants', () => {
    const r = parse('sequenceDiagram\n  Alice->>Bob: hello');
    expect(r.ir?.type).toBe('sequence');
    if (r.ir?.type !== 'sequence') {
      return;
    }
    expect(r.ir.participants.map((p) => p.id).toSorted()).toStrictEqual(['Alice', 'Bob']);
    expect(seqMessages(r.ir)).toHaveLength(1);
    expect(seqMessages(r.ir)[0]?.label).toBe('hello');
  });

  it('parses state transitions with distinct start and end markers', () => {
    const r = parse('stateDiagram-v2\n  [*] --> Still\n  Still --> [*]');
    expect(r.ir?.type).toBe('state');
    if (r.ir?.type !== 'state') {
      return;
    }
    const start = r.ir.nodes.find((n) => n.id === '_start');
    const end = r.ir.nodes.find((n) => n.id === '_end');
    expect(start?.shape).toBe('start');
    expect(end?.shape).toBe('end');
    expect(start?.id).not.toBe(end?.id);
    expect(r.ir.edges.some((e) => e.from === '_start' && e.to === 'Still')).toBe(true);
    expect(r.ir.edges.some((e) => e.from === 'Still' && e.to === '_end')).toBe(true);
  });

  it('parses class declaration', () => {
    const r = parse('classDiagram\n  class Animal');
    expect(r.ir?.type).toBe('class');
    if (r.ir?.type !== 'class') {
      return;
    }
    expect(r.ir.classes.some((c) => c.id === 'Animal')).toBe(true);
  });

  it('parses er relationship', () => {
    const r = parse('erDiagram\n  CUSTOMER ||--o{ ORDER : places');
    expect(r.ir?.type).toBe('er');
    if (r.ir?.type !== 'er') {
      return;
    }
    expect(r.ir.entities.map((e) => e.id).toSorted()).toStrictEqual(['CUSTOMER', 'ORDER']);
    expect(r.ir.relations[0]?.label).toBe('places');
  });

  it('parses pie slices with quoted labels', () => {
    const r = parse('pie title Pets\n  "Dogs" : 386\n  "Cats" : 85');
    expect(r.ir?.type).toBe('pie');
    if (r.ir?.type !== 'pie') {
      return;
    }
    expect(r.ir.title).toBe('Pets');
    expect(r.ir.slices).toHaveLength(2);
    expect(r.ir.slices[0]?.label).toBe('Dogs');
  });

  it('parses pie slice labels that contain colons', () => {
    const r = parse('pie\n  "Dogs: big" : 1\n  "Cats" : 2');
    expect(r.ir?.type).toBe('pie');
    if (r.ir?.type !== 'pie') {
      return;
    }
    expect(r.ir.slices[0]?.label).toBe('Dogs: big');
    expect(r.ir.slices[0]?.value).toBe(1);
  });

  it('parses gantt task', () => {
    const r = parse('gantt\n  title Plan\n  section S\n  Build :a1, 2024-01-01, 30d');
    expect(r.ir?.type).toBe('gantt');
    if (r.ir?.type !== 'gantt') {
      return;
    }
    expect(r.ir.title).toBe('Plan');
    expect(r.ir.tasks.some((t) => t.label === 'Build')).toBe(true);
  });

  it('parses mindmap branches', () => {
    const r = parse('mindmap\n  root((idea))\n    branch');
    expect(r.ir?.type).toBe('mindmap');
    if (r.ir?.type !== 'mindmap') {
      return;
    }
    expect(r.ir.root.label).toMatch(/idea|root/);
    expect(r.ir.root.children.length).toBeGreaterThanOrEqual(1);
  });

  it('errors on unsupported type', () => {
    const r = parse('gitGraph\n  commit');
    expect(r.ir).toBeNull();
    expect(r.diagnostics.some((d) => d.severity === 'error')).toBe(true);
  });
});
