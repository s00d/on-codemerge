import type { Operation } from './operations';

function pathsEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

function pathPrefix(longer: number[], shorter: number[]): boolean {
  if (longer.length < shorter.length) {
    return false;
  }
  for (let i = 0; i < shorter.length; i++) {
    if (longer[i] !== shorter[i]) {
      return false;
    }
  }
  return true;
}

/** Shift path index at `depth` by `delta` when the path is at/after `index`. */
function shiftPath(path: number[], parentPath: number[], index: number, delta: number): number[] {
  if (!pathPrefix(path, parentPath) || path.length <= parentPath.length) {
    return path;
  }
  const at = parentPath.length;
  const cur = path[at];
  if (cur === undefined || cur < index) {
    return path;
  }
  const next = path.slice();
  next[at] = cur + delta;
  return next;
}

function mapPath(op: Operation, map: (path: number[]) => number[]): Operation {
  switch (op.type) {
    case 'set_selection':
      return op;
    case 'insert_text':
    case 'delete_text':
    case 'split_paragraph':
    case 'merge_paragraph':
    case 'set_mark':
    case 'remove_mark':
    case 'replace_slice':
    case 'set_attrs':
    case 'insert_node':
    case 'remove_node':
      return { ...op, path: map(op.path) };
    default: {
      const _exhaustive: never = op;
      return _exhaustive;
    }
  }
}

function mapOffset(op: Operation, path: number[], map: (offset: number) => number): Operation {
  if (!('path' in op) || !pathsEqual(op.path, path)) {
    return op;
  }
  switch (op.type) {
    case 'insert_text':
      return { ...op, offset: map(op.offset) };
    case 'delete_text': {
      const start = map(op.offset);
      const end = map(op.offset + op.length);
      return { ...op, offset: start, length: Math.max(0, end - start) };
    }
    case 'split_paragraph':
      return { ...op, offset: map(op.offset) };
    case 'set_mark':
    case 'remove_mark':
    case 'replace_slice': {
      const from = map(op.from);
      const to = map(op.to);
      return { ...op, from, to: Math.max(from, to) };
    }
    case 'merge_paragraph':
    case 'insert_node':
    case 'remove_node':
    case 'set_attrs':
      return op;
    default: {
      const _exhaustive: never = op;
      return _exhaustive;
    }
  }
}

/**
 * Transform `op` so it can be applied after `against` was already applied
 * (ProseMirror-style: rebase client op against server op).
 * Returns null if `op` becomes a no-op.
 */
export function transformOp(op: Operation, against: Operation): Operation | null {
  if (op.type === 'set_selection' || against.type === 'set_selection') {
    return op.type === 'set_selection' ? null : op;
  }

  // Node insert/remove shifts sibling paths
  if (against.type === 'insert_node') {
    let next = mapPath(op, (p) => shiftPath(p, against.path, against.index, 1));
    if (
      (next.type === 'insert_node' || next.type === 'remove_node') &&
      pathsEqual(next.path, against.path) &&
      next.index >= against.index
    ) {
      next = { ...next, index: next.index + 1 };
    }
    return next;
  }
  if (against.type === 'remove_node') {
    if (
      (op.type === 'insert_node' || op.type === 'remove_node') &&
      pathsEqual(op.path, against.path)
    ) {
      if (op.index === against.index && op.type === 'remove_node') {
        return null;
      }
      if (op.index > against.index) {
        return { ...op, index: op.index - 1 };
      }
    }
    const removedPath = [...against.path, against.index];
    if (
      'path' in op &&
      pathPrefix(op.path, removedPath) &&
      op.path.length >= removedPath.length &&
      pathsEqual(op.path.slice(0, removedPath.length), removedPath)
    ) {
      return null;
    }
    let next = mapPath(op, (p) => shiftPath(p, against.path, against.index + 1, -1));
    if (
      (next.type === 'insert_node' || next.type === 'remove_node') &&
      pathsEqual(next.path, against.path) &&
      next.index > against.index
    ) {
      next = { ...next, index: next.index - 1 };
    }
    return next;
  }

  // split: index after split point +1 for paths under parent
  if (against.type === 'split_paragraph') {
    const parentPath = against.path.slice(0, -1);
    const index = against.path.at(-1);
    if (index === undefined) {
      return op;
    }
    // Ops on the left half (same path, offset <= split): keep path, maybe clamp offset
    if ('path' in op && pathsEqual(op.path, against.path)) {
      if (op.type === 'insert_text') {
        if (op.offset <= against.offset) {
          return op;
        }
        return {
          ...op,
          path: [...parentPath, index + 1],
          offset: op.offset - against.offset,
        };
      }
      if (op.type === 'delete_text') {
        if (op.offset + op.length <= against.offset) {
          return op;
        }
        if (op.offset >= against.offset) {
          return {
            ...op,
            path: [...parentPath, index + 1],
            offset: op.offset - against.offset,
          };
        }
        // Spans split: keep left portion only
        return { ...op, length: against.offset - op.offset };
      }
      if (op.type === 'split_paragraph') {
        if (op.offset <= against.offset) {
          return op;
        }
        return {
          ...op,
          path: [...parentPath, index + 1],
          offset: op.offset - against.offset,
        };
      }
    }
    return mapPath(op, (p) => shiftPath(p, parentPath, index + 1, 1));
  }

  if (against.type === 'merge_paragraph') {
    const parentPath = against.path.slice(0, -1);
    const index = against.path.at(-1);
    if (index === undefined || index <= 0) {
      return op;
    }
    const leftPath = [...parentPath, index - 1];
    const rightPath = against.path;
    // Approximate: paths after right shift down; ops on right move to left with offset bump unknown → keep & shift indices
    if ('path' in op && pathsEqual(op.path, rightPath)) {
      // Without join length we cannot fix offsets perfectly; shift path to left and leave offsets
      return mapPath(op, () => leftPath);
    }
    return mapPath(op, (p) => shiftPath(p, parentPath, index, -1));
  }

  // Text insert/delete on same path
  if (against.type === 'insert_text' && 'path' in op && pathsEqual(op.path, against.path)) {
    return mapOffset(op, against.path, (o) => (o >= against.offset ? o + against.text.length : o));
  }
  if (against.type === 'delete_text' && 'path' in op && pathsEqual(op.path, against.path)) {
    const delStart = against.offset;
    const delEnd = against.offset + against.length;
    return mapOffset(op, against.path, (o) => {
      if (o >= delEnd) {
        return o - against.length;
      }
      if (o >= delStart) {
        return delStart;
      }
      return o;
    });
  }

  if (against.type === 'replace_slice' && 'path' in op && pathsEqual(op.path, against.path)) {
    const removed = against.to - against.from;
    const inserted = against.runs.reduce((n, r) => n + r.text.length, 0);
    const delta = inserted - removed;
    return mapOffset(op, against.path, (o) => {
      if (o >= against.to) {
        return o + delta;
      }
      if (o >= against.from) {
        return against.from + inserted;
      }
      return o;
    });
  }

  return op;
}

/** Transform a sequence of ops against a single already-applied op. */
export function transformOps(ops: Operation[], against: Operation): Operation[] {
  const out: Operation[] = [];
  for (const op of ops) {
    const next = transformOp(op, against);
    if (next) {
      out.push(next);
    }
  }
  return out;
}

/**
 * Rebase client ops that were based on `baseVersion` against server ops
 * that landed since (in order). Returns ops safe to apply on the new tip.
 */
export function rebaseOps(clientOps: Operation[], serverOps: Operation[]): Operation[] {
  let pending: Operation[] = clientOps.filter((o) => o.type !== 'set_selection');
  for (const serverOp of serverOps) {
    if (serverOp.type === 'set_selection') {
      continue;
    }
    pending = transformOps(pending, serverOp);
  }
  return pending;
}
