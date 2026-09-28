import { describe, expect, it } from 'vitest';
import { layoutFromTree, leaf, serializeTree, split, splitAt, treeFromAttrs } from '../paneTree';

describe('blockPlugin paneTree', () => {
  it('synthesizes row tree from legacy layout attr', () => {
    expect.hasAssertions();
    const t = treeFromAttrs({ layout: 'row' });
    expect(t).toStrictEqual(split('row', [leaf(), leaf()]));
    expect(layoutFromTree(t)).toBe('row');
  });

  it('nests vertical split inside pane without wiping siblings', () => {
    expect.hasAssertions();
    const base = split('row', [leaf(), leaf()]);
    const next = splitAt(base, [1], 'column');
    expect(next).toStrictEqual(split('row', [leaf(), split('column', [leaf(), leaf()])]));
    expect(serializeTree(next)).toMatchObject({
      kind: 'split',
      dir: 'row',
      children: [{ kind: 'leaf' }, { kind: 'split', dir: 'column' }],
    });
  });

  it('same-dir split at root appends a pane', () => {
    expect.hasAssertions();
    const base = split('row', [leaf(), leaf()]);
    const next = splitAt(base, [], 'row');
    expect(next).toStrictEqual(split('row', [leaf(), leaf(), leaf()]));
  });

  it('cross-dir split at root wraps and preserves previous tree', () => {
    expect.hasAssertions();
    const base = split('row', [leaf(), leaf()]);
    const next = splitAt(base, [], 'column');
    expect(next).toStrictEqual(split('column', [base, leaf()]));
  });

  it('treeFromAttrs reads typed object and legacy JSON string', () => {
    expect.hasAssertions();
    const typed = split('column', [leaf(), leaf()]);
    expect(treeFromAttrs({ tree: typed })).toStrictEqual(typed);
    expect(treeFromAttrs({ tree: JSON.stringify(typed) })).toStrictEqual(typed);
    expect(serializeTree(typed)).toBe(typed);
  });
});
