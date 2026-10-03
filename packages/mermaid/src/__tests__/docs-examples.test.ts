import { describe, expect, it } from 'vitest';
import { layout, parse, render } from '../index';
import { seqMessages, seqNotes } from './seqHelpers';

/** Official-style sequence from Mermaid docs (user regression fixture). */
const DOCS_SEQUENCE = `sequenceDiagram
    Alice ->> Bob: Hello Bob, how are you?
    Bob-->>John: How about you John?
    Bob--x Alice: I am good thanks!
    Bob-x John: I am good thanks!
    Note right of John: Bob thinks a long<br/>long time, so long<br/>that the text does<br/>not fit on a row.

    Bob-->Alice: Checking with John...
    Alice->John: Yes... John, how are you?
`;

describe('docs-examples sequence', () => {
  it('parses full docs sequence without skipping cross arrows', () => {
    const r = parse(DOCS_SEQUENCE);
    expect(r.ir?.type).toBe('sequence');
    if (r.ir?.type !== 'sequence') {
      return;
    }
    const skips = r.diagnostics.filter((d) => d.message.includes('Skipping'));
    expect(skips).toStrictEqual([]);
    expect(seqMessages(r.ir)).toHaveLength(6);
    expect(seqNotes(r.ir)).toHaveLength(1);
    expect(r.ir.items).toHaveLength(7);
    expect(seqMessages(r.ir).some((m) => m.arrow === 'dotted-cross')).toBe(true);
    expect(seqMessages(r.ir).some((m) => m.arrow === 'solid-cross')).toBe(true);
    expect(seqNotes(r.ir)[0]?.label).toContain('\n');
    expect(seqNotes(r.ir)[0]?.label).not.toContain('<br');
  });

  it('keeps Note between surrounding messages in timeline', () => {
    const r = parse(DOCS_SEQUENCE);
    expect(r.ir?.type).toBe('sequence');
    if (r.ir?.type !== 'sequence') {
      return;
    }
    expect(r.ir.items[3]?.kind).toBe('message'); // Bob-x John
    expect(r.ir.items[4]?.kind).toBe('note');
    expect(r.ir.items[5]?.kind).toBe('message'); // Bob-->Alice
    const g = layout(r.ir);
    const msgs = g.sequenceMessages ?? [];
    const notes = g.sequenceNotes ?? [];
    expect(msgs).toHaveLength(6);
    expect(notes).toHaveLength(1);
    const noteY = notes[0]?.y ?? 0;
    const beforeY = msgs[3]?.y ?? 0; // 4th message (index 3) before note
    const afterY = msgs[4]?.y ?? 0; // 5th message after note
    expect(noteY).toBeGreaterThan(beforeY);
    expect(afterY).toBeGreaterThan(noteY);
  });

  it('renders lifelines, note box, multiline text, and message labels', () => {
    const svg = render(DOCS_SEQUENCE);
    const lifelines = svg.match(/data-ocm-lifeline="1"/g) ?? [];
    expect(lifelines.length).toBeGreaterThanOrEqual(3);
    expect(svg).toContain('data-ocm-seq-note="1"');
    expect(svg).not.toContain('&lt;br');
    expect(svg).not.toContain('<br');
    expect(svg).toContain('Bob thinks a long');
    expect(svg).toContain('long time, so long');
    expect(svg).toContain('Hello Bob, how are you?');
    expect(svg).toContain('Checking with John');
    expect(svg).toContain('ocm-cross');
    expect(svg).toContain('Alice');
    expect(svg).toContain('Bob');
    expect(svg).toContain('John');
  });

  it('renders top and bottom participant boxes for each actor', () => {
    const r = parse(DOCS_SEQUENCE);
    expect(r.ir?.type).toBe('sequence');
    if (r.ir?.type !== 'sequence') {
      return;
    }
    const g = layout(r.ir);
    expect(g.nodes).toHaveLength(3);
    expect(g.sequenceActorBottoms).toHaveLength(3);
    for (let i = 0; i < 3; i += 1) {
      const top = g.nodes[i];
      const bot = g.sequenceActorBottoms?.[i];
      expect(bot?.label).toBe(top?.label);
      expect(bot?.x).toBe(top?.x);
      expect(bot?.width).toBe(top?.width);
      expect((bot?.y ?? 0) > (top?.y ?? 0) + (top?.height ?? 0)).toBe(true);
    }
    // Lifelines end at the top edge of bottom boxes.
    for (let i = 0; i < 3; i += 1) {
      expect(g.lifelines?.[i]?.y2).toBe(g.sequenceActorBottoms?.[i]?.y);
    }
    const svg = render(DOCS_SEQUENCE);
    const tops = svg.match(/data-ocm-seq-actor="top"/g) ?? [];
    const bottoms = svg.match(/data-ocm-seq-actor="bottom"/g) ?? [];
    expect(tops).toHaveLength(3);
    expect(bottoms).toHaveLength(3);
    expect(svg).toContain('data-actor-id="Alice"');
    expect(svg).toContain('data-actor-id="Bob"');
    expect(svg).toContain('data-actor-id="John"');
  });
});

describe('docs-examples sequence arrows + unsupported', () => {
  it('arrow matrix maps IR and markers', () => {
    const fixed = `sequenceDiagram
  A->>B: filled solid
  B-->>A: filled dashed
  A-->B: open dashed
  B->A: open solid
  A--x B: cross dashed
  B-x A: cross solid
`;
    const r = parse(fixed);
    expect(r.ir?.type).toBe('sequence');
    if (r.ir?.type !== 'sequence') {
      return;
    }
    expect(seqMessages(r.ir).map((m) => m.arrow)).toStrictEqual([
      'solid-arrow',
      'dotted-arrow',
      'dotted-open',
      'solid-open',
      'dotted-cross',
      'solid-cross',
    ]);
    const svg = render(fixed);
    expect(svg).toContain('ocm-arrow-open');
    expect(svg).toContain('ocm-cross');
    expect(svg).toContain('stroke-dasharray');
  });

  it('participant as Label shows display name', () => {
    const svg = render('sequenceDiagram\n  participant J as John\n  Alice->>J: hi');
    expect(svg).toContain('John');
  });

  it('parses actor, Note over, and alt body messages', () => {
    const r = parse(`sequenceDiagram
  actor Alice
  Note over Alice,Bob: hi
  alt Success
    Alice->>Bob: ok
  end
  Alice->>Bob: done
`);
    expect(r.ir?.type).toBe('sequence');
    if (r.ir?.type !== 'sequence') {
      return;
    }
    expect(r.ir.participants.some((p) => p.id === 'Alice')).toBe(true);
    expect(seqNotes(r.ir).some((n) => n.label === 'hi' && n.participant === 'Alice')).toBe(true);
    expect(r.diagnostics.some((d) => d.message.includes('Unsupported'))).toBe(true);
    expect(seqMessages(r.ir).some((m) => m.label === 'done')).toBe(true);
    expect(seqMessages(r.ir).some((m) => m.label === 'ok')).toBe(true);
  });

  it('parses activate shorthand + / - after arrows', () => {
    const r = parse('sequenceDiagram\n  Alice->>+John: Hello\n  John-->>-Alice: Great!');
    expect(r.ir?.type).toBe('sequence');
    if (r.ir?.type !== 'sequence') {
      return;
    }
    expect(seqMessages(r.ir)).toHaveLength(2);
    const svg = render('sequenceDiagram\n  Alice->>+John: Hello\n  John-->>-Alice: Great!');
    expect(svg).toContain('data-ocm-seq-actor="bottom"');
    expect(svg).toContain('data-ocm-lifeline="1"');
  });
});
