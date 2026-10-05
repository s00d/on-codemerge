import type { GridSelection } from './types';

export function emptySelection(): GridSelection {
  return { rowIds: [], active: null };
}

export function toggleRowSelection(
  sel: GridSelection,
  rowId: string,
  opts: { additive?: boolean; rangeTo?: string; orderedIds?: string[] } = {}
): GridSelection {
  if (opts.rangeTo && opts.orderedIds) {
    const a = opts.orderedIds.indexOf(rowId);
    const b = opts.orderedIds.indexOf(opts.rangeTo);
    if (a >= 0 && b >= 0) {
      const [lo, hi] = a < b ? [a, b] : [b, a];
      return {
        rowIds: opts.orderedIds.slice(lo, hi + 1),
        active: { rowId, colId: sel.active?.colId ?? '' },
      };
    }
  }
  if (opts.additive) {
    const set = new Set(sel.rowIds);
    if (set.has(rowId)) {
      set.delete(rowId);
    } else {
      set.add(rowId);
    }
    return {
      rowIds: [...set],
      active: { rowId, colId: sel.active?.colId ?? '' },
    };
  }
  return {
    rowIds: [rowId],
    active: { rowId, colId: sel.active?.colId ?? '' },
  };
}

export function setActiveCell(
  sel: GridSelection,
  rowId: string,
  colId: string,
  keepRows = false
): GridSelection {
  return {
    rowIds: keepRows && sel.rowIds.length > 0 ? sel.rowIds : [rowId],
    active: { rowId, colId },
  };
}
