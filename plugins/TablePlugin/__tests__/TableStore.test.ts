import { describe, expect, it } from 'vitest';
import { TableStore } from '../grid/TableStore';
import { emptyTableGrid } from '../io/adapters';
import { selectionToTsv, pasteTsv } from '../grid/clipboard';
import { visibleWindow } from '../grid/viewport';

describe('TableStore', () => {
  it('setCell / addRow / deleteColumn', () => {
    const commits: number[] = [];
    const store = new TableStore(emptyTableGrid(), {
      onCommit: () => {
        commits.push(1);
      },
      commitDebounceMs: 0,
    });
    const col = store.getDoc().columns[0]!.id;
    const row = store.getDoc().rows[0]!.id;
    store.setCell(row, col, 'x');
    store.flushCommit();
    expect(store.getDoc().rows[0]?.cells[col]).toBe('x');
    store.addRow();
    expect(store.getDoc().rows).toHaveLength(3);
    const colB = store.getDoc().columns[1]!.id;
    store.deleteColumn(colB);
    expect(store.getDoc().columns).toHaveLength(1);
    expect(commits.length).toBeGreaterThan(0);
    store.destroy();
  });

  it('sort and quickFilter derive', () => {
    const a = 'ca';
    const b = 'cb';
    const store = new TableStore({
      version: 2,
      columns: [
        { id: a, title: 'A', type: 'text' },
        { id: b, title: 'B', type: 'number' },
      ],
      rows: [
        { id: 'r1', cells: { [a]: 'banana', [b]: 2 } },
        { id: 'r2', cells: { [a]: 'apple', [b]: 1 } },
      ],
    });
    store.setView({ sort: [{ colId: a, dir: 'asc' }] });
    expect(store.getDerived().rowIds[0]).toBe('r2');
    store.setView({ quickFilter: 'ban', sort: [] });
    expect(store.getDerived().rowIds).toStrictEqual(['r1']);
    store.destroy();
  });

  it('viewport windows rows', () => {
    const w = visibleWindow(320, 100, 5000, 32, 2);
    expect(w.end - w.start).toBeLessThan(20);
    expect(w.start).toBeGreaterThan(0);
  });

  it('setEditing notifies subscribers', () => {
    const store = new TableStore();
    let n = 0;
    store.subscribe(() => {
      n += 1;
    });
    store.setEditing(true);
    expect(store.isEditing()).toBe(true);
    expect(n).toBe(1);
    store.setEditing(true);
    expect(n).toBe(1);
    store.setEditing(false);
    expect(n).toBe(2);
    store.destroy();
  });

  it('clipboard tsv', () => {
    const store = new TableStore({
      version: 2,
      columns: [
        { id: 'a', title: 'A' },
        { id: 'b', title: 'B' },
      ],
      rows: [
        { id: 'r1', cells: { a: '1', b: '2' } },
        { id: 'r2', cells: { a: '3', b: '4' } },
      ],
    });
    store.setSelection({ rowIds: ['r1'], active: { rowId: 'r1', colId: 'a' } });
    expect(selectionToTsv(store)).toBe('1\t2');
    pasteTsv(store, '9\t8');
    expect(store.getDoc().rows[0]?.cells.a).toBe('9');
    store.destroy();
  });

  it('pasteTsv coerces boolean false string', () => {
    const store = new TableStore({
      version: 2,
      columns: [{ id: 'b', title: 'B', type: 'boolean' }],
      rows: [{ id: 'r1', cells: { b: true } }],
    });
    store.setSelection({ rowIds: ['r1'], active: { rowId: 'r1', colId: 'b' } });
    pasteTsv(store, 'false');
    expect(store.getDoc().rows[0]?.cells.b).toBe(false);
    store.destroy();
  });

  it('pasteTsv writes past current page via orderedRowIds', () => {
    const rows = Array.from({ length: 5 }, (_, i) => ({
      id: `r${i}`,
      cells: { a: String(i) },
    }));
    const store = new TableStore({
      version: 2,
      columns: [{ id: 'a', title: 'A' }],
      rows,
      view: { pagination: { page: 0, pageSize: 2 } },
    });
    store.setSelection({ rowIds: ['r0'], active: { rowId: 'r0', colId: 'a' } });
    pasteTsv(store, 'x\ny\nz');
    expect(store.getDoc().rows.map((r) => r.cells.a)).toStrictEqual(['x', 'y', 'z', '3', '4']);
    store.destroy();
  });

  it('destroy flushes pending commit', () => {
    let commits = 0;
    const store = new TableStore(emptyTableGrid(), {
      onCommit: () => {
        commits += 1;
      },
      commitDebounceMs: 50_000,
    });
    const col = store.getDoc().columns[0]!.id;
    const row = store.getDoc().rows[0]!.id;
    store.setCell(row, col, 'x');
    expect(store.hasPendingCommit()).toBe(true);
    store.destroy();
    expect(commits).toBe(1);
  });

  it('deleteRow clears dangling child parentId', () => {
    const store = new TableStore({
      version: 2,
      columns: [{ id: 'a', title: 'A' }],
      rows: [
        { id: 'p', cells: { a: 'p' } },
        { id: 'c', cells: { a: 'c' }, parentId: 'p' },
      ],
    });
    store.deleteRow('p');
    expect(store.getDoc().rows.find((r) => r.id === 'c')?.parentId).toBeNull();
    store.destroy();
  });

  it('clamps page after deleteRow / replaceDoc', () => {
    const rows = Array.from({ length: 25 }, (_, i) => ({
      id: `r${i}`,
      cells: { a: String(i) },
    }));
    const store = new TableStore({
      version: 2,
      columns: [{ id: 'a', title: 'A' }],
      rows,
      view: { pagination: { page: 2, pageSize: 10 } },
    });
    expect(store.getDerived().page).toBe(2);
    for (const id of ['r20', 'r21', 'r22', 'r23', 'r24']) {
      store.deleteRow(id);
    }
    expect(store.getDerived().page).toBe(1);
    store.replaceDoc({
      version: 2,
      columns: [{ id: 'a', title: 'A' }],
      rows: [{ id: 'only', cells: { a: '1' } }],
      view: { pagination: { page: 9, pageSize: 10 } },
    });
    expect(store.getDerived().page).toBe(0);
    store.destroy();
  });

  it('hasPendingCommit tracks debounce timer', () => {
    const store = new TableStore(emptyTableGrid(), {
      onCommit: () => undefined,
      commitDebounceMs: 50_000,
    });
    const col = store.getDoc().columns[0]!.id;
    const row = store.getDoc().rows[0]!.id;
    expect(store.hasPendingCommit()).toBe(false);
    store.setCell(row, col, 'pending');
    expect(store.hasPendingCommit()).toBe(true);
    store.flushCommit();
    expect(store.hasPendingCommit()).toBe(false);
    store.destroy();
  });

  it('setDoc cancels pending commit without flushing', () => {
    let commits = 0;
    const store = new TableStore(emptyTableGrid(), {
      onCommit: () => {
        commits += 1;
      },
      commitDebounceMs: 50_000,
    });
    const col = store.getDoc().columns[0]!.id;
    const row = store.getDoc().rows[0]!.id;
    store.setCell(row, col, 'pending');
    expect(store.hasPendingCommit()).toBe(true);
    store.setDoc({
      version: 2,
      columns: [{ id: col, title: 'A' }],
      rows: [{ id: row, cells: { [col]: 'from-kernel' } }],
    });
    expect(store.hasPendingCommit()).toBe(false);
    expect(commits).toBe(0);
    expect(store.getDoc().rows[0]?.cells[col]).toBe('from-kernel');
    store.destroy();
  });

  it('clearing groupBy also clears expand state via setView', () => {
    const store = new TableStore({
      version: 2,
      columns: [{ id: 'a', title: 'A' }],
      rows: [
        { id: 'r1', cells: { a: 'x' } },
        { id: 'r2', cells: { a: 'y' } },
      ],
      view: { groupBy: ['a'], expandedGroupIds: ['__group__:x'] },
    });
    store.setView({ groupBy: [], expandedGroupIds: undefined });
    expect(store.getDoc().view?.groupBy).toBeUndefined();
    expect(store.getDoc().view?.expandedGroupIds).toBeUndefined();
    store.destroy();
  });
});
