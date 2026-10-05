import type { DocNode } from '@codemerge/kernel';
import { nextId } from '@codemerge/kernel';
import { isPlainObject, matrixToCsv, stringifyCell } from './matrix';
import { normalizeSpans } from '../grid/spans';

export type CellValue = string | number | boolean | null;

export type TableColumn = {
  id: string;
  title: string;
  width?: number;
  pinned?: 'left' | 'right' | null;
  type?: 'text' | 'number' | 'boolean';
  editable?: boolean;
  sortable?: boolean;
};

export type CellAlign = 'left' | 'center' | 'right';
export type CellBorder = 'none' | 'thin' | 'medium' | 'thick';
export type CellStyle = {
  align?: CellAlign;
  background?: string;
  color?: string;
  border?: CellBorder;
};
export type TableTheme = 'default' | 'modern' | 'bordered' | 'striped';

export type TableRow = {
  id: string;
  cells: Record<string, CellValue>;
  parentId?: string | null;
  /** Origin cell → extra col/row coverage (1 = no span). */
  spans?: Record<string, { cols?: number; rows?: number }>;
  styles?: Record<string, CellStyle>;
};

export type TableViewState = {
  sort?: { colId: string; dir: 'asc' | 'desc' }[];
  filters?: Record<string, { op: string; value: unknown }>;
  quickFilter?: string;
  columnOrder?: string[];
  /** Tree parent row ids that are expanded. */
  expandedRowIds?: string[];
  /** Group header ids (`__group__:…`) that are expanded. */
  expandedGroupIds?: string[];
  groupBy?: string[];
  /** Fill remaining editor width (default) or keep stored pixel widths. */
  fit?: 'fill' | 'content';
  rowHeight?: number;
};

export type TableGridSource = {
  url: string;
  format: 'json' | 'csv';
  headers?: boolean;
  delimiter?: string;
};

export type TableGridDoc = {
  version: 2;
  columns: TableColumn[];
  rows: TableRow[];
  view?: TableViewState;
  theme?: TableTheme;
  source?: TableGridSource;
};

const PINNED = new Set(['left', 'right']);
const COL_TYPES = new Set(['text', 'number', 'boolean']);

function normalizeCellStyle(raw: unknown): CellStyle | undefined {
  if (!isPlainObject(raw)) {
    return undefined;
  }
  const next: CellStyle = {};
  if (raw.align === 'left' || raw.align === 'center' || raw.align === 'right') {
    next.align = raw.align;
  }
  if (typeof raw.background === 'string' && raw.background.trim() !== '') {
    next.background = raw.background.trim();
  }
  if (typeof raw.color === 'string' && raw.color.trim() !== '') {
    next.color = raw.color.trim();
  }
  if (
    raw.border === 'none' ||
    raw.border === 'thin' ||
    raw.border === 'medium' ||
    raw.border === 'thick'
  ) {
    next.border = raw.border;
  }
  return Object.keys(next).length > 0 ? next : undefined;
}

function normalizeRowStyles(
  styles: unknown,
  colIds: Set<string>
): Record<string, CellStyle> | undefined {
  if (!isPlainObject(styles)) {
    return undefined;
  }
  const out: Record<string, CellStyle> = {};
  for (const [id, raw] of Object.entries(styles)) {
    if (!colIds.has(id)) {
      continue;
    }
    const style = normalizeCellStyle(raw);
    if (style) {
      out[id] = style;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

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
    const spans = normalizeSpans(row.spans, new Set(columns.map((c) => c.id)));
    if (spans) {
      out.spans = spans;
    }
    const styles = normalizeRowStyles(row.styles, new Set(columns.map((c) => c.id)));
    if (styles) {
      out.styles = styles;
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
  if (raw.fit === 'fill' || raw.fit === 'content') {
    view.fit = raw.fit;
  }
  if (typeof raw.rowHeight === 'number' && Number.isFinite(raw.rowHeight)) {
    view.rowHeight = Math.min(96, Math.max(20, Math.round(raw.rowHeight)));
  }
  return Object.keys(view).length > 0 ? view : undefined;
}

function normalizeSource(raw: unknown): TableGridSource | undefined {
  if (!isPlainObject(raw) || typeof raw.url !== 'string' || raw.url.trim() === '') {
    return undefined;
  }
  const source: TableGridSource = {
    url: raw.url.trim(),
    format: raw.format === 'csv' ? 'csv' : 'json',
  };
  if (typeof raw.headers === 'boolean') {
    source.headers = raw.headers;
  }
  if (typeof raw.delimiter === 'string' && raw.delimiter !== '') {
    source.delimiter = raw.delimiter;
  }
  return source;
}

export function emptyTableGrid(): TableGridDoc {
  return sizedEmptyGrid(2, 2, false);
}

/** Empty sheet for WYSIWYG insert (column titles A, B… unless `hasHeader`). */
export function sizedEmptyGrid(rows: number, cols: number, hasHeader: boolean): TableGridDoc {
  const nCols = Math.max(1, Math.min(64, Math.floor(cols)));
  const nRows = Math.max(1, Math.min(200, Math.floor(rows)));
  const columns = Array.from({ length: nCols }, (_, i) => ({
    id: nextId('col'),
    title: hasHeader ? `Col ${i + 1}` : colLetterTitle(i),
    type: 'text' as const,
  }));
  const rowList = Array.from({ length: nRows }, () => {
    const cells: Record<string, CellValue> = {};
    for (const c of columns) {
      cells[c.id] = '';
    }
    return { id: nextId('row'), cells };
  });
  return { version: 2, columns, rows: rowList };
}

function colLetterTitle(index: number): string {
  let n = index;
  let out = '';
  do {
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return out;
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
  if (
    raw.theme === 'default' ||
    raw.theme === 'modern' ||
    raw.theme === 'bordered' ||
    raw.theme === 'striped'
  ) {
    doc.theme = raw.theme;
  }
  const source = normalizeSource(raw.source);
  if (source) {
    doc.source = source;
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
  if (grid.theme && grid.theme !== 'default') {
    attrs.theme = grid.theme;
  }
  if (grid.source) {
    attrs.source = grid.source;
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
    theme: node.attrs?.theme,
    source: node.attrs?.source,
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

function orderedColumns(grid: TableGridDoc): TableColumn[] {
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
  return ordered.length > 0 ? ordered : grid.columns;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cellStyleAttr(style: CellStyle | undefined): string {
  if (style === undefined) {
    return '';
  }
  const parts: string[] = [];
  if (style.background !== undefined && style.background !== '') {
    parts.push(`background:${escapeHtml(style.background)}`);
  }
  if (style.color !== undefined && style.color !== '') {
    parts.push(`color:${escapeHtml(style.color)}`);
  }
  if (style.align !== undefined) {
    parts.push(`text-align:${style.align}`);
  }
  if (style.border !== undefined && style.border !== 'none') {
    const width = style.border === 'thick' ? 3 : style.border === 'medium' ? 2 : 1;
    parts.push(`border-width:${String(width)}px`);
  }
  return parts.length > 0 ? ` style="${parts.join(';')}"` : '';
}

/** Flatten grid to string matrix (header + body) for CSV export. */
export function gridToMatrix(grid: TableGridDoc): string[][] {
  const cols = orderedColumns(grid);
  const header = cols.map((c) => c.title);
  const body = grid.rows.map((row) => cols.map((c) => stringifyCell(row.cells[c.id])));
  return [header, ...body];
}

const HTML_COL_WIDTH = 128;

function columnHtmlWidth(col: TableColumn): number {
  const w = col.width;
  return typeof w === 'number' && Number.isFinite(w) && w > 0 ? Math.round(w) : HTML_COL_WIDTH;
}

/** Used SoT as published `<table>`. `view.fit: fill` (default) → 100% host; `content` → stored px. */
export function gridToHtml(grid: TableGridDoc): string {
  const cols = orderedColumns(grid);
  const theme =
    grid.theme !== undefined && grid.theme !== 'default' ? ` ocm-table-grid--${grid.theme}` : '';
  const fill = grid.view?.fit !== 'content';
  const widths = cols.map(columnHtmlWidth);
  const tableW = widths.reduce((a, b) => a + b, 0);
  const tableStyle = fill ? 'width:100%' : `width:${String(tableW)}px`;
  const fitClass = fill ? ' html-editor-table--fill' : ' html-editor-table--content';
  const colgroup = widths.map((w) => `<col style="width:${String(w)}px">`).join('');
  const th = cols.map((c) => `<th>${escapeHtml(c.title)}</th>`).join('');
  const tr = grid.rows
    .map((row) => {
      const tds = cols
        .map((c) => {
          const text = escapeHtml(stringifyCell(row.cells[c.id]));
          return `<td${cellStyleAttr(row.styles?.[c.id])}>${text}</td>`;
        })
        .join('');
      return `<tr>${tds}</tr>`;
    })
    .join('');
  return `<table class="html-editor-table html-editor-table--sheet${fitClass} not-prose${theme}" style="${tableStyle}"><colgroup>${colgroup}</colgroup><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>`;
}

export function exportCsv(grid: TableGridDoc, delimiter = ','): string {
  return matrixToCsv(gridToMatrix(grid), delimiter);
}
