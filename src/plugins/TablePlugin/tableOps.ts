/**
 * Table structural operations on JSON doc (legacy UX parity, kernel SoT).
 */
import type { Command, DocNode, Operation } from '@on-codemerge/kernel';
import { core, insertBlockNearSelection } from '@on-codemerge/sdk';

function emptyCell(): DocNode {
  return { content: [core.createParagraph([core.createText('')])], type: 'tableCell' };
}

function emptyRow(cols: number): DocNode {
  return { content: Array.from({ length: cols }, () => emptyCell()), type: 'tableRow' };
}

export function findTablePath(doc: DocNode, selPath: number[]): number[] | null {
  if (selPath.length === 0) {
    return null;
  }
  const top = doc.content?.[selPath[0]];
  if (top?.type === 'table') {
    return [selPath[0]];
  }
  // Walk up from nested path
  for (let len = selPath.length; len >= 1; len--) {
    try {
      const n = core.getNodeAt(doc, selPath.slice(0, len));
      if (n.type === 'table') {
        return selPath.slice(0, len);
      }
    } catch {
      /* continue */
    }
  }
  return null;
}

function tableAt(doc: DocNode, tablePath: number[]): DocNode {
  return core.getNodeAt(doc, tablePath);
}

function colCount(table: DocNode): number {
  const cells = table.content?.[0]?.content;
  if (cells === undefined || cells.length === 0) {
    return Number(table.attrs?.cols ?? 2);
  }
  return cells.reduce((n, cell) => n + Math.max(1, Number(cell.attrs?.colspan ?? 1)), 0);
}

export function insertTableCommand(rows: number, cols: number, hasHeader = false): Command {
  return (state) => {
    const content: DocNode[] = [];
    if (hasHeader) {
      const header = emptyRow(cols);
      header.attrs = { ...header.attrs, header: true };
      for (let c = 0; c < cols; c++) {
        header.content![c].content = [core.createParagraph([core.createText(`Column ${c + 1}`)])];
      }
      content.push(header);
    }
    for (let r = 0; r < Math.max(1, rows); r++) {
      content.push(emptyRow(cols));
    }
    const table: DocNode = {
      type: 'table',
      id: `table_${Date.now()}`,
      attrs: { cols, hasHeader },
      content,
    };
    const cmd = insertBlockNearSelection(table, {
      trailingParagraph: true,
      select: (insertedPath) => core.collapsedAt([...insertedPath, hasHeader ? 1 : 0, 0, 0], 0),
    });
    return cmd(state);
  };
}

export const deleteTable: Command = (state) => {
  const tp = findTablePath(state.doc, state.selection.anchor.path);
  if (!tp) {
    return null;
  }
  const index = tp[0];
  return [
    { type: 'remove_node', path: [], index },
    {
      type: 'set_selection',
      selection: core.collapsedAt([Math.max(0, index - 1)], 0),
    },
  ];
};

export function addRow(where: 'above' | 'below'): Command {
  return (state) => {
    const path = state.selection.anchor.path;
    const tp = findTablePath(state.doc, path);
    if (!tp || path.length < 2) {
      return null;
    }
    const rowIdx = path[1];
    const table = tableAt(state.doc, tp);
    const cols = colCount(table);
    const insertAt = where === 'above' ? rowIdx : rowIdx + 1;
    return [
      { type: 'insert_node', path: tp, index: insertAt, node: emptyRow(cols) },
      {
        type: 'set_selection',
        selection: core.collapsedAt([...tp, insertAt, 0, 0], 0),
      },
    ];
  };
}

export function addColumn(where: 'left' | 'right'): Command {
  return (state) => {
    const path = state.selection.anchor.path;
    const tp = findTablePath(state.doc, path);
    if (!tp || path.length < 3) {
      return null;
    }
    const colIdx = path[2];
    const table = core.cloneNode(tableAt(state.doc, tp));
    const insertAt = where === 'left' ? colIdx : colIdx + 1;
    for (const row of table.content ?? []) {
      row.content ??= [];
      row.content.splice(insertAt, 0, emptyCell());
    }
    table.attrs = { ...table.attrs, cols: colCount(table) };
    return [
      { type: 'remove_node', path: [], index: tp[0] },
      { type: 'insert_node', path: [], index: tp[0], node: table },
      {
        type: 'set_selection',
        selection: core.collapsedAt([...tp, path[1], insertAt, 0], 0),
      },
    ];
  };
}

export const deleteRow: Command = (state) => {
  const path = state.selection.anchor.path;
  const tp = findTablePath(state.doc, path);
  if (!tp || path.length < 2) {
    return null;
  }
  const table = tableAt(state.doc, tp);
  if ((table.content?.length ?? 0) <= 1) {
    return deleteTable(state);
  }
  return [
    { type: 'remove_node', path: tp, index: path[1] },
    {
      type: 'set_selection',
      selection: core.collapsedAt([...tp, Math.max(0, path[1] - 1), 0, 0], 0),
    },
  ];
};

export const deleteColumn: Command = (state) => {
  const path = state.selection.anchor.path;
  const tp = findTablePath(state.doc, path);
  if (!tp || path.length < 3) {
    return null;
  }
  const table = core.cloneNode(tableAt(state.doc, tp));
  const colIdx = path[2];
  if (colCount(table) <= 1) {
    return deleteTable(state);
  }
  for (const row of table.content ?? []) {
    row.content?.splice(colIdx, 1);
  }
  table.attrs = { ...table.attrs, cols: colCount(table) };
  return [
    { type: 'remove_node', path: [], index: tp[0] },
    { type: 'insert_node', path: [], index: tp[0], node: table },
    {
      type: 'set_selection',
      selection: core.collapsedAt([...tp, path[1], Math.max(0, colIdx - 1), 0], 0),
    },
  ];
};

export const clearCell: Command = (state) => {
  const path = state.selection.anchor.path;
  const tp = findTablePath(state.doc, path);
  if (!tp || path.length < 3) {
    return null;
  }
  const cellPath = path.slice(0, 3);
  return [
    {
      type: 'remove_node',
      path: cellPath.slice(0, -1),
      index: cellPath[2],
    },
    {
      type: 'insert_node',
      path: cellPath.slice(0, -1),
      index: cellPath[2],
      node: emptyCell(),
    },
    { type: 'set_selection', selection: core.collapsedAt([...cellPath, 0], 0) },
  ];
};

export const clearTable: Command = (state) => {
  const tp = findTablePath(state.doc, state.selection.anchor.path);
  if (!tp) {
    return null;
  }
  const table = core.cloneNode(tableAt(state.doc, tp));
  const cols = colCount(table);
  const rows = table.content?.length ?? 1;
  table.content = Array.from({ length: rows }, () => emptyRow(cols));
  return [
    { type: 'remove_node', path: [], index: tp[0] },
    { type: 'insert_node', path: [], index: tp[0], node: table },
    { type: 'set_selection', selection: core.collapsedAt([...tp, 0, 0, 0], 0) },
  ];
};

export function setCellAttr(key: string, value: unknown): Command {
  return (state) => {
    const path = state.selection.anchor.path;
    if (path.length < 3) {
      return null;
    }
    const cellPath = path.slice(0, 3);
    return [{ type: 'set_attrs', path: cellPath, attrs: { [key]: value } }];
  };
}

export function setTableAttr(key: string, value: unknown): Command {
  return (state) => {
    const tp = findTablePath(state.doc, state.selection.anchor.path);
    if (!tp) {
      return null;
    }
    return [{ type: 'set_attrs', path: tp, attrs: { [key]: value } }];
  };
}

export const addHeaderRow: Command = (state) => {
  const tp = findTablePath(state.doc, state.selection.anchor.path);
  if (!tp) {
    return null;
  }
  const table = tableAt(state.doc, tp);
  const cols = colCount(table);
  const header = emptyRow(cols);
  header.attrs = { ...header.attrs, header: true };
  return [
    { type: 'insert_node', path: tp, index: 0, node: header },
    { type: 'set_attrs', path: tp, attrs: { hasHeader: true } },
  ];
};

export const removeHeaderRow: Command = (state) => {
  const tp = findTablePath(state.doc, state.selection.anchor.path);
  if (!tp) {
    return null;
  }
  const table = tableAt(state.doc, tp);
  const first = table.content?.[0];
  if (first?.attrs?.header !== true && table.attrs?.hasHeader !== true) {
    return null;
  }
  return [
    { type: 'remove_node', path: tp, index: 0 },
    { type: 'set_attrs', path: tp, attrs: { hasHeader: false } },
  ];
};

export function mergeCellsHorizontal(): Command {
  return (state) => {
    const path = state.selection.anchor.path;
    const tp = findTablePath(state.doc, path);
    if (!tp || path.length < 3) {
      return null;
    }
    const table = core.cloneNode(tableAt(state.doc, tp));
    const row = table.content?.[path[1]];
    const col = path[2];
    if (!row?.content || col >= row.content.length - 1) {
      return null;
    }
    const left = row.content[col];
    const right = row.content[col + 1];
    const mergedContent = [...(left.content ?? []), ...(right.content ?? [])];
    const colspan = Number(left.attrs?.colspan ?? 1) + Number(right.attrs?.colspan ?? 1);
    row.content.splice(col, 2, {
      ...left,
      attrs: { ...left.attrs, colspan },
      content: mergedContent,
    });
    return [
      { type: 'remove_node', path: [], index: tp[0] },
      { type: 'insert_node', path: [], index: tp[0], node: table },
      { type: 'set_selection', selection: core.collapsedAt([...tp, path[1], col, 0], 0) },
    ];
  };
}

export function copyCellText(editor: {
  getJSON: () => { doc: DocNode };
  getSelection: () => { anchor: { path: number[] } };
  notify: (m: string) => void;
}): void {
  const path = editor.getSelection().anchor.path;
  if (path.length < 3) {
    return;
  }
  try {
    const cell = core.getNodeAt(editor.getJSON().doc, path.slice(0, 3));
    const text = (cell.content ?? [])
      .map((p) => (p.content ?? []).map((c) => c.text ?? '').join(''))
      .join('\n');
    void navigator.clipboard?.writeText(text);
    editor.notify('Cell copied');
  } catch {
    editor.notify('Copy failed');
  }
}

export function sortTableByColumn(col: number, dir: 'asc' | 'desc'): Command {
  return (state) => {
    const tp = findTablePath(state.doc, state.selection.anchor.path);
    if (!tp) {
      return null;
    }
    const table = core.cloneNode(tableAt(state.doc, tp));
    const rows = [...(table.content ?? [])];
    const header = table.attrs?.hasHeader === true ? rows.shift() : undefined;
    const cellText = (row: DocNode) =>
      (row.content?.[col]?.content ?? [])
        .map((p) => (p.content ?? []).map((c) => c.text ?? '').join(''))
        .join('')
        .toLowerCase();
    rows.sort((a, b) => {
      const cmp = cellText(a).localeCompare(cellText(b));
      return dir === 'asc' ? cmp : -cmp;
    });
    table.content = header ? [header, ...rows] : rows;
    const sel = state.selection.anchor.path;
    const row = sel.length >= 2 ? sel[1] : 0;
    const cell = sel.length >= 3 ? sel[2] : col;
    return [
      { type: 'remove_node', path: [], index: tp[0] },
      { type: 'insert_node', path: [], index: tp[0], node: table },
      { type: 'set_selection', selection: core.collapsedAt([...tp, row, cell, 0], 0) },
    ];
  };
}

export function mergeCellsVertical(): Command {
  return (state) => {
    const path = state.selection.anchor.path;
    const tp = findTablePath(state.doc, path);
    if (!tp || path.length < 3) {
      return null;
    }
    const table = core.cloneNode(tableAt(state.doc, tp));
    const rowIdx = path[1];
    const col = path[2];
    const top = table.content?.[rowIdx];
    const bottom = table.content?.[rowIdx + 1];
    if (!top?.content?.[col] || !bottom?.content?.[col]) {
      return null;
    }
    const a = top.content[col];
    const b = bottom.content[col];
    const rowspan = Number(a.attrs?.rowspan ?? 1) + Number(b.attrs?.rowspan ?? 1);
    top.content[col] = {
      ...a,
      attrs: { ...a.attrs, rowspan },
      content: [...(a.content ?? []), ...(b.content ?? [])],
    };
    bottom.content.splice(col, 1, {
      type: 'tableCell',
      attrs: { merged: true },
      content: [core.createParagraph([core.createText('')])],
    });
    return [
      { type: 'remove_node', path: [], index: tp[0] },
      { type: 'insert_node', path: [], index: tp[0], node: table },
      { type: 'set_selection', selection: core.collapsedAt([...tp, rowIdx, col, 0], 0) },
    ];
  };
}

export function splitCellHorizontal(): Command {
  return (state) => {
    const path = state.selection.anchor.path;
    const tp = findTablePath(state.doc, path);
    if (!tp || path.length < 3) {
      return null;
    }
    const table = core.cloneNode(tableAt(state.doc, tp));
    const row = table.content?.[path[1]];
    const col = path[2];
    const cell = row?.content?.[col];
    if (!row?.content || !cell) {
      return null;
    }
    const span = Math.max(1, Number(cell.attrs?.colspan ?? 1));
    if (span <= 1) {
      row.content.splice(col + 1, 0, emptyCell());
      table.attrs = { ...table.attrs, cols: colCount(table) };
    } else {
      cell.attrs = { ...cell.attrs, colspan: span - 1 };
      row.content.splice(col + 1, 0, emptyCell());
    }
    return [
      { type: 'remove_node', path: [], index: tp[0] },
      { type: 'insert_node', path: [], index: tp[0], node: table },
      { type: 'set_selection', selection: core.collapsedAt([...tp, path[1], col, 0], 0) },
    ];
  };
}

export function pasteCellText(text: string): Command {
  return (state) => {
    const path = state.selection.anchor.path;
    if (path.length < 3 || !text) {
      return null;
    }
    const cellPath = path.slice(0, 3);
    return [
      {
        type: 'remove_node',
        path: cellPath.slice(0, -1),
        index: cellPath[2],
      },
      {
        type: 'insert_node',
        path: cellPath.slice(0, -1),
        index: cellPath[2],
        node: {
          type: 'tableCell',
          content: [core.createParagraph([core.createText(text)])],
        },
      },
      { type: 'set_selection', selection: core.collapsedAt([...cellPath, 0], 0) },
    ];
  };
}

export function importTableFromHtml(html: string): Command {
  return (state) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const tableEl = doc.querySelector('table');
    if (!tableEl) {
      return null;
    }
    const trs = [...tableEl.querySelectorAll('tr')];
    const cols = Math.max(1, ...trs.map((r) => r.querySelectorAll('th,td').length));
    const hasHeader = Boolean(tableEl.querySelector('th'));
    const content: DocNode[] = trs.map((tr, ri) => {
      const cells = [...tr.querySelectorAll('th,td')];
      const row: DocNode = {
        type: 'tableRow',
        attrs: ri === 0 && hasHeader ? { header: true } : undefined,
        content: Array.from({ length: cols }, (_, ci) => {
          const td = cells[ci];
          return {
            type: 'tableCell',
            content: [core.createParagraph([core.createText(td?.textContent ?? '')])],
          };
        }),
      };
      return row;
    });
    const index = (state.selection.anchor.path[0] ?? 0) + 1;
    const table: DocNode = {
      type: 'table',
      id: `table_${Date.now()}`,
      attrs: { cols, hasHeader },
      content: content.length > 0 ? content : [emptyRow(cols)],
    };
    return [
      { type: 'insert_node', path: [], index, node: table },
      {
        type: 'insert_node',
        path: [],
        index: index + 1,
        node: core.createParagraph([core.createText('')]),
      },
    ];
  };
}

export type { Operation };
