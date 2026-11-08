import { nextId } from '@codemerge/kernel';
import type {
  CellStyle,
  CellValue,
  TableColumn,
  TableGridDoc,
  TableGridSource,
  TableRow,
  TableTheme,
  TableViewState,
} from '../io/adapters';
import { coerceCellForColumn } from '../io/adapters';
import { stringifyCell } from '../io/matrix';
import { layoutColumns } from './derive/columns';
import { deriveGrid } from './derive/pipeline';
import { isGroupRowId } from './derive/group';
import { isCovered, spanSize, spansVisible } from './spans';
import type { CellSpan } from './spans';
import {
  colLetter,
  defaultSheetCols,
  defaultSheetRows,
  isGhostColId,
  isGhostRowId,
  padColumnIds,
  padRowIds,
  SHEET_COL_CAP,
  SHEET_ROW_CAP,
} from './sheet';

export function emptyRow(doc: TableGridDoc): TableRow {
  const cells: Record<string, CellValue> = {};
  for (const col of doc.columns) {
    cells[col.id] = '';
  }
  return { id: nextId('row'), cells };
}

export function materializeRows(doc: TableGridDoc, rowIndex: number): TableGridDoc {
  if (rowIndex < 0 || rowIndex >= SHEET_ROW_CAP) {
    return doc;
  }
  const rows = [...doc.rows];
  while (rows.length <= rowIndex) {
    rows.push(emptyRow(doc));
  }
  return { ...doc, rows };
}

export function materializeColumns(doc: TableGridDoc, visualIndex: number): TableGridDoc {
  if (visualIndex < 0 || visualIndex >= SHEET_COL_CAP) {
    return doc;
  }
  const columns = [...doc.columns];
  const rows = doc.rows.map((r) => ({ ...r, cells: { ...r.cells } }));
  while (columns.length <= visualIndex) {
    const col: TableColumn = {
      id: nextId('col'),
      title: colLetter(columns.length),
      type: 'text',
    };
    columns.push(col);
    for (const row of rows) {
      row.cells[col.id] = '';
    }
  }
  return { ...doc, columns, rows };
}

export function sheetColumnIds(doc: TableGridDoc, sheetCols: number): string[] {
  return padColumnIds(deriveGrid(doc).columnIds, sheetCols);
}

export function sheetRowIds(doc: TableGridDoc, sheetRows: number): string[] {
  return padRowIds(deriveGrid(doc).rowIds, sheetRows);
}

export function ensureCell(
  doc: TableGridDoc,
  rowIndex: number,
  colId: string,
  sheetCols: number,
  sheetRows: number
): { doc: TableGridDoc; rowId: string; colId: string } | null {
  const colIds = sheetColumnIds(doc, sheetCols);
  const rowIds = sheetRowIds(doc, sheetRows);
  const existingRow = rowIds[rowIndex];
  if (existingRow !== undefined && isGroupRowId(existingRow)) {
    return null;
  }
  const needsCol = isGhostColId(colId) || !doc.columns.some((c) => c.id === colId);
  const needsRow = existingRow === undefined || isGhostRowId(existingRow);
  if (!needsCol && !needsRow && existingRow) {
    return { doc, rowId: existingRow, colId };
  }
  let next = doc;
  let resolvedCol = colId;
  if (needsCol) {
    const visual = colIds.indexOf(colId);
    const target = visual >= 0 ? visual : next.columns.length;
    next = materializeColumns(next, target);
    resolvedCol = next.columns[target]?.id ?? next.columns[next.columns.length - 1]?.id ?? '';
  }
  if (!resolvedCol) {
    return null;
  }
  if (!needsRow) {
    return { doc: next, rowId: existingRow, colId: resolvedCol };
  }
  // Sheet index counts group headers / ignores filtered-out rows, so it is not a doc.rows index:
  // add one SoT row per ghost (or past-the-end) slot up to rowIndex, and return the last new row.
  let missing = Math.max(0, rowIndex - rowIds.length + 1);
  for (let i = 0; i <= rowIndex && i < rowIds.length; i++) {
    if (isGhostRowId(rowIds[i] ?? '')) {
      missing += 1;
    }
  }
  const target = next.rows.length + missing - 1;
  next = materializeRows(next, target);
  const rowId = next.rows[target]?.id;
  if (rowId === undefined) {
    return null;
  }
  return { doc: next, rowId, colId: resolvedCol };
}

export function setSource(doc: TableGridDoc, source: TableGridSource | undefined): TableGridDoc {
  const next = { ...doc };
  if (source) {
    next.source = source;
  } else {
    delete next.source;
  }
  return next;
}

export function setCell(
  doc: TableGridDoc,
  rowId: string,
  colId: string,
  value: CellValue
): TableGridDoc {
  const idx = doc.rows.findIndex((r) => r.id === rowId);
  if (idx === -1) {
    return doc;
  }
  const row = doc.rows[idx];
  if (row === undefined || !doc.columns.some((c) => c.id === colId)) {
    return doc;
  }
  const col = doc.columns.find((c) => c.id === colId);
  if (col?.editable === false) {
    return doc;
  }
  const stored = coerceCellForColumn(col, value);
  const nextRows = [...doc.rows];
  nextRows[idx] = { ...row, cells: { ...row.cells, [colId]: stored } };
  return { ...doc, rows: nextRows };
}

export function addRow(
  doc: TableGridDoc,
  anchorId?: string,
  opts?: { before?: boolean }
): TableGridDoc {
  const row = emptyRow(doc);
  const rows = [...doc.rows];
  if (anchorId) {
    const i = rows.findIndex((r) => r.id === anchorId);
    const at = i < 0 ? rows.length : opts?.before ? i : i + 1;
    rows.splice(at, 0, row);
  } else {
    rows.push(row);
  }
  return { ...doc, rows };
}

export function addColumn(
  doc: TableGridDoc,
  partial?: Partial<TableColumn>,
  opts?: { beforeColId?: string; afterColId?: string }
): TableGridDoc {
  const col: TableColumn = {
    id: partial?.id || nextId('col'),
    title: partial?.title || `Col ${doc.columns.length + 1}`,
    type: partial?.type ?? 'text',
    ...partial,
  };
  const columns = [...doc.columns];
  const before = opts?.beforeColId;
  const after = opts?.afterColId;
  let insertAt = columns.length;
  if (before) {
    const i = columns.findIndex((c) => c.id === before);
    insertAt = i >= 0 ? i : columns.length;
  } else if (after) {
    const i = columns.findIndex((c) => c.id === after);
    insertAt = i >= 0 ? i + 1 : columns.length;
  }
  columns.splice(insertAt, 0, col);
  const rows = doc.rows.map((r) => ({
    ...r,
    cells: { ...r.cells, [col.id]: '' },
  }));
  const order = doc.view?.columnOrder;
  let view = doc.view;
  if (order && order.length > 0) {
    const nextOrder = [...order];
    const oi = before ? nextOrder.indexOf(before) : after ? nextOrder.indexOf(after) : -1;
    if (before && oi >= 0) {
      nextOrder.splice(oi, 0, col.id);
    } else if (after && oi >= 0) {
      nextOrder.splice(oi + 1, 0, col.id);
    } else {
      nextOrder.push(col.id);
    }
    view = { ...view, columnOrder: nextOrder };
  }
  return { ...doc, columns, rows, view };
}

/** Shrink by one the spans that cover a deleted row/column (origin kept, axis decremented). */
function shrinkSpans(
  spans: Record<string, CellSpan>,
  axisFor: (colId: string, span: CellSpan) => 'cols' | 'rows' | null
): Record<string, CellSpan> | undefined {
  const out: Record<string, CellSpan> = {};
  for (const [id, span] of Object.entries(spans)) {
    const next: CellSpan = { ...span };
    const axis = axisFor(id, span);
    if (axis) {
      const n = spanSize(span)[axis] - 1;
      if (n > 1) {
        next[axis] = n;
      } else {
        delete next[axis];
      }
    }
    if (next.cols !== undefined || next.rows !== undefined) {
      out[id] = next;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function deleteRow(doc: TableGridDoc, rowId: string): TableGridDoc {
  if (isGroupRowId(rowId) || doc.rows.length <= 1) {
    return doc;
  }
  const ri = doc.rows.findIndex((r) => r.id === rowId);
  if (ri < 0) {
    return doc;
  }
  const rows: TableRow[] = [];
  for (const [i, r] of doc.rows.entries()) {
    if (i === ri) {
      continue;
    }
    let next = r.parentId === rowId ? { ...r, parentId: null } : r;
    if (i < ri && next.spans) {
      next = {
        ...next,
        spans: shrinkSpans(next.spans, (_id, span) =>
          i + spanSize(span).rows > ri ? 'rows' : null
        ),
      };
    }
    rows.push(next);
  }
  return { ...doc, rows };
}

export function deleteColumn(doc: TableGridDoc, colId: string): TableGridDoc {
  if (doc.columns.length <= 1 || !doc.columns.some((c) => c.id === colId)) {
    return doc;
  }
  const columnIds = layoutColumns(doc).columnIds;
  const ci = columnIds.indexOf(colId);
  const columns = doc.columns.filter((c) => c.id !== colId);
  const rows = doc.rows.map((r) => {
    const cells = { ...r.cells };
    delete cells[colId];
    const next: TableRow = { ...r, cells };
    if (next.spans) {
      const spans = { ...next.spans };
      delete spans[colId];
      next.spans = shrinkSpans(spans, (id, span) => {
        const c = columnIds.indexOf(id);
        return c >= 0 && c < ci && c + spanSize(span).cols > ci ? 'cols' : null;
      });
    }
    if (next.styles) {
      const styles = { ...next.styles };
      delete styles[colId];
      next.styles = Object.keys(styles).length > 0 ? styles : undefined;
    }
    return next;
  });
  // Drop view state keyed by the deleted column — a stale filter would hide every row.
  const view = doc.view;
  const patch: Partial<TableViewState> = {};
  if (view?.sort) {
    patch.sort = view.sort.filter((s) => s.colId !== colId);
  }
  if (view?.filters) {
    const filters = { ...view.filters };
    delete filters[colId];
    patch.filters = filters;
  }
  if (view?.groupBy) {
    patch.groupBy = view.groupBy.filter((id) => id !== colId);
  }
  if (view?.columnOrder) {
    patch.columnOrder = view.columnOrder.filter((id) => id !== colId);
  }
  const next = { ...doc, columns, rows };
  return Object.keys(patch).length > 0 ? setView(next, patch) : next;
}

export function setColumnMeta(
  doc: TableGridDoc,
  colId: string,
  patch: Partial<TableColumn>
): TableGridDoc {
  const columns = doc.columns.map((c) => (c.id === colId ? { ...c, ...patch, id: c.id } : c));
  return { ...doc, columns };
}

export function reorderColumns(doc: TableGridDoc, order: string[]): TableGridDoc {
  return {
    ...doc,
    view: { ...doc.view, columnOrder: order },
  };
}

export function setView(doc: TableGridDoc, patch: Partial<TableViewState>): TableGridDoc {
  const view: TableViewState = { ...doc.view, ...patch };
  if ('expandedRowIds' in patch && patch.expandedRowIds === undefined) {
    delete view.expandedRowIds;
  }
  if ('expandedGroupIds' in patch && patch.expandedGroupIds === undefined) {
    delete view.expandedGroupIds;
  }
  if ('groupBy' in patch && (patch.groupBy === undefined || patch.groupBy.length === 0)) {
    delete view.groupBy;
  }
  return {
    ...doc,
    view: Object.keys(view).length > 0 ? view : undefined,
  };
}

export function toggleSort(doc: TableGridDoc, colId: string): TableGridDoc {
  const sort = [...(doc.view?.sort ?? [])];
  const idx = sort.findIndex((s) => s.colId === colId);
  if (idx === -1) {
    sort.push({ colId, dir: 'asc' });
  } else if (sort[idx]?.dir === 'asc') {
    sort[idx] = { colId, dir: 'desc' };
  } else {
    sort.splice(idx, 1);
  }
  return setView(doc, { sort });
}

export function clearTable(doc: TableGridDoc): TableGridDoc {
  const rows = doc.rows.map((r) => {
    const cells: Record<string, CellValue> = {};
    for (const col of doc.columns) {
      cells[col.id] = '';
    }
    return { ...r, cells };
  });
  return { ...doc, rows };
}

export function setCellStyle(
  doc: TableGridDoc,
  rowId: string,
  colId: string,
  patch: Partial<CellStyle>
): TableGridDoc {
  const idx = doc.rows.findIndex((r) => r.id === rowId);
  if (idx === -1 || !doc.columns.some((c) => c.id === colId)) {
    return doc;
  }
  const row = doc.rows[idx];
  if (row === undefined) {
    return doc;
  }
  const prev = row.styles?.[colId] ?? {};
  const merged: CellStyle = { ...prev };
  if (patch.align !== undefined) {
    merged.align = patch.align;
  }
  if ('background' in patch) {
    if (!patch.background) {
      delete merged.background;
    } else {
      merged.background = patch.background;
    }
  }
  if ('color' in patch) {
    if (!patch.color) {
      delete merged.color;
    } else {
      merged.color = patch.color;
    }
  }
  if (patch.border !== undefined) {
    merged.border = patch.border;
  }
  const styles = { ...row.styles };
  if (Object.keys(merged).length === 0) {
    delete styles[colId];
  } else {
    styles[colId] = merged;
  }
  const nextRows = [...doc.rows];
  nextRows[idx] = {
    ...row,
    styles: Object.keys(styles).length > 0 ? styles : undefined,
  };
  return { ...doc, rows: nextRows };
}

export function setTheme(doc: TableGridDoc, theme: TableTheme): TableGridDoc {
  return {
    ...doc,
    theme: theme === 'default' ? undefined : theme,
  };
}

export function mergeHorizontal(
  doc: TableGridDoc,
  active: { rowId: string; colId: string }
): TableGridDoc {
  const derived = deriveGrid(doc);
  // Merges would be invisible (rendered unmerged) while the view reorders rows.
  if (!spansVisible(doc.rows, derived.rowIds)) {
    return doc;
  }
  const columnIds = derived.columnIds;
  const ri = doc.rows.findIndex((r) => r.id === active.rowId);
  const ci = columnIds.indexOf(active.colId);
  if (ri < 0 || ci < 0 || isCovered(doc.rows, columnIds, ri, ci)) {
    return doc;
  }
  const row = doc.rows[ri];
  if (row === undefined) {
    return doc;
  }
  const origin = spanSize(row.spans?.[active.colId]);
  const nextI = ci + origin.cols;
  const nextColId = columnIds[nextI];
  if (nextColId === undefined || isCovered(doc.rows, columnIds, ri, nextI)) {
    return doc;
  }
  const extra = spanSize(row.spans?.[nextColId]);
  const spans = { ...row.spans };
  delete spans[nextColId];
  const cols = origin.cols + extra.cols;
  const rowsN = Math.max(origin.rows, extra.rows);
  const mergedSpan: CellSpan = {};
  if (cols > 1) {
    mergedSpan.cols = cols;
  }
  if (rowsN > 1) {
    mergedSpan.rows = rowsN;
  }
  if (cols > 1 || rowsN > 1) {
    spans[active.colId] = mergedSpan;
  } else {
    delete spans[active.colId];
  }
  const merged = stringifyCell(row.cells[active.colId]) + stringifyCell(row.cells[nextColId]);
  const nextRows = [...doc.rows];
  nextRows[ri] = {
    ...row,
    cells: { ...row.cells, [active.colId]: merged, [nextColId]: '' },
    spans: Object.keys(spans).length > 0 ? spans : undefined,
  };
  return { ...doc, rows: nextRows };
}

export function mergeVertical(
  doc: TableGridDoc,
  active: { rowId: string; colId: string }
): TableGridDoc {
  const derived = deriveGrid(doc);
  if (!spansVisible(doc.rows, derived.rowIds)) {
    return doc;
  }
  const columnIds = derived.columnIds;
  const ri = doc.rows.findIndex((r) => r.id === active.rowId);
  const ci = columnIds.indexOf(active.colId);
  if (ri < 0 || ci < 0 || isCovered(doc.rows, columnIds, ri, ci)) {
    return doc;
  }
  const row = doc.rows[ri];
  if (row === undefined) {
    return doc;
  }
  const origin = spanSize(row.spans?.[active.colId]);
  const nri = ri + origin.rows;
  if (nri >= doc.rows.length || isCovered(doc.rows, columnIds, nri, ci)) {
    return doc;
  }
  const below = doc.rows[nri];
  if (below === undefined) {
    return doc;
  }
  const extra = spanSize(below.spans?.[active.colId]);
  const spans = { ...row.spans };
  const cols = Math.max(origin.cols, extra.cols);
  const rowsN = origin.rows + extra.rows;
  const mergedSpan: CellSpan = {};
  if (cols > 1) {
    mergedSpan.cols = cols;
  }
  if (rowsN > 1) {
    mergedSpan.rows = rowsN;
  }
  spans[active.colId] = mergedSpan;
  const belowSpans = { ...below.spans };
  delete belowSpans[active.colId];
  const merged = stringifyCell(row.cells[active.colId]) + stringifyCell(below.cells[active.colId]);
  const nextRows = [...doc.rows];
  nextRows[ri] = {
    ...row,
    cells: { ...row.cells, [active.colId]: merged },
    spans: Object.keys(spans).length > 0 ? spans : undefined,
  };
  nextRows[nri] = {
    ...below,
    cells: { ...below.cells, [active.colId]: '' },
    spans: Object.keys(belowSpans).length > 0 ? belowSpans : undefined,
  };
  return { ...doc, rows: nextRows };
}

export function splitActive(
  doc: TableGridDoc,
  active: { rowId: string; colId: string }
): TableGridDoc {
  const ri = doc.rows.findIndex((r) => r.id === active.rowId);
  if (ri < 0) {
    return doc;
  }
  const row = doc.rows[ri];
  if (!row?.spans?.[active.colId]) {
    return doc;
  }
  const spans = { ...row.spans };
  delete spans[active.colId];
  const nextRows = [...doc.rows];
  nextRows[ri] = { ...row, spans: Object.keys(spans).length > 0 ? spans : undefined };
  return { ...doc, rows: nextRows };
}

export function extentAfterDoc(
  doc: TableGridDoc,
  sheetRows: number
): {
  sheetRows: number;
  sheetCols: number;
} {
  return {
    sheetRows: Math.max(sheetRows, defaultSheetRows(doc.rows.length)),
    sheetCols: defaultSheetCols(doc.columns.length),
  };
}
