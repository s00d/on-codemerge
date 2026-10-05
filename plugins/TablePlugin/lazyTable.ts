/**
 * Lazy table (atom/WYSIWYG): fetch remote JSON/CSV and materialize into prose table.
 * Shared fetch/parse lives in io/fetchMatrix + io/matrix.
 */
import type { Command, DocNode } from '@codemerge/kernel';
import { core } from '@codemerge/sdk';
import { findTablePath } from './tableOps';
import { stringifyCell } from './io/matrix';
import type { LazyTableConfig } from './io/fetchMatrix';

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

export function matrixToTableRows(matrix: string[][], hasHeader: boolean): DocNode[] {
  if (matrix.length === 0) {
    return [rowFromCells([''], false)];
  }
  const cols = Math.max(1, ...matrix.map((r) => r.length));
  const pad = (r: string[]) => Array.from({ length: cols }, (_, i) => r[i] ?? '');
  return matrix.map((r, i) => rowFromCells(pad(r), hasHeader && i === 0));
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
