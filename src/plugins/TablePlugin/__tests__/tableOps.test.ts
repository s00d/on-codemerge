import { describe, expect, it } from 'vitest';
import {
  applyTransaction,
  createDoc,
  createParagraph,
  createState,
  createText,
  runCommand,
} from '@on-codemerge/kernel';
import type { EditorState } from '@on-codemerge/kernel';
import { core } from '@on-codemerge/sdk';
import {
  addColumn,
  addHeaderRow,
  addRow,
  clearCell,
  clearTable,
  deleteColumn,
  deleteRow,
  deleteTable,
  findTablePath,
  importTableFromHtml,
  insertTableCommand,
  mergeCellsHorizontal,
  mergeCellsVertical,
  pasteCellText,
  removeHeaderRow,
  setCellAttr,
  setTableAttr,
  sortTableByColumn,
  splitCellHorizontal,
  copyCellText,
} from '../tableOps';

function apply(state: EditorState, cmd: Parameters<typeof runCommand>[1]): EditorState {
  const ops = runCommand(state, cmd);
  expect(ops).not.toBeNull();
  return applyTransaction(state, ops!).state;
}

function tableDoc(rows = 2, cols = 2, hasHeader = false) {
  const base = createState(createDoc([createParagraph([createText('before')])]));
  return apply(base, insertTableCommand(rows, cols, hasHeader));
}

function selectCell(state: EditorState, tableIdx: number, row: number, col: number): EditorState {
  return {
    ...state,
    selection: core.collapsedAt([tableIdx, row, col, 0], 0),
  };
}

describe('tableOps', () => {
  it('inserts table with header and trailing paragraph', () => {
    expect.hasAssertions();
    const state = tableDoc(2, 3, true);
    const table = state.doc.content?.find((n) => n.type === 'table');
    expect(table).toBeTruthy();
    expect(table!.content?.length).toBe(3);
    expect(table!.attrs?.cols).toBe(3);
    expect(findTablePath(state.doc, state.selection.anchor.path)?.[0]).toBeDefined();
  });

  it('adds row/column and deletes them', () => {
    expect.hasAssertions();
    let state = tableDoc(2, 2, false);
    const tableIdx = state.doc.content!.findIndex((n) => n.type === 'table');
    state = selectCell(state, tableIdx, 0, 0);

    state = apply(state, addRow('below'));
    expect(state.doc.content![tableIdx].content!).toHaveLength(3);

    state = apply(state, addColumn('right'));
    expect(state.doc.content![tableIdx].content![0].content!).toHaveLength(3);

    state = apply(state, deleteColumn);
    expect(state.doc.content![tableIdx].content![0].content!).toHaveLength(2);

    state = apply(state, deleteRow);
    expect(state.doc.content![tableIdx].content!).toHaveLength(2);
  });

  it('clears cell/table and toggles header/attrs', () => {
    expect.hasAssertions();
    let state = tableDoc(2, 2, false);
    const tableIdx = state.doc.content!.findIndex((n) => n.type === 'table');
    state = selectCell(state, tableIdx, 0, 0);
    state = apply(state, pasteCellText('alpha'));
    state = apply(state, clearCell);
    state = apply(state, clearTable);
    state = apply(state, setTableAttr('border', 1));
    expect(state.doc.content![tableIdx].attrs?.border).toBe(1);
    state = apply(state, setCellAttr('align', 'center'));
    state = apply(state, addHeaderRow);
    expect(state.doc.content![tableIdx].content![0].attrs?.header).toBe(true);
    state = apply(state, removeHeaderRow);
  });

  it('merges horizontally, sorts, imports html, deletes table', () => {
    expect.hasAssertions();
    let state = tableDoc(2, 3, false);
    const tableIdx = state.doc.content!.findIndex((n) => n.type === 'table');
    state = selectCell(state, tableIdx, 0, 0);
    state = apply(state, pasteCellText('b'));
    state = selectCell(state, tableIdx, 0, 1);
    state = apply(state, pasteCellText('a'));
    state = selectCell(state, tableIdx, 0, 0);
    state = apply(state, mergeCellsHorizontal());
    state = apply(state, addRow('below'));
    const table = state.doc.content?.[tableIdx];
    expect(table).toBeDefined();
    if (table === undefined) {
      return;
    }
    const rows = table.content ?? [];
    const last = rows.at(-1);
    expect(last).toBeDefined();
    if (last === undefined) {
      return;
    }
    expect(last.content).toHaveLength(3);
    state = apply(state, sortTableByColumn(0, 'asc'));
    state = apply(state, deleteTable);
    expect(state.doc.content?.some((n) => n.type === 'table')).toBe(false);

    const empty = createState(createDoc([createParagraph([createText('x')])]));
    const imported = apply(
      empty,
      importTableFromHtml('<table><tr><td>1</td><td>2</td></tr></table>')
    );
    expect(imported.doc.content?.some((n) => n.type === 'table')).toBe(true);
  });

  it('returns null when selection is outside table', () => {
    expect.hasAssertions();
    const state = createState(createDoc([createParagraph([createText('solo')])]));
    expect(findTablePath(state.doc, [0])).toBeNull();
    expect(runCommand(state, deleteTable)).toBeNull();
    expect(runCommand(state, addRow('above'))).toBeNull();
    expect(runCommand(state, clearCell)).toBeNull();
    expect(runCommand(state, mergeCellsHorizontal())).toBeNull();
    expect(runCommand(state, mergeCellsVertical())).toBeNull();
    expect(runCommand(state, splitCellHorizontal())).toBeNull();
    expect(runCommand(state, sortTableByColumn(0, 'desc'))).toBeNull();
    expect(runCommand(state, pasteCellText(''))).toBeNull();
    expect(runCommand(state, importTableFromHtml('<p>no</p>'))).toBeNull();
    expect(runCommand(state, setCellAttr('a', 1))).toBeNull();
  });

  it('merges vertically, splits, sorts header, and copies', () => {
    expect.hasAssertions();
    let state = tableDoc(3, 2, true);
    const tableIdx = state.doc.content!.findIndex((n) => n.type === 'table');
    state = selectCell(state, tableIdx, 1, 0);
    state = apply(state, mergeCellsVertical());
    state = apply(state, splitCellHorizontal());
    state = apply(state, addRow('above'));
    state = apply(state, addColumn('left'));
    state = apply(state, sortTableByColumn(0, 'desc'));
    const oneCol = tableDoc(2, 1, false);
    const idx = oneCol.doc.content!.findIndex((n) => n.type === 'table');
    const doomed = selectCell(oneCol, idx, 0, 0);
    const deleted = apply(doomed, deleteColumn);
    expect(deleted.doc.content?.some((n) => n.type === 'table')).toBe(false);

    const copied: string[] = [];
    copyCellText({
      getJSON: () => ({ doc: state.doc }),
      getSelection: () => state.selection,
      notify: (m) => copied.push(m),
    });
    expect(copied[0]).toBe('Cell copied');
    copyCellText({
      getJSON: () => ({ doc: state.doc }),
      getSelection: () => ({ anchor: { path: [0] } }),
      notify: (m) => copied.push(m),
    });
  });
});
