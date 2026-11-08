import { copyText, readClipboardText } from '@codemerge/sdk';
import { MAX_TABLE_BYTES } from '../io/constants';
import { escapeCsvField, parseCsv, stringifyCell } from '../io/matrix';
import type { TableStore } from './TableStore';
import { isGroupRowId } from './derive/group';
import { isGhostColId, isGhostRowId } from './sheet';

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
      return colIds
        .map((cid) => escapeCsvField(stringifyCell(row?.cells[cid] ?? ''), '\t'))
        .join('\t');
    })
    .join('\n');
}

export function pasteTsv(store: TableStore, text: string): void {
  if (text.length > MAX_TABLE_BYTES) {
    return;
  }
  const matrix = parseCsv(text, '\t');
  if (matrix.length === 0) {
    return;
  }
  const sel = store.getSelection();
  const derived = store.getDerived();
  // Sheet order, minus group header rows: targets are data rows in what the user sees.
  const dataRows = (): string[] => store.getSheetRowIds().filter((id) => !isGroupRowId(id));
  let startRow = sel.active?.rowId ?? dataRows()[0];
  let startCol = sel.active?.colId ?? derived.columnIds[0];
  if (startRow === undefined || startCol === undefined || isGroupRowId(startRow)) {
    return;
  }
  if (isGhostRowId(startRow) || isGhostColId(startCol)) {
    const ri = store.getSheetRowIds().indexOf(startRow);
    const got = store.ensureCell(ri >= 0 ? ri : 0, startCol);
    if (!got) {
      return;
    }
    startRow = got.rowId;
    startCol = got.colId;
  }
  // Snapshot before writing: sort/group may reorder rows as values land.
  const targets = dataRows();
  const ri0 = targets.indexOf(startRow);
  const ci0 = store.getDerived().columnIds.indexOf(startCol);
  if (ri0 < 0 || ci0 < 0) {
    return;
  }
  for (const [dr, row] of matrix.entries()) {
    let rowId: string | undefined = targets[ri0 + dr];
    if (rowId === undefined || isGhostRowId(rowId)) {
      const sheet = store.getSheetRowIds();
      const ghost = sheet.findIndex((id) => isGhostRowId(id));
      rowId = store.ensureCell(ghost >= 0 ? ghost : sheet.length, startCol)?.rowId;
    }
    if (rowId === undefined) {
      break;
    }
    for (const [dc, cell] of row.entries()) {
      let cid = store.getDerived().columnIds[ci0 + dc];
      if (cid === undefined) {
        store.addColumn();
        cid = store.getDerived().columnIds[ci0 + dc];
      }
      if (cid === undefined) {
        break;
      }
      store.setCell(rowId, cid, cell);
    }
  }
  store.flushCommit();
}

export async function copySelection(store: TableStore): Promise<void> {
  await copyText(selectionToTsv(store));
}

export async function pasteFromClipboard(store: TableStore): Promise<void> {
  const text = await readClipboardText();
  if (text === null) {
    return;
  }
  pasteTsv(store, text);
}
