import { describe, expect, it } from 'vitest';
import { parseText, serializeText, MAX_TABLE_BYTES } from '../io/text';
import { gridFromDoc } from '../io/adapters';

describe('TablePlugin io/text', () => {
  it('roundtrips v2 JSON', () => {
    const text = JSON.stringify({
      version: 2,
      columns: [{ id: 'a', title: 'A' }],
      rows: [{ id: 'r', cells: { a: 'hi' } }],
    });
    const result = parseText(text);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const g = gridFromDoc(result.doc);
    expect(g.rows[0]?.cells.a).toBe('hi');
    expect(serializeText(result.doc)).toContain('"a"');
  });

  it('migrates v1 on parse', () => {
    const result = parseText(
      JSON.stringify({
        columns: [
          { id: 'a', title: 'A' },
          { id: 'b', title: 'B' },
        ],
        rows: [['1', '2']],
      })
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(gridFromDoc(result.doc).rows[0]?.cells.a).toBe('1');
  });

  it('rejects malformed JSON', () => {
    const result = parseText('{');
    expect(result.ok).toBe(false);
  });

  it('rejects oversize', () => {
    const result = parseText('x'.repeat(MAX_TABLE_BYTES + 1));
    expect(result.ok).toBe(false);
  });

  it('empty → default grid', () => {
    const result = parseText('   ');
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(gridFromDoc(result.doc).columns.length).toBeGreaterThan(0);
  });
});
