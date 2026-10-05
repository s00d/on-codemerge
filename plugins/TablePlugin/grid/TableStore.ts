import type {
  CellStyle,
  CellValue,
  TableColumn,
  TableGridDoc,
  TableTheme,
  TableViewState,
  TableGridSource,
} from '../io/adapters';
import { emptyTableGrid, normalizeTableGrid } from '../io/adapters';
import { isGroupRowId } from './derive/group';
import { deriveGrid } from './derive/pipeline';
import { columnWidths } from './derive/widths';
import type { ColResize } from './derive/widths';
import {
  addColumn as addColumnOp,
  addRow as addRowOp,
  clearTable as clearTableOp,
  deleteColumn as deleteColumnOp,
  deleteRow as deleteRowOp,
  ensureCell as ensureCellOp,
  extentAfterDoc,
  mergeHorizontal as mergeHorizontalOp,
  mergeVertical as mergeVerticalOp,
  reorderColumns as reorderColumnsOp,
  setCell as setCellOp,
  setCellStyle as setCellStyleOp,
  setColumnMeta as setColumnMetaOp,
  setSource as setSourceOp,
  setTheme as setThemeOp,
  setView as setViewOp,
  sheetColumnIds,
  sheetRowIds,
  splitActive as splitActiveOp,
  toggleSort as toggleSortOp,
} from './ops';
import { emptySelection, setActiveCell, toggleRowSelection } from './selection';
import { growExtent, SHEET_ROW_CAP } from './sheet';
import type { DerivedSlice, GridSelection, TableStoreListener } from './types';

export type TableStoreOptions = {
  onCommit?: (doc: TableGridDoc) => void;
  commitDebounceMs?: number;
};

export class TableStore {
  private doc: TableGridDoc;
  private selection: GridSelection = emptySelection();
  private layoutWidth = 0;
  private resizeCol: ColResize | null = null;
  private sheetRows = 40;
  private sheetCols = 0;
  private readonly listeners = new Set<TableStoreListener>();
  private readonly onCommit?: (doc: TableGridDoc) => void;
  private readonly commitDebounceMs: number;
  private commitTimer: ReturnType<typeof setTimeout> | null = null;
  private editing = false;
  private editingHeader: string | null = null;

  constructor(initial?: TableGridDoc, opts: TableStoreOptions = {}) {
    this.doc = normalizeTableGrid(initial ?? emptyTableGrid());
    this.onCommit = opts.onCommit;
    this.commitDebounceMs = opts.commitDebounceMs ?? 120;
    this.syncSheetExtent();
  }

  subscribe(fn: TableStoreListener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emit(): void {
    for (const fn of this.listeners) {
      fn();
    }
  }

  private scheduleCommit(): void {
    if (!this.onCommit) {
      return;
    }
    if (this.commitTimer) {
      clearTimeout(this.commitTimer);
    }
    this.commitTimer = setTimeout(() => {
      this.commitTimer = null;
      this.onCommit?.(this.getDoc());
    }, this.commitDebounceMs);
  }

  flushCommit(): void {
    if (this.commitTimer) {
      clearTimeout(this.commitTimer);
      this.commitTimer = null;
    }
    this.onCommit?.(this.getDoc());
  }

  hasPendingCommit(): boolean {
    return this.commitTimer !== null;
  }

  private apply(next: TableGridDoc, opts?: { commit?: 'now' | 'debounce' | 'none' }): void {
    if (next === this.doc) {
      return;
    }
    this.doc = next;
    this.syncSheetExtent();
    this.emit();
    if (opts?.commit === 'now') {
      this.flushCommit();
    } else if (opts?.commit === 'debounce') {
      this.scheduleCommit();
    }
  }

  private syncSheetExtent(): void {
    const next = extentAfterDoc(this.doc, this.sheetRows);
    this.sheetRows = next.sheetRows;
    this.sheetCols = next.sheetCols;
  }

  getDoc(): TableGridDoc {
    return structuredClone(this.doc);
  }

  setDoc(doc: TableGridDoc, opts?: { commit?: boolean }): void {
    if (this.commitTimer) {
      clearTimeout(this.commitTimer);
      this.commitTimer = null;
    }
    this.doc = normalizeTableGrid(doc);
    this.syncSheetExtent();
    this.emit();
    if (opts?.commit) {
      this.flushCommit();
    }
  }

  isEditing(): boolean {
    return this.editing;
  }

  setEditing(next: boolean): void {
    if (this.editing === next) {
      return;
    }
    this.editing = next;
    if (next) {
      this.editingHeader = null;
    }
    this.emit();
  }

  getEditingHeader(): string | null {
    return this.editingHeader;
  }

  setEditingHeader(colId: string | null): void {
    if (this.editingHeader === colId) {
      return;
    }
    this.editingHeader = colId;
    if (colId) {
      this.editing = false;
    }
    this.emit();
  }

  getSelection(): GridSelection {
    return structuredClone(this.selection);
  }

  setSelection(sel: GridSelection): void {
    this.selection = sel;
    this.emit();
  }

  selectRow(rowId: string, opts?: { additive?: boolean; range?: boolean }): void {
    const ordered = this.getDerived().rowIds.filter((id) => !isGroupRowId(id));
    this.selection = toggleRowSelection(this.selection, rowId, {
      additive: opts?.additive,
      rangeTo: opts?.range ? this.selection.active?.rowId : undefined,
      orderedIds: ordered,
    });
    if (!this.selection.active?.colId) {
      const colId = this.getDerived().columnIds[0] ?? '';
      this.selection = setActiveCell(this.selection, rowId, colId, true);
    }
    this.emit();
  }

  setActive(rowId: string, colId: string): void {
    const next = setActiveCell(this.selection, rowId, colId, true);
    if (
      next.active?.rowId === this.selection.active?.rowId &&
      next.active?.colId === this.selection.active?.colId &&
      next.rowIds.length === this.selection.rowIds.length &&
      next.rowIds.every((id, i) => id === this.selection.rowIds[i])
    ) {
      return;
    }
    this.selection = next;
    this.emit();
  }

  setLayoutWidth(width: number): void {
    const w = Math.max(0, Math.floor(width));
    if (w === this.layoutWidth) {
      return;
    }
    this.layoutWidth = w;
    this.emit();
  }

  getSheetRowCount(): number {
    return this.sheetRows;
  }

  getSheetColumnIds(): string[] {
    return sheetColumnIds(this.doc, this.sheetCols);
  }

  getSheetRowIds(): string[] {
    return sheetRowIds(this.doc, this.sheetRows);
  }

  getColumnWidths(): Map<string, number> {
    return columnWidths(this.doc, this.getSheetColumnIds(), this.layoutWidth, this.resizeCol);
  }

  setColResize(colId: string, width: number): void {
    this.resizeCol = { id: colId, width: Math.max(64, width) };
    this.emit();
  }

  commitColResize(): void {
    const widths = this.getColumnWidths();
    const columns = this.doc.columns.map((c) => {
      const w = widths.get(c.id);
      return w === undefined ? c : { ...c, width: w };
    });
    this.resizeCol = null;
    this.apply({ ...this.doc, columns }, { commit: 'now' });
  }

  getDerived(): DerivedSlice {
    return deriveGrid(this.doc);
  }

  growSheetRows(): void {
    const next = growExtent(this.sheetRows, SHEET_ROW_CAP, 20);
    if (next === this.sheetRows) {
      return;
    }
    this.sheetRows = next;
    this.emit();
  }

  ensureCell(rowIndex: number, colId: string): { rowId: string; colId: string } | null {
    const got = ensureCellOp(this.doc, rowIndex, colId, this.sheetCols, this.sheetRows);
    if (!got) {
      return null;
    }
    const changed = got.doc !== this.doc;
    const prev = this.selection.active;
    this.doc = got.doc;
    this.syncSheetExtent();
    this.selection = setActiveCell(this.selection, got.rowId, got.colId, true);
    if (changed || prev?.rowId !== got.rowId || prev?.colId !== got.colId) {
      this.emit();
    }
    if (changed) {
      this.flushCommit();
    }
    return { rowId: got.rowId, colId: got.colId };
  }

  setSource(source: TableGridSource | undefined): void {
    this.apply(setSourceOp(this.doc, source), { commit: 'now' });
  }

  setCell(rowId: string, colId: string, value: CellValue): void {
    this.apply(setCellOp(this.doc, rowId, colId, value), { commit: 'debounce' });
  }

  addRow(anchorId?: string, opts?: { before?: boolean }): void {
    this.apply(addRowOp(this.doc, anchorId, opts), { commit: 'now' });
  }

  addColumn(
    partial?: Partial<TableColumn>,
    opts?: { beforeColId?: string; afterColId?: string }
  ): void {
    this.apply(addColumnOp(this.doc, partial, opts), { commit: 'now' });
  }

  deleteRow(rowId: string): void {
    const next = deleteRowOp(this.doc, rowId);
    if (next === this.doc) {
      return;
    }
    this.selection = {
      rowIds: this.selection.rowIds.filter((id) => id !== rowId),
      active: this.selection.active?.rowId === rowId ? null : this.selection.active,
    };
    this.apply(next, { commit: 'now' });
  }

  deleteColumn(colId: string): void {
    this.apply(deleteColumnOp(this.doc, colId), { commit: 'now' });
  }

  setColumnMeta(colId: string, patch: Partial<TableColumn>, opts?: { commit?: boolean }): void {
    this.apply(setColumnMetaOp(this.doc, colId, patch), {
      commit: opts?.commit === false ? 'none' : 'now',
    });
  }

  reorderColumns(order: string[]): void {
    this.apply(reorderColumnsOp(this.doc, order), { commit: 'now' });
  }

  setView(patch: Partial<TableViewState>): void {
    this.apply(setViewOp(this.doc, patch), { commit: 'now' });
  }

  toggleSort(colId: string): void {
    this.apply(toggleSortOp(this.doc, colId), { commit: 'now' });
  }

  clearCell(rowId: string, colId: string): void {
    this.apply(setCellOp(this.doc, rowId, colId, ''), { commit: 'now' });
  }

  clearTable(): void {
    this.apply(clearTableOp(this.doc), { commit: 'now' });
  }

  setCellStyle(rowId: string, colId: string, patch: Partial<CellStyle>): void {
    this.apply(setCellStyleOp(this.doc, rowId, colId, patch), { commit: 'now' });
  }

  setTheme(theme: TableTheme): void {
    this.apply(setThemeOp(this.doc, theme), { commit: 'now' });
  }

  mergeHorizontal(): void {
    const active = this.selection.active;
    if (!active) {
      return;
    }
    this.apply(mergeHorizontalOp(this.doc, active), { commit: 'now' });
  }

  mergeVertical(): void {
    const active = this.selection.active;
    if (!active) {
      return;
    }
    this.apply(mergeVerticalOp(this.doc, active), { commit: 'now' });
  }

  splitActive(): void {
    const active = this.selection.active;
    if (!active) {
      return;
    }
    this.apply(splitActiveOp(this.doc, active), { commit: 'now' });
  }

  destroy(): void {
    if (this.commitTimer) {
      this.flushCommit();
    }
    this.listeners.clear();
  }
}
