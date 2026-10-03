import { describe, expect, it } from 'vitest';
import {
  cloneNode,
  createDoc,
  createParagraph,
  createText,
  docFromJSON,
  docToJSON,
  ensureNodeIds,
} from '../document';

describe('document', () => {
  it('creates empty doc with one empty paragraph', () => {
    expect.hasAssertions();
    const doc = createDoc();
    expect(doc.type).toBe('doc');
    expect(doc.content).toHaveLength(1);
    expect(doc.content![0].type).toBe('paragraph');
  });

  it('round-trips JSON', () => {
    expect.hasAssertions();
    const doc = createDoc([
        createParagraph([createText('Hello', [{ type: 'bold' }]), createText(' world')]),
      ]),
      json = docToJSON(doc),
      restored = docFromJSON(json);
    expect(docToJSON(restored)).toStrictEqual(json);
  });

  it('cloneNode shares nothing mutable with original children array', () => {
    expect.hasAssertions();
    const p = createParagraph([createText('a')]),
      cloned = cloneNode(p);
    expect(cloned).not.toBe(p);
    expect(cloned.content).not.toBe(p.content);
    expect(cloned.content![0]).toBe(p.content![0]); // Structural sharing of unchanged child
  });

  it('rejects invalid root type on fromJSON', () => {
    expect.hasAssertions();
    expect(() => docFromJSON({ content: [], type: 'paragraph' })).toThrow(/doc/);
  });

  it('ensureNodeIds omits empty attrs instead of writing undefined', () => {
    expect.hasAssertions();
    const out = ensureNodeIds({
      type: 'paragraph',
      attrs: {},
      content: [{ type: 'text', text: 'x' }],
    });
    expect(Object.hasOwn(out, 'attrs')).toBe(false);
    expect(out.attrs).toBeUndefined();
  });

  it('ensureNodeIds preserves non-empty attrs', () => {
    expect.hasAssertions();
    const out = ensureNodeIds({
      type: 'heading',
      attrs: { level: 2 },
      content: [],
    });
    // copyAttrs uses a null-prototype bag — compare own entries, not Object prototype.
    expect(Object.getPrototypeOf(out.attrs)).toBeNull();
    expect(Object.entries(out.attrs ?? {})).toStrictEqual([['level', 2]]);
  });
});
