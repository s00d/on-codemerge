import type { TableRow } from '../io/adapters';
import { isPlainObject } from '../io/matrix';

export type CellSpan = { cols?: number; rows?: number };

export function spanSize(span: CellSpan | undefined): { cols: number; rows: number } {
  return {
    cols: Math.max(1, span?.cols ?? 1),
    rows: Math.max(1, span?.rows ?? 1),
  };
}

export function normalizeSpans(
  spans: unknown,
  colIds: Set<string>
): Record<string, CellSpan> | undefined {
  if (!isPlainObject(spans)) {
    return undefined;
  }
  const out: Record<string, CellSpan> = {};
  for (const [id, raw] of Object.entries(spans)) {
    if (!colIds.has(id) || !isPlainObject(raw)) {
      continue;
    }
    const cols = typeof raw.cols === 'number' && raw.cols > 1 ? Math.floor(raw.cols) : undefined;
    const rows = typeof raw.rows === 'number' && raw.rows > 1 ? Math.floor(raw.rows) : undefined;
    if (cols === undefined && rows === undefined) {
      continue;
    }
    const next: CellSpan = {};
    if (cols !== undefined) {
      next.cols = cols;
    }
    if (rows !== undefined) {
      next.rows = rows;
    }
    out[id] = next;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function isCovered(
  rows: TableRow[],
  columnIds: string[],
  rowIndex: number,
  colIndex: number
): boolean {
  for (let r = 0; r <= rowIndex; r++) {
    const row = rows[r];
    if (row === undefined) {
      continue;
    }
    for (let c = 0; c < columnIds.length; c++) {
      if (r === rowIndex && c === colIndex) {
        continue;
      }
      const id = columnIds[c];
      if (id === undefined) {
        continue;
      }
      const { cols, rows: rs } = spanSize(row.spans?.[id]);
      if (cols <= 1 && rs <= 1) {
        continue;
      }
      if (rowIndex >= r && rowIndex < r + rs && colIndex >= c && colIndex < c + cols) {
        return true;
      }
    }
  }
  return false;
}
