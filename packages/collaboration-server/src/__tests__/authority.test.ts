import { describe, expect, it } from 'vitest';
import { createDoc, createParagraph, createText, resetIdCounter } from '@codemerge/kernel';
import { acceptSubmit } from '../authority';
import { emptyRoom } from '../store/memory';

describe('acceptSubmit', () => {
  it('accepts ops on empty room', () => {
    resetIdCounter();
    const room = emptyRoom('d1', createDoc([createParagraph([createText('')])]));
    const result = acceptSubmit(room, 0, [
      { type: 'insert_text', path: [0], offset: 0, text: 'Hi' },
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.version).toBe(1);
      expect(result.ops).toHaveLength(1);
    }
  });

  it('rebases concurrent client op', () => {
    resetIdCounter();
    let room = emptyRoom('d1', createDoc([createParagraph([createText('ab')])]));
    const first = acceptSubmit(room, 0, [{ type: 'insert_text', path: [0], offset: 0, text: 'X' }]);
    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }
    room = {
      ...room,
      version: first.version,
      snapshot: first.snapshot,
      ops: [...room.ops, ...first.ops],
    };
    const second = acceptSubmit(room, 0, [
      { type: 'insert_text', path: [0], offset: 2, text: 'Y' },
    ]);
    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.ops[0]).toMatchObject({ type: 'insert_text', offset: 3 });
    }
  });

  it('rebases against a compacted op-log by version offset', () => {
    resetIdCounter();
    const room = emptyRoom('d1', createDoc([createParagraph([createText('ab')])]));
    // Version 10, only the last op (v10: insert X at 0) kept after compaction.
    const compacted = {
      ...room,
      version: 10,
      ops: [{ type: 'insert_text' as const, path: [0], offset: 0, text: 'X' }],
    };
    const r = acceptSubmit(compacted, 9, [
      { type: 'insert_text', path: [0], offset: 1, text: 'Y' },
    ]);
    expect(r.ok && r.ops[0]).toMatchObject({ offset: 2 });
    const old = acceptSubmit(compacted, 5, [
      { type: 'insert_text', path: [0], offset: 0, text: 'Z' },
    ]);
    expect(old).toMatchObject({ ok: false, reason: 'base_compacted' });
    expect(
      acceptSubmit(compacted, Number.NaN, [
        { type: 'insert_text', path: [0], offset: 0, text: 'Z' },
      ])
    ).toMatchObject({ ok: false, reason: 'bad_base' });
  });

  it('rejects empty ops', () => {
    const room = emptyRoom('d1');
    expect(acceptSubmit(room, 0, []).ok).toBe(false);
  });
});
