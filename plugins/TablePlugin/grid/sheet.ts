export const GHOST_ROW_PREFIX = '__ghostrow__:';
export const GHOST_COL_PREFIX = '__ghostcol__:';

export const SHEET_ROW_MIN = 40;
export const SHEET_ROW_PAD = 12;
export const SHEET_ROW_CAP = 2000;
export const SHEET_COL_CAP = 256;

export function isGhostRowId(id: string): boolean {
  return id.startsWith(GHOST_ROW_PREFIX);
}

export function isGhostColId(id: string): boolean {
  return id.startsWith(GHOST_COL_PREFIX);
}

export function ghostRowIndex(id: string): number {
  const n = Number(id.slice(GHOST_ROW_PREFIX.length));
  return Number.isFinite(n) ? n : -1;
}

export function makeGhostRowId(index: number): string {
  return `${GHOST_ROW_PREFIX}${index}`;
}

export function makeGhostColId(index: number): string {
  return `${GHOST_COL_PREFIX}${index}`;
}

export function colLetter(index: number): string {
  let n = index;
  let out = '';
  do {
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return out;
}

/** Visual row count: always ≥ used SoT/derived rows. CAP only limits empty ghost padding. */
export function defaultSheetRows(used: number): number {
  if (used >= SHEET_ROW_CAP) {
    return used;
  }
  return Math.max(SHEET_ROW_MIN, Math.min(SHEET_ROW_CAP, used + SHEET_ROW_PAD));
}

export function defaultSheetCols(used: number): number {
  return Math.min(SHEET_COL_CAP, Math.max(0, used));
}

export function padColumnIds(realIds: string[], sheetCols: number): string[] {
  const n = Math.max(sheetCols, realIds.length);
  const ids = [...realIds];
  for (let i = realIds.length; i < n; i++) {
    ids.push(makeGhostColId(i));
  }
  return ids;
}

export function padRowIds(realIds: string[], sheetRows: number): string[] {
  const ids = [...realIds];
  while (ids.length < sheetRows) {
    ids.push(makeGhostRowId(ids.length));
  }
  return ids;
}

export function growExtent(n: number, cap: number, step: number): number {
  if (n >= cap) {
    return n;
  }
  return Math.min(cap, n + step);
}
