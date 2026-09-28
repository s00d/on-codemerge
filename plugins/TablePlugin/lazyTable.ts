/**
 * Lazy table: fetch remote JSON/CSV and materialize into the selected/current table.
 */
import type { Command, DocNode } from '@on-codemerge/kernel';
import { core } from '@on-codemerge/sdk';
import { findTablePath } from './tableOps';

export type LazyFormat = 'json' | 'csv';

export type LazyTableConfig = {
  url: string;
  format?: LazyFormat;
  /** Treat first row as header (also used when JSON is array-of-objects). */
  headers?: boolean;
  delimiter?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function stringifyCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  if (typeof value === 'symbol') {
    return value.toString();
  }
  return '';
}

function emptyCell(text = ''): DocNode {
  return { content: [core.createParagraph([core.createText(text)])], type: 'tableCell' };
}

function rowFromCells(cells: string[], header = false): DocNode {
  return {
    attrs: header ? { header: true } : undefined,
    content: cells.map((c) => emptyCell(c)),
    type: 'tableRow',
  };
}

/** Parse CSV into a string matrix (minimal RFC4180-ish). */
export function parseCsv(text: string, delimiter = ','): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  const d = delimiter || ',';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === undefined) {
      break;
    }
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === d) {
      row.push(cell);
      cell = '';
      continue;
    }
    if (ch === '\n' || (ch === '\r' && next === '\n')) {
      row.push(cell);
      cell = '';
      if (row.some((c) => c.length > 0) || row.length > 1) {
        rows.push(row);
      }
      row = [];
      if (ch === '\r') {
        i += 1;
      }
      continue;
    }
    if (ch === '\r') {
      row.push(cell);
      cell = '';
      if (row.some((c) => c.length > 0) || row.length > 1) {
        rows.push(row);
      }
      row = [];
      continue;
    }
    cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.length > 0) || row.length > 1) {
    rows.push(row);
  }
  return rows;
}

/** Normalize JSON payloads into a rectangular string matrix. */
export function parseJsonToMatrix(
  data: unknown,
  preferHeaders = true
): {
  matrix: string[][];
  hasHeader: boolean;
} {
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return { matrix: [['']], hasHeader: false };
    }
    if (Array.isArray(data[0])) {
      const matrix = data.map((row) =>
        (Array.isArray(row) ? row : [row]).map((c) => stringifyCell(c))
      );
      return { matrix, hasHeader: preferHeaders };
    }
    if (data.every((row) => isRecord(row))) {
      const keys = [...new Set(data.flatMap((row) => (isRecord(row) ? Object.keys(row) : [])))];
      const matrix = [
        keys,
        ...data.map((row) => keys.map((k) => (isRecord(row) ? stringifyCell(row[k]) : ''))),
      ];
      return { matrix, hasHeader: true };
    }
    return {
      matrix: data.map((v) => [stringifyCell(v)]),
      hasHeader: false,
    };
  }
  if (isRecord(data) && Array.isArray(data.rows)) {
    const headers = Array.isArray(data.headers) ? data.headers.map((h) => stringifyCell(h)) : null;
    const body = data.rows.map((row) =>
      (Array.isArray(row) ? row : [row]).map((c) => stringifyCell(c))
    );
    if (headers !== null) {
      return { matrix: [headers, ...body], hasHeader: true };
    }
    return { matrix: body.length > 0 ? body : [['']], hasHeader: preferHeaders };
  }
  return { matrix: [[stringifyCell(data)]], hasHeader: false };
}

export function matrixToTableRows(matrix: string[][], hasHeader: boolean): DocNode[] {
  if (matrix.length === 0) {
    return [rowFromCells([''], false)];
  }
  const cols = Math.max(1, ...matrix.map((r) => r.length));
  const pad = (r: string[]) => Array.from({ length: cols }, (_, i) => r[i] ?? '');
  return matrix.map((r, i) => rowFromCells(pad(r), hasHeader && i === 0));
}

/** Reject non-http(s) and obvious private/loopback hosts (SSRF guard). */
export function assertSafeLazyUrl(url: string): URL {
  const u = new URL(url);
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error('Lazy table URL must be http(s)');
  }
  const host = u.hostname.toLowerCase().replaceAll(/^\[|\]$/g, '');
  if (/^::ffff:/i.test(host)) {
    throw new Error('Lazy table URL must not target a private host');
  }
  if (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host === '::' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host === 'localtest.me' ||
    host.endsWith('.localtest.me') ||
    host === 'lvh.me' ||
    host.endsWith('.lvh.me') ||
    host === '127.0.0.1.nip.io' ||
    (host.endsWith('.nip.io') && host.includes('127.0.0.1'))
  ) {
    throw new Error('Lazy table URL must not target a private host');
  }
  if (/^(127\.|10\.|192\.168\.|169\.254\.)/.test(host)) {
    throw new Error('Lazy table URL must not target a private host');
  }
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) {
    throw new Error('Lazy table URL must not target a private host');
  }
  if (/^(fc|fd)[0-9a-f]{0,2}:/i.test(host) || host.startsWith('fe80:')) {
    throw new Error('Lazy table URL must not target a private host');
  }
  return u;
}

export async function fetchLazyMatrix(
  config: LazyTableConfig
): Promise<{ matrix: string[][]; hasHeader: boolean }> {
  const url = config.url.trim();
  if (!url) {
    throw new Error('Lazy table URL is required');
  }
  assertSafeLazyUrl(url);
  const format: LazyFormat = config.format === 'csv' ? 'csv' : 'json';
  const res = await fetch(url, { credentials: 'omit', redirect: 'error' });
  if (!res.ok) {
    throw new Error(`Lazy table fetch failed (${res.status})`);
  }
  const text = await res.text();
  if (format === 'csv') {
    const matrix = parseCsv(text, config.delimiter ?? ',');
    return { matrix, hasHeader: config.headers !== false };
  }
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Lazy table JSON parse failed');
  }
  return parseJsonToMatrix(data, config.headers !== false);
}

/** Replace a table body with a matrix; keeps lazy* attrs.
 * Prefer `tableId` (stable across async); falls back to selection. */
export function fillTableFromMatrix(
  matrix: string[][],
  hasHeader: boolean,
  tableId?: string
): Command {
  return (state) => {
    let tp: number[] | null = null;
    if (tableId) {
      const idx = (state.doc.content ?? []).findIndex(
        (n) => n.type === 'table' && n.id === tableId
      );
      if (idx === -1) {
        return null;
      }
      tp = [idx];
    } else {
      tp = findTablePath(state.doc, state.selection.anchor.path);
    }
    if (!tp) {
      return null;
    }
    const prev = core.getNodeAt(state.doc, tp);
    if (prev?.type !== 'table') {
      return null;
    }
    const rows = matrixToTableRows(matrix, hasHeader);
    const cols = Math.max(1, ...rows.map((r) => r.content?.length ?? 0));
    const table: DocNode = {
      ...core.cloneNode(prev),
      attrs: {
        ...prev.attrs,
        cols,
        hasHeader,
      },
      content: rows,
    };
    const tableIndex = tp[0];
    if (tableIndex === undefined) {
      return null;
    }
    const bodyRow = Math.min(hasHeader && rows.length > 1 ? 1 : 0, Math.max(0, rows.length - 1));
    return [
      { type: 'remove_node', path: [], index: tableIndex },
      { type: 'insert_node', path: [], index: tableIndex, node: table },
      {
        type: 'set_selection',
        selection: core.collapsedAt([...tp, bodyRow, 0, 0], 0),
      },
    ];
  };
}

/** Insert a new table shell with lazy attrs (data filled separately after fetch). */
export function insertLazyTableShell(config: LazyTableConfig, placeholderRows = 2): Command {
  return (state) => {
    const cols = 2;
    const hasHeader = config.headers !== false;
    const content: DocNode[] = [];
    if (hasHeader) {
      content.push(rowFromCells(['Column 1', 'Column 2'], true));
    }
    for (let r = 0; r < Math.max(1, placeholderRows); r++) {
      content.push(
        rowFromCells(
          Array.from({ length: cols }, () => ''),
          false
        )
      );
    }
    const table: DocNode = {
      type: 'table',
      id: `table_${Date.now()}`,
      attrs: {
        cols,
        hasHeader,
        lazyUrl: config.url,
        lazyFormat: config.format === 'csv' ? 'csv' : 'json',
        lazyHeaders: hasHeader,
        lazyDelimiter: config.delimiter ?? ',',
      },
      content,
    };
    const index = (state.selection.anchor.path[0] ?? 0) + 1;
    return [
      { type: 'insert_node', path: [], index, node: table },
      {
        type: 'insert_node',
        path: [],
        index: index + 1,
        node: core.createParagraph([core.createText('')]),
      },
      {
        type: 'set_selection',
        selection: core.collapsedAt([index, hasHeader ? 1 : 0, 0, 0], 0),
      },
    ];
  };
}

export function readLazyConfigFromTable(table: DocNode): LazyTableConfig | null {
  const url = stringifyCell(table.attrs?.lazyUrl).trim();
  if (url.length === 0) {
    return null;
  }
  return {
    url,
    format: table.attrs?.lazyFormat === 'csv' ? 'csv' : 'json',
    headers: table.attrs?.lazyHeaders !== false,
    delimiter: stringifyCell(table.attrs?.lazyDelimiter) || ',',
  };
}
