import type { TableStore } from './TableStore';
import { isGroupRowId } from './derive/group';

export type KeyNavResult = { handled: boolean };

function moveActive(store: TableStore, nr: number, nc: number): void {
  const derived = store.getDerived();
  const rowIds = derived.rowIds.filter((id) => !isGroupRowId(id));
  const colIds = derived.columnIds;
  const nextRow = rowIds[Math.max(0, Math.min(rowIds.length - 1, nr))];
  const nextCol = colIds[Math.max(0, Math.min(colIds.length - 1, nc))];
  if (nextRow === undefined || nextCol === undefined) {
    return;
  }
  store.setActive(nextRow, nextCol);
}

/** After committing a cell editor, move down one row without re-entering edit. */
export function moveActiveDown(store: TableStore): void {
  const sel = store.getSelection();
  const derived = store.getDerived();
  const rowIds = derived.rowIds.filter((id) => !isGroupRowId(id));
  const colIds = derived.columnIds;
  const rowId = sel.active?.rowId ?? rowIds[0];
  const colId = sel.active?.colId ?? colIds[0];
  if (rowId === undefined || colId === undefined) {
    return;
  }
  const ri = rowIds.indexOf(rowId);
  const ci = colIds.indexOf(colId);
  if (ri < 0 || ci < 0) {
    return;
  }
  moveActive(store, ri + 1, ci);
}

/** Arrow/Tab/Enter/Escape navigation over derived grid. */
export function handleGridKeydown(store: TableStore, ev: KeyboardEvent): KeyNavResult {
  const sel = store.getSelection();
  const derived = store.getDerived();
  const rowIds = derived.rowIds.filter((id) => !isGroupRowId(id));
  const colIds = derived.columnIds;
  const firstRow = rowIds[0];
  const firstCol = colIds[0];
  if (firstRow === undefined || firstCol === undefined) {
    return { handled: false };
  }
  let rowId = sel.active?.rowId ?? firstRow;
  let colId = sel.active?.colId ?? firstCol;
  if (!rowIds.includes(rowId)) {
    rowId = firstRow;
  }
  if (!colIds.includes(colId)) {
    colId = firstCol;
  }
  const ri = rowIds.indexOf(rowId);
  const ci = colIds.indexOf(colId);

  switch (ev.key) {
    case 'ArrowUp':
      ev.preventDefault();
      moveActive(store, ri - 1, ci);
      return { handled: true };
    case 'ArrowDown':
      ev.preventDefault();
      moveActive(store, ri + 1, ci);
      return { handled: true };
    case 'ArrowLeft':
      if (store.isEditing()) {
        return { handled: false };
      }
      ev.preventDefault();
      moveActive(store, ri, ci - 1);
      return { handled: true };
    case 'ArrowRight':
      if (store.isEditing()) {
        return { handled: false };
      }
      ev.preventDefault();
      moveActive(store, ri, ci + 1);
      return { handled: true };
    case 'Tab':
      ev.preventDefault();
      if (ev.shiftKey) {
        if (ci > 0) {
          moveActive(store, ri, ci - 1);
        } else if (ri > 0) {
          moveActive(store, ri - 1, colIds.length - 1);
        }
      } else if (ci < colIds.length - 1) {
        moveActive(store, ri, ci + 1);
      } else if (ri < rowIds.length - 1) {
        moveActive(store, ri + 1, 0);
      }
      return { handled: true };
    case 'Enter':
      ev.preventDefault();
      if (store.isEditing()) {
        store.setEditing(false);
        moveActive(store, ri + 1, ci);
        return { handled: true };
      }
      store.setEditing(true);
      return { handled: true };
    case 'Escape':
      if (store.isEditing()) {
        ev.preventDefault();
        store.setEditing(false);
        return { handled: true };
      }
      return { handled: false };
    default:
      return { handled: false };
  }
}
