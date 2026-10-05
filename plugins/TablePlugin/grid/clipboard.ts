import { MAX_TABLE_BYTES } from '../io/constants';
import { stringifyCell } from '../io/matrix';
import type { TableStore } from './TableStore';
import { isGroupRowId } from './derive/group';

export function selectionToTsv(store: TableStore): string {
  const sel = store.getSelection();
  const derived = store.getDerived();
  const doc = store.getDoc();
  const rowIds =
    sel.rowIds.length > 0
      ? sel.rowIds.filter((id) => !isGroupRowId(id))
      : sel.active
        ? [sel.active.rowId]
        : [];
  const colIds = derived.columnIds;
  const byId = new Map(doc.rows.map((r) => [r.id, r]));
  return rowIds
    .map((rid) => {
      const row = byId.get(rid);
      return colIds.map((cid) => stringifyCell(row?.cells[cid] ?? '')).join('\t');
    })
    .join('\n');
}

export function pasteTsv(store: TableStore, text: string): void {
  if (text.length > MAX_TABLE_BYTES) {
    return;
  }
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  if (lines.length === 1 && lines[0] === '') {
    return;
  }
  const matrix = lines.map((line) => line.split('\t'));
  const sel = store.getSelection();
  const derived = store.getDerived();
  const ordered = derived.orderedRowIds.filter((id) => !isGroupRowId(id));
  const startRow = sel.active?.rowId ?? ordered[0];
  const startCol = sel.active?.colId ?? derived.columnIds[0];
  if (startRow === undefined || startCol === undefined) {
    return;
  }
  const rowIds = ordered;
  const colIds = derived.columnIds;
  const ri0 = rowIds.indexOf(startRow);
  const ci0 = colIds.indexOf(startCol);
  if (ri0 < 0 || ci0 < 0) {
    return;
  }
  for (const [dr, row] of matrix.entries()) {
    const rid = rowIds[ri0 + dr];
    if (rid === undefined) {
      break;
    }
    for (const [dc, cell] of row.entries()) {
      const cid = colIds[ci0 + dc];
      if (cid === undefined) {
        break;
      }
      store.setCell(rid, cid, cell);
    }
  }
  store.flushCommit();
}

export async function copySelection(store: TableStore): Promise<void> {
  const tsv = selectionToTsv(store);
  if (typeof navigator === 'undefined') {
    return;
  }
  const clipboard = navigator.clipboard;
  if (clipboard === undefined || typeof clipboard.writeText !== 'function') {
    return;
  }
  await clipboard.writeText(tsv);
}

export async function pasteFromClipboard(store: TableStore): Promise<void> {
  if (typeof navigator === 'undefined') {
    return;
  }
  const clipboard = navigator.clipboard;
  if (clipboard === undefined || typeof clipboard.readText !== 'function') {
    return;
  }
  const text = await clipboard.readText();
  pasteTsv(store, text);
}
