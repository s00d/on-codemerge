import type { TableGridDoc } from '../../io/adapters';
import { rowLookup } from './filter';

/** Flatten tree by parentId; respects expandedRowIds (default all expanded if unset). */
export function flattenTreeRowIds(doc: TableGridDoc, candidateIds: string[]): string[] {
  const byId = rowLookup(doc);
  const candidates = new Set(candidateIds);
  const children = new Map<string | null, string[]>();
  for (const id of candidateIds) {
    const row = byId.get(id);
    if (!row) {
      continue;
    }
    const parent =
      row.parentId && byId.has(row.parentId) && candidates.has(row.parentId) ? row.parentId : null;
    const list = children.get(parent) ?? [];
    list.push(id);
    children.set(parent, list);
  }
  const expanded = doc.view?.expandedRowIds
    ? new Set(doc.view.expandedRowIds)
    : null; /* null = all expanded */

  const out: string[] = [];
  const walk = (parent: string | null): void => {
    for (const id of children.get(parent) ?? []) {
      out.push(id);
      const open = expanded === null || expanded.has(id);
      if (open && (children.get(id)?.length ?? 0) > 0) {
        walk(id);
      }
    }
  };
  walk(null);
  return out;
}

export function rowDepth(doc: TableGridDoc, rowId: string): number {
  const byId = rowLookup(doc);
  let depth = 0;
  let cur = byId.get(rowId);
  const seen = new Set<string>();
  while (cur?.parentId && byId.has(cur.parentId) && !seen.has(cur.parentId)) {
    seen.add(cur.parentId);
    depth += 1;
    cur = byId.get(cur.parentId);
  }
  return depth;
}
