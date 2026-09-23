/** Recursive pane tree persisted on `block_container` attrs.tree (JSON). */

export type BlockTree =
  | { kind: 'leaf' }
  | { kind: 'split'; dir: 'row' | 'column'; children: BlockTree[] };

export function leaf(): BlockTree {
  return { kind: 'leaf' };
}

export function split(dir: 'row' | 'column', children: BlockTree[]): BlockTree {
  return { kind: 'split', dir, children };
}

/** Legacy attrs → tree. Prefer attrs.tree when present. */
export function treeFromAttrs(attrs: Record<string, unknown>): BlockTree {
  const raw = attrs.tree;
  if (typeof raw === 'string' && raw.length > 0) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      const t = normalizeTree(parsed);
      if (t) {
        return t;
      }
    } catch {
      /* fall through */
    }
  }
  const layoutRaw = attrs.layout;
  const layout = typeof layoutRaw === 'string' && layoutRaw.length > 0 ? layoutRaw : 'stack';
  if (layout === 'row' || layout === 'split') {
    return split('row', [leaf(), leaf()]);
  }
  if (layout === 'column') {
    return split('column', [leaf(), leaf()]);
  }
  return leaf();
}

export function layoutFromTree(tree: BlockTree): 'stack' | 'row' | 'column' {
  if (tree.kind === 'leaf') {
    return 'stack';
  }
  return tree.dir;
}

export function serializeTree(tree: BlockTree): string {
  return JSON.stringify(tree);
}

/**
 * Split at `path` (indices into nested split children). Empty path = root.
 * - leaf → wrap into 2-pane split
 * - same-dir split → append a pane
 * - other-dir split → wrap preserving the old tree as first child
 */
export function splitAt(tree: BlockTree, path: number[], dir: 'row' | 'column'): BlockTree {
  if (path.length === 0) {
    if (tree.kind === 'leaf') {
      return split(dir, [tree, leaf()]);
    }
    if (tree.dir === dir) {
      return { ...tree, children: [...tree.children, leaf()] };
    }
    return split(dir, [tree, leaf()]);
  }
  if (tree.kind !== 'split') {
    return splitAt(tree, [], dir);
  }
  const i = path[0];
  if (i === undefined || i < 0 || i >= tree.children.length) {
    return tree;
  }
  const rest = path.slice(1);
  return {
    ...tree,
    children: tree.children.map((child, idx) => (idx === i ? splitAt(child, rest, dir) : child)),
  };
}

function normalizeTree(value: unknown): BlockTree | null {
  if (value === null || value === undefined || typeof value !== 'object') {
    return null;
  }
  const v = value as Record<string, unknown>;
  if (v.kind === 'leaf') {
    return leaf();
  }
  if (v.kind === 'split' && (v.dir === 'row' || v.dir === 'column') && Array.isArray(v.children)) {
    const children = v.children.map(normalizeTree).filter((c): c is BlockTree => c !== null);
    if (children.length < 2) {
      return children[0] ?? leaf();
    }
    return split(v.dir, children);
  }
  return null;
}
