import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse, render } from '../index';
import { seqMessages } from './seqHelpers';

const corpusDir = join(import.meta.dirname, 'fixtures/docs-corpus');

function load(file: string): string {
  return readFileSync(join(corpusDir, file), 'utf8');
}

/** Curated official-docs fixtures that must render “complete” sequence chrome. */
const SEQUENCE_GOLDEN = [
  '000-sequence.mmd', // basic Alice/John
  '004-sequence.mmd', // participants
  '018-sequence.mmd', // activate +/- shorthand
];

describe('docs-corpus golden sequence chrome', () => {
  for (const file of SEQUENCE_GOLDEN) {
    it(`${file} has lifelines, top+bottom actors, messages`, () => {
      const src = load(file);
      const r = parse(src);
      expect(r.ir?.type).toBe('sequence');
      if (r.ir?.type !== 'sequence') {
        return;
      }
      expect(seqMessages(r.ir).length).toBeGreaterThan(0);
      expect(r.ir.participants.length).toBeGreaterThan(0);
      const svg = render(src);
      expect(svg).toContain('data-ocm-mermaid="1"');
      const lifelines = svg.match(/data-ocm-lifeline="1"/g) ?? [];
      const tops = svg.match(/data-ocm-seq-actor="top"/g) ?? [];
      const bottoms = svg.match(/data-ocm-seq-actor="bottom"/g) ?? [];
      expect(lifelines.length).toBe(r.ir.participants.length);
      expect(tops.length).toBe(r.ir.participants.length);
      expect(bottoms.length).toBe(r.ir.participants.length);
      for (const p of r.ir.participants) {
        expect(svg).toContain(`data-actor-id="${p.id}"`);
      }
    });
  }

  it('user docs sequence fixture renders closed lifelines + multiline note', () => {
    const src = `sequenceDiagram
    Alice ->> Bob: Hello Bob, how are you?
    Bob-->>John: How about you John?
    Bob--x Alice: I am good thanks!
    Bob-x John: I am good thanks!
    Note right of John: Bob thinks a long<br/>long time, so long<br/>that the text does<br/>not fit on a row.
    Bob-->Alice: Checking with John...
    Alice->John: Yes... John, how are you?
`;
    const svg = render(src);
    expect(svg.match(/data-ocm-lifeline="1"/g)?.length).toBe(3);
    expect(svg.match(/data-ocm-seq-actor="bottom"/g)?.length).toBe(3);
    expect(svg).toContain('data-ocm-seq-note="1"');
    expect(svg).toContain('Bob thinks a long');
    expect(svg).not.toContain('&lt;br');
  });
});

describe('docs-corpus golden other types smoke', () => {
  const samples: Array<{ file: string; needle: string }> = [
    { file: '037-flowchart.mmd', needle: 'data-ocm-mermaid="1"' },
    { file: '231-pie.mmd', needle: '<path' },
    { file: '244-mindmap.mmd', needle: 'data-ocm-mermaid="1"' },
  ];

  for (const { file, needle } of samples) {
    it(`${file} renders`, () => {
      const src = load(file);
      const svg = render(src);
      expect(svg).toContain(needle);
      expect(svg.length).toBeGreaterThan(200);
    });
  }
});
