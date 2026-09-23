import { describe, expect, it } from 'vitest';
import { layoutFromTree, leaf, serializeTree, split, splitAt, treeFromAttrs } from '../paneTree';

describe('blockPlugin paneTree', () => {
  it('synthesizes row tree from legacy layout attr', () => {
    expect.hasAssertions();
    const t = treeFromAttrs({ layout: 'row' });
    expect(t).toEqual(split('row', [leaf(), leaf()]));
    expect(layoutFromTree(t)).toBe('row');
  });

  it('nests vertical split inside pane without wiping siblings', () => {
    expect.hasAssertions();
    const base = split('row', [leaf(), leaf()]);
    const next = splitAt(base, [1], 'column');
    expect(next).toEqual(split('row', [leaf(), split('column', [leaf(), leaf()])]));
    expect(serializeTree(next)).toContain('"dir":"column"');
  });

  it('same-dir split at root appends a pane', () => {
    expect.hasAssertions();
    const base = split('row', [leaf(), leaf()]);
    const next = splitAt(base, [], 'row');
    expect(next).toEqual(split('row', [leaf(), leaf(), leaf()]));
  });

  it('cross-dir split at root wraps and preserves previous tree', () => {
    expect.hasAssertions();
    const base = split('row', [leaf(), leaf()]);
    const next = splitAt(base, [], 'column');
    expect(next).toEqual(split('column', [base, leaf()]));
  });
});
