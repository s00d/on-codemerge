import type { DocNode } from '@codemerge/kernel';
import { nextId } from '@codemerge/kernel';
import { isPlainObject, stringifyCell } from './matrix';

export type CellValue = string | number | boolean | null;

export type TableColumn = {
  id: string;
  title: string;
  width?: number;
  pinned?: 'left' | 'right' | null;
  type?: 'text' | 'number' | 'boolean';
  editable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  renderer?: string;
  editor?: string;
};

export type TableRow = {
  id: string;
  cells: Record<string, CellValue>;
  parentId?: string | null;
};

export type TableViewState = {
  sort?: { colId: string; dir: 'asc' | 'desc' }[];
  filters?: Record<string, { op: string; value: unknown }>;
  quickFilter?: string;
  columnOrder?: string[];
  pagination?: { page: number; pageSize: number };
  /** Tree parent row ids that are expanded. */
  expandedRowIds?: string[];
  /** Group header ids (`__group__:…`) that are expanded. */
  expandedGroupIds?: string[];
  groupBy?: string[];
};

export type TableGridDoc = {
  version: 2;
  columns: TableColumn[];
  rows: TableRow[];
  view?: TableViewState;
};

const PINNED = new Set(['left', 'right']);
const COL_TYPES = new Set(['text', 'number', 'boolean']);

export function parseTableBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  if (typeof value === 'string') {
    const s = value.trim().toLowerCase();
    if (s === 'true' || s === '1' || s === 'yes') {
      return true;
    }
    return false;
  }
  return false;
}

export function coerceCellForColumn(col: TableColumn | undefined, value: CellValue): CellValue {
  if (col?.type === 'boolean') {
    return parseTableBoolean(value);
  }
  if (col?.type === 'number') {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const t = value.trim();
      if (t === '') {
        return '';
      }
      const n = Number(t);
      return Number.isFinite(n) ? n : value;
    }
    if (value === null) {
      return '';
    }
  }
  return value;
}

function coerceCellValue(value: unknown): CellValue {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string' || typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'bigint') {
    return Number(value);
  }
  return stringifyCell(value);
}

function isColumn(value: unknown): value is TableColumn {
  if (!isPlainObject(value)) {
    return false;
  }
  return typeof value.id === 'string' && typeof value.title === 'string';
}

function isV2Row(value: unknown): value is TableRow {
  if (!isPlainObject(value)) {
    return false;
  }
  if (typeof value.id !== 'string' || !isPlainObject(value.cells)) {
    return false;
  }
  return true;
}

function isV1Rows(rows: unknown[]): boolean {
  return rows.every((row) => Array.isArray(row));
}

function normalizeColumn(raw: TableColumn): TableColumn {
  const col: TableColumn = {
    id: raw.id || nextId('col'),
    title: typeof raw.title === 'string' ? raw.title : '',
  };
  if (typeof raw.width === 'number' && Number.isFinite(raw.width) && raw.width > 0) {
    col.width = raw.width;
  }
  if (raw.pinned === null) {
    col.pinned = null;
  } else if (typeof raw.pinned === 'string' && PINNED.has(raw.pinned)) {
    col.pinned = raw.pinned;
  }
  if (typeof raw.type === 'string' && COL_TYPES.has(raw.type)) {
    col.type = raw.type;
  }
  if (typeof raw.editable === 'boolean') {
    col.editable = raw.editable;
  }
  if (typeof raw.sortable === 'boolean') {
    col.sortable = raw.sortable;
  }
  if (typeof raw.filterable === 'boolean') {
    col.filterable = raw.filterable;
  }
  if (typeof raw.renderer === 'string') {
    col.renderer = raw.renderer;
  }
  if (typeof raw.editor === 'string') {
    col.editor = raw.editor;
  }
  return col;
}

function migrateV1Rows(columns: TableColumn[], rows: unknown[]): TableRow[] {
  return rows.map((row) => {
    const cells: Record<string, CellValue> = {};
    const arr = Array.isArray(row) ? row : [];
    for (const [i, col] of columns.entries()) {
      cells[col.id] = coerceCellValue(arr[i]);
    }
    return { id: nextId('row'), cells };
  });
}

/** Drop self/cyclic/missing parentId edges so tree flatten cannot hide rows. */
function stripTreeCycles(rows: TableRow[]): TableRow[] {
  const byId = new Map(rows.map((r) => [r.id, r]));
  return rows.map((row) => {
    const parentId = row.parentId;
    if (parentId === undefined || parentId === null || parentId === '') {
      return parentId === undefined || parentId === null ? row : { ...row, parentId: null };
    }
    if (parentId === row.id || !byId.has(parentId)) {
      return { ...row, parentId: null };
    }
    const seen = new Set<string>([row.id]);
    let cur: string | null | undefined = parentId;
    while (typeof cur === 'string' && cur !== '') {
      if (seen.has(cur)) {
        return { ...row, parentId: null };
      }
      seen.add(cur);
      cur = byId.get(cur)?.parentId;
    }
    return row;
  });
}

function normalizeRows(columns: TableColumn[], rows: unknown[]): TableRow[] {
  if (rows.length === 0) {
    const cells: Record<string, CellValue> = {};
    for (const col of columns) {
      cells[col.id] = '';
    }
    return [{ id: nextId('row'), cells }];
  }
  if (isV1Rows(rows)) {
    return migrateV1Rows(columns, rows);
  }
  const mapped = rows.map((row) => {
    if (!isV2Row(row)) {
      const cells: Record<string, CellValue> = {};
      for (const col of columns) {
        cells[col.id] = '';
      }
      return { id: nextId('row'), cells };
    }
    const cells: Record<string, CellValue> = {};
    for (const col of columns) {
      cells[col.id] = Object.hasOwn(row.cells, col.id) ? coerceCellValue(row.cells[col.id]) : '';
    }
    const out: TableRow = { id: row.id || nextId('row'), cells };
    if (row.parentId === null || typeof row.parentId === 'string') {
      out.parentId = row.parentId ?? null;
    }
    return out;
  });
  return stripTreeCycles(mapped);
}

function normalizeView(raw: unknown): TableViewState | undefined {
  if (!isPlainObject(raw)) {
    return undefined;
  }
  const view: TableViewState = {};
  if (Array.isArray(raw.sort)) {
    view.sort = raw.sort
      .filter(
        (s): s is { colId: string; dir: 'asc' | 'desc' } =>
          isPlainObject(s) && typeof s.colId === 'string' && (s.dir === 'asc' || s.dir === 'desc')
      )
      .map((s) => ({ colId: s.colId, dir: s.dir }));
  }
  if (isPlainObject(raw.filters)) {
    view.filters = {};
    for (const [k, v] of Object.entries(raw.filters)) {
      if (isPlainObject(v) && typeof v.op === 'string') {
        view.filters[k] = { op: v.op, value: v.value };
      }
    }
  }
  if (typeof raw.quickFilter === 'string') {
    view.quickFilter = raw.quickFilter;
  }
  if (Array.isArray(raw.columnOrder) && raw.columnOrder.every((c) => typeof c === 'string')) {
    view.columnOrder = raw.columnOrder;
  }
  if (isPlainObject(raw.pagination)) {
    const page = Number(raw.pagination.page);
    const pageSize = Number(raw.pagination.pageSize);
    if (Number.isFinite(page) && Number.isFinite(pageSize) && pageSize > 0) {
      view.pagination = { page: Math.max(0, Math.floor(page)), pageSize: Math.floor(pageSize) };
    }
  }
  const treeIds: string[] = [];
  const groupIds: string[] = [];
  let sawExpandedRows = false;
  let sawExpandedGroups = false;
  if (Array.isArray(raw.expandedRowIds) && raw.expandedRowIds.every((c) => typeof c === 'string')) {
    sawExpandedRows = true;
    for (const id of raw.expandedRowIds) {
      if (id.startsWith('__group__:')) {
        groupIds.push(id);
        sawExpandedGroups = true;
      } else {
        treeIds.push(id);
      }
    }
  }
  if (
    Array.isArray(raw.expandedGroupIds) &&
    raw.expandedGroupIds.every((c) => typeof c === 'string')
  ) {
    sawExpandedGroups = true;
    for (const id of raw.expandedGroupIds) {
      if (typeof id === 'string' && id.startsWith('__group__:') && !groupIds.includes(id)) {
        groupIds.push(id);
      }
    }
  }
  // Empty arrays are intentional: collapse-all (≠ omitted = expand-all).
  if (sawExpandedRows) {
    view.expandedRowIds = treeIds;
  }
  if (sawExpandedGroups) {
    view.expandedGroupIds = groupIds;
  }
  if (Array.isArray(raw.groupBy) && raw.groupBy.every((c) => typeof c === 'string')) {
    view.groupBy = raw.groupBy;
  }
  return Object.keys(view).length > 0 ? view : undefined;
}

export function emptyTableGrid(): TableGridDoc {
  const a = nextId('col');
  const b = nextId('col');
  return {
    version: 2,
    columns: [
      { id: a, title: 'A', type: 'text' },
      { id: b, title: 'B', type: 'text' },
    ],
    rows: [
      { id: nextId('row'), cells: { [a]: '', [b]: '' } },
      { id: nextId('row'), cells: { [a]: '', [b]: '' } },
    ],
  };
}

export function normalizeTableGrid(raw: unknown): TableGridDoc {
  if (!isPlainObject(raw) || !Array.isArray(raw.columns) || !Array.isArray(raw.rows)) {
    return emptyTableGrid();
  }
  const columns =
    raw.columns.length > 0 && raw.columns.every(isColumn)
      ? raw.columns.map((c) => normalizeColumn(c))
      : emptyTableGrid().columns;
  const rows = normalizeRows(columns, raw.rows);
  const doc: TableGridDoc = { version: 2, columns, rows };
  const view = normalizeView(raw.view);
  if (view) {
    doc.view = view;
  }
  return doc;
}

/** Accepts v2 row objects or legacy v1 string[][] rows. */
export function isTableGridDoc(value: unknown): value is TableGridDoc {
  if (!isPlainObject(value)) {
    return false;
  }
  if (!Array.isArray(value.columns) || !Array.isArray(value.rows)) {
    return false;
  }
  if (!value.columns.every(isColumn)) {
    return false;
  }
  if (value.rows.length === 0) {
    return true;
  }
  return value.rows.every((row) => Array.isArray(row) || isV2Row(row));
}

export function gridFromMatrix(matrix: string[][], hasHeader: boolean): TableGridDoc {
  if (matrix.length === 0) {
    return emptyTableGrid();
  }
  const width = Math.max(1, ...matrix.map((r) => r.length));
  const pad = (r: string[]) => Array.from({ length: width }, (_, i) => stringifyCell(r[i]));
  if (hasHeader) {
    const header = pad(matrix[0] ?? []);
    const columns = header.map((title, i) => ({
      id: nextId('col'),
      title: title || `Col ${i + 1}`,
      type: 'text' as const,
    }));
    const body = matrix.slice(1);
    const rows =
      body.length > 0
        ? body.map((r) => {
            const cells: Record<string, CellValue> = {};
            const padded = pad(r);
            for (const [i, col] of columns.entries()) {
              cells[col.id] = padded[i] ?? '';
            }
            return { id: nextId('row'), cells };
          })
        : [
            {
              id: nextId('row'),
              cells: Object.fromEntries(columns.map((c) => [c.id, ''])) as Record<
                string,
                CellValue
              >,
            },
          ];
    return { version: 2, columns, rows };
  }
  const columns = Array.from({ length: width }, (_, i) => ({
    id: nextId('col'),
    title: `Col ${i + 1}`,
    type: 'text' as const,
  }));
  const rows = matrix.map((r) => {
    const cells: Record<string, CellValue> = {};
    const padded = pad(r);
    for (const [i, col] of columns.entries()) {
      cells[col.id] = padded[i] ?? '';
    }
    return { id: nextId('row'), cells };
  });
  return { version: 2, columns, rows };
}

export function toEditorDoc(node: DocNode): DocNode {
  if (node.type !== 'tableGrid') {
    throw new TypeError('toEditorDoc expects type "tableGrid"');
  }
  return {
    type: 'doc',
    id: nextId('doc'),
    content: [node],
  };
}

export function isTableEditorDoc(doc: DocNode): boolean {
  return (
    doc.type === 'doc' && (doc.content?.length ?? 0) === 1 && doc.content![0]?.type === 'tableGrid'
  );
}

export function resolveGridNode(doc: DocNode): DocNode {
  if (doc.type === 'tableGrid') {
    return doc;
  }
  if (doc.type === 'doc') {
    const child = doc.content?.[0];
    if (child?.type === 'tableGrid') {
      return child;
    }
  }
  throw new TypeError('Expected doc→tableGrid SoT');
}

export function attrsFromGrid(grid: TableGridDoc): Record<string, unknown> {
  const attrs: Record<string, unknown> = {
    version: 2,
    columns: grid.columns,
    rows: grid.rows,
  };
  if (grid.view) {
    attrs.view = grid.view;
  }
  return attrs;
}

export function gridFromDoc(doc: DocNode): TableGridDoc {
  const node = resolveGridNode(doc);
  return normalizeTableGrid({
    version: node.attrs?.version,
    columns: node.attrs?.columns,
    rows: node.attrs?.rows,
    view: node.attrs?.view,
  });
}

export function emptyEditorDoc(grid?: TableGridDoc): DocNode {
  const payload = normalizeTableGrid(grid ?? emptyTableGrid());
  return toEditorDoc({
    type: 'tableGrid',
    id: nextId('tableGrid'),
    attrs: attrsFromGrid(payload),
  });
}

export function docFromGrid(grid: TableGridDoc): DocNode {
  return emptyEditorDoc(grid);
}

/** Flatten grid to string matrix (header + body) for CSV export. */
export function gridToMatrix(grid: TableGridDoc): string[][] {
  const columnOrder = grid.view?.columnOrder;
  const ordered: TableColumn[] =
    columnOrder !== undefined && columnOrder.length > 0
      ? columnOrder
          .map((id) => grid.columns.find((c) => c.id === id))
          .filter((c): c is TableColumn => c !== undefined)
      : [...grid.columns];
  if (columnOrder !== undefined && columnOrder.length > 0) {
    for (const c of grid.columns) {
      if (!ordered.some((x) => x.id === c.id)) {
        ordered.push(c);
      }
    }
  }
  const cols = ordered.length > 0 ? ordered : grid.columns;
  const header = cols.map((c) => c.title);
  const body = grid.rows.map((row) => cols.map((c) => stringifyCell(row.cells[c.id])));
  return [header, ...body];
}
