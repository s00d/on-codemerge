import type { TableColumn, TableGridDoc } from '../../io/adapters';

export const ROW_INDEX_GUTTER = 40;
export const ADD_COL_GUTTER = 32;
export const MIN_COL_WIDTH = 64;
export const DEFAULT_COL_WIDTH = 128;

export type ColResize = { id: string; width: number };

export function columnWeight(col: TableColumn | undefined): number {
  const w = col?.width;
  return typeof w === 'number' && Number.isFinite(w) && w > 0 ? w : DEFAULT_COL_WIDTH;
}

export function columnWidths(
  doc: TableGridDoc,
  columnIds: string[],
  clientWidth: number,
  freeze?: ColResize | null
): Map<string, number> {
  const byCol = new Map(doc.columns.map((c) => [c.id, c]));
  const fill = doc.view?.fit !== 'content';
  const n = columnIds.length;
  const out = new Map<string, number>();
  if (n === 0) {
    return out;
  }

  const weightOf = (id: string): number => {
    if (freeze?.id === id) {
      return Math.max(MIN_COL_WIDTH, freeze.width);
    }
    return columnWeight(byCol.get(id));
  };

  const avail = Math.max(0, Math.floor(clientWidth) - ROW_INDEX_GUTTER - ADD_COL_GUTTER);
  const canFill = fill && avail >= MIN_COL_WIDTH * n;

  if (!canFill) {
    for (const id of columnIds) {
      out.set(id, Math.max(MIN_COL_WIDTH, Math.round(weightOf(id))));
    }
    return out;
  }

  const frozenId = freeze?.id;
  const frozen = frozenId !== undefined && columnIds.includes(frozenId);
  const restIds = frozen ? columnIds.filter((id) => id !== frozenId) : columnIds;
  let frozenW = 0;
  if (frozen && freeze !== undefined && freeze !== null) {
    const maxFrozen = Math.max(MIN_COL_WIDTH, avail - MIN_COL_WIDTH * restIds.length);
    frozenW = Math.min(maxFrozen, Math.max(MIN_COL_WIDTH, freeze.width));
  }
  const pool = frozen ? Math.max(0, avail - frozenW) : avail;
  const targetIds = frozen ? restIds : columnIds;
  const weights = targetIds.map((id) => weightOf(id));
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  let used = 0;
  targetIds.forEach((id, i) => {
    const last = i === targetIds.length - 1;
    const raw = (weights[i] ?? DEFAULT_COL_WIDTH) / sum;
    const w = last
      ? Math.max(MIN_COL_WIDTH, pool - used)
      : Math.max(MIN_COL_WIDTH, Math.round(raw * pool));
    if (!last) {
      used += w;
    }
    out.set(id, w);
  });
  if (frozen && frozenId !== undefined) {
    out.set(frozenId, frozenW);
  }
  return out;
}
