import { describe, expect, it } from 'vitest';
import { normalizeLabel } from '../parse/label';
import { parseSequence } from '../parse/sequence';
import { seqNotes } from './seqHelpers';
import { takeArrow } from '../scan';

describe('normalizeLabel', () => {
  it('converts br tags to newlines', () => {
    expect(normalizeLabel('a<br/>b<br>c<br />d')).toBe('a\nb\nc\nd');
  });
});

describe('takeArrow sequence crosses', () => {
  it('recognizes --x and -x before shorter arrows', () => {
    expect(takeArrow('--x Alice', 0)?.value).toBe('--x');
    expect(takeArrow('-x Alice', 0)?.value).toBe('-x');
    expect(takeArrow('-->> Alice', 0)?.value).toBe('-->>');
    expect(takeArrow('->> Alice', 0)?.value).toBe('->>');
  });
});

describe('parseSequence', () => {
  it('interleaves notes into items', () => {
    const { ir } = parseSequence('sequenceDiagram\n  A->>B: hi\n  Note left of A: n1\n  B->>A: ok');
    expect(ir.items.map((i) => i.kind)).toStrictEqual(['message', 'note', 'message']);
    expect(seqNotes(ir)[0]?.side).toBe('left');
  });
});
