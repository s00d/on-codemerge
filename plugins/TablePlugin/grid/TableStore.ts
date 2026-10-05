import { nextId } from '@codemerge/kernel';
import type {
  CellValue,
  TableColumn,
  TableGridDoc,
  TableRow,
  TableViewState,
} from '../io/adapters';
import { coerceCellForColumn, emptyTableGrid, normalizeTableGrid } from '../io/adapters';
import { layoutColumns } from './derive/columns';
import { filterRowIds } from './derive/filter';
import { groupRowIds, isGroupRowId } from './derive/group';
import { pageRowIds } from './derive/page';
import { sortRowIds } from './derive/sort';
import { flattenTreeRowIds } from './derive/tree';
import { emptySelection, setActiveCell, toggleRowSelection } from './selection';
import type { DerivedSlice, GridSelection, TableStoreListener, ViewportWindow } from './types';
import { DEFAULT_ROW_HEIGHT, visibleWindow } from './viewport';

export type TableStoreOptions = {
  onCommit?: (doc: TableGridDoc) => void;
  commitDebounceMs?: number;
};

export class TableStore {
  private doc: TableGridDoc;
  private selection: GridSelection = emptySelection();
  private viewport: ViewportWindow = {
    start: 0,
    end: 40,
    rowHeight: DEFAULT_ROW_HEIGHT,
    clientHeight: 400,
  };
  private readonly listeners = new Set<TableStoreListener>();
  private readonly onCommit?: (doc: TableGridDoc) => void;
  private readonly commitDebounceMs: number;
  private commitTimer: ReturnType<typeof setTimeout> | null = null;
  private editing = false;

  constructor(initial?: TableGridDoc, opts: TableStoreOptions = {}) {
    this.doc = normalizeTableGrid(initial ?? emptyTableGrid());
    this.onCommit = opts.onCommit;
    this.commitDebounceMs = opts.commitDebounceMs ?? 120;
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

  getDoc(): TableGridDoc {
    return structuredClone(this.doc);
  }

  /** Replace SoT from kernel / raw (no commit echo). */
  setDoc(doc: TableGridDoc): void {
    if (this.commitTimer) {
      clearTimeout(this.commitTimer);
      this.commitTimer = null;
    }
    this.doc = normalizeTableGrid(doc);
    this.clampViewport();
    this.emit();
  }

  isEditing(): boolean {
    return this.editing;
  }

  setEditing(next: boolean): void {
    if (this.editing === next) {
      return;
    }
    this.editing = next;
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
    this.selection = setActiveCell(this.selection, rowId, colId, true);
    this.emit();
  }

  getViewport(): ViewportWindow {
    return { ...this.viewport };
  }

  setScroll(scrollTop: number, clientHeight: number): void {
    const derived = this.getDerived();
    const next = visibleWindow(
      scrollTop,
      clientHeight,
      derived.rowIds.length,
      this.viewport.rowHeight
    );
    if (
      next.start === this.viewport.start &&
      next.end === this.viewport.end &&
      next.clientHeight === this.viewport.clientHeight
    ) {
      return;
    }
    this.viewport = next;
    this.emit();
  }

  /** Keep virtual window inside current derived row list. */
  clampViewport(): void {
    const n = this.getDerived().rowIds.length;
    if (this.viewport.start < n) {
      if (this.viewport.end > n) {
        this.viewport = { ...this.viewport, end: n };
      }
      return;
    }
    this.viewport = visibleWindow(0, this.viewport.clientHeight, n, this.viewport.rowHeight);
  }

  getDerived(): DerivedSlice {
    const layout = layoutColumns(this.doc);
    let rowIds = this.doc.rows.map((r) => r.id);
    rowIds = filterRowIds(this.doc, rowIds);
    rowIds = sortRowIds(this.doc, rowIds);
    const hasTree = this.doc.rows.some((r) => r.parentId);
    if (hasTree) {
      rowIds = flattenTreeRowIds(this.doc, rowIds);
    }
    const grouped = groupRowIds(
      this.doc,
      rowIds.filter((id) => !isGroupRowId(id))
    );
    rowIds = (this.doc.view?.groupBy?.length ?? 0) > 0 ? grouped.displayIds : rowIds;
    const page = pageRowIds(this.doc, rowIds);
    return {
      columnIds: layout.columnIds,
      pinnedLeft: layout.pinnedLeft,
      pinnedRight: layout.pinnedRight,
      center: layout.center,
      rowIds: page.rowIds,
      orderedRowIds: rowIds,
      groups: grouped.groups,
      totalRowCount: page.totalRowCount,
      page: page.page,
      pageSize: page.pageSize,
      pageCount: page.pageCount,
    };
  }

  /** Rows in the current viewport window (for virtualization). */
  getVisibleRowIds(): string[] {
    const { rowIds } = this.getDerived();
    const { start, end } = this.viewport;
    return rowIds.slice(start, end);
  }

  setCell(rowId: string, colId: string, value: CellValue): void {
    const idx = this.doc.rows.findIndex((r) => r.id === rowId);
    if (idx === -1) {
      return;
    }
    const row = this.doc.rows[idx];
    if (row === undefined || !this.doc.columns.some((c) => c.id === colId)) {
      return;
    }
    const col = this.doc.columns.find((c) => c.id === colId);
    if (col?.editable === false) {
      return;
    }
    const stored = coerceCellForColumn(col, value);
    const nextRows = [...this.doc.rows];
    nextRows[idx] = { ...row, cells: { ...row.cells, [colId]: stored } };
    this.doc = { ...this.doc, rows: nextRows };
    this.emit();
    this.scheduleCommit();
  }

  addRow(afterId?: string): void {
    const cells: Record<string, CellValue> = {};
    for (const col of this.doc.columns) {
      cells[col.id] = '';
    }
    const row: TableRow = { id: nextId('row'), cells };
    const rows = [...this.doc.rows];
    if (afterId) {
      const i = rows.findIndex((r) => r.id === afterId);
      rows.splice(i >= 0 ? i + 1 : rows.length, 0, row);
    } else {
      rows.push(row);
    }
    this.doc = { ...this.doc, rows };
    this.emit();
    this.flushCommit();
  }

  addColumn(partial?: Partial<TableColumn>): void {
    const col: TableColumn = {
      id: partial?.id || nextId('col'),
      title: partial?.title || `Col ${this.doc.columns.length + 1}`,
      type: partial?.type ?? 'text',
      ...partial,
    };
    const columns = [...this.doc.columns, col];
    const rows = this.doc.rows.map((r) => ({
      ...r,
      cells: { ...r.cells, [col.id]: '' },
    }));
    this.doc = { ...this.doc, columns, rows };
    this.emit();
    this.flushCommit();
  }

  deleteRow(rowId: string): void {
    if (isGroupRowId(rowId) || this.doc.rows.length <= 1) {
      return;
    }
    if (!this.doc.rows.some((r) => r.id === rowId)) {
      return;
    }
    const rows = this.doc.rows
      .filter((r) => r.id !== rowId)
      .map((r) => (r.parentId === rowId ? { ...r, parentId: null } : r));
    this.doc = { ...this.doc, rows };
    this.selection = {
      rowIds: this.selection.rowIds.filter((id) => id !== rowId),
      active: this.selection.active?.rowId === rowId ? null : this.selection.active,
    };
    this.clampViewport();
    this.emit();
    this.flushCommit();
  }

  deleteColumn(colId: string): void {
    if (this.doc.columns.length <= 1) {
      return;
    }
    const columns = this.doc.columns.filter((c) => c.id !== colId);
    const rows = this.doc.rows.map((r) => {
      const cells = { ...r.cells };
      delete cells[colId];
      return { ...r, cells };
    });
    this.doc = { ...this.doc, columns, rows };
    this.emit();
    this.flushCommit();
  }

  setColumnMeta(colId: string, patch: Partial<TableColumn>, opts?: { commit?: boolean }): void {
    const columns = this.doc.columns.map((c) =>
      c.id === colId ? { ...c, ...patch, id: c.id } : c
    );
    this.doc = { ...this.doc, columns };
    this.emit();
    if (opts?.commit === false) {
      return;
    }
    this.flushCommit();
  }

  reorderColumns(order: string[]): void {
    this.doc = {
      ...this.doc,
      view: { ...this.doc.view, columnOrder: order },
    };
    this.emit();
    this.flushCommit();
  }

  setView(patch: Partial<TableViewState>): void {
    const view: TableViewState = { ...this.doc.view, ...patch };
    if ('expandedRowIds' in patch && patch.expandedRowIds === undefined) {
      delete view.expandedRowIds;
    }
    if ('expandedGroupIds' in patch && patch.expandedGroupIds === undefined) {
      delete view.expandedGroupIds;
    }
    if ('groupBy' in patch && (patch.groupBy === undefined || patch.groupBy.length === 0)) {
      delete view.groupBy;
    }
    this.doc = {
      ...this.doc,
      view: Object.keys(view).length > 0 ? view : undefined,
    };
    this.clampViewport();
    this.emit();
    this.flushCommit();
  }

  toggleSort(colId: string): void {
    const sort = [...(this.doc.view?.sort ?? [])];
    const idx = sort.findIndex((s) => s.colId === colId);
    if (idx === -1) {
      sort.push({ colId, dir: 'asc' });
    } else if (sort[idx]?.dir === 'asc') {
      sort[idx] = { colId, dir: 'desc' };
    } else {
      sort.splice(idx, 1);
    }
    this.setView({ sort });
  }

  replaceDoc(doc: TableGridDoc): void {
    this.doc = normalizeTableGrid(doc);
    this.clampViewport();
    this.emit();
    this.flushCommit();
  }

  destroy(): void {
    if (this.commitTimer) {
      this.flushCommit();
    }
    this.listeners.clear();
  }
}
