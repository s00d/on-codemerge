import { describe, expect, it, vi } from 'vitest';
import { TableStore } from '../grid/TableStore';
import { pasteTsv } from '../grid/clipboard';

function baseDoc(extra: Record<string, unknown> = {}) {
  return {
    version: 2 as const,
    columns: [
      { id: 'a', title: 'A' },
      { id: 'n', title: 'N', type: 'number' as const },
    ],
    rows: Array.from({ length: 6 }, (_, i) => ({
      id: `r${i}`,
      cells: { a: `v${i}`, n: i },
    })),
    ...extra,
  };
}

describe('TableStore commands', () => {
  it('setCell coerces number and schedules commit', () => {
    vi.useFakeTimers();
    const onCommit = vi.fn();
    const store = new TableStore(baseDoc(), { onCommit });
    store.setCell('r0', 'n', '42');
    expect(store.getDoc().rows[0]?.cells.n).toBe(42);
    expect(onCommit).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(onCommit).toHaveBeenCalledOnce();
    store.destroy();
    vi.useRealTimers();
  });

  it('setDoc cancels pending commit timer', () => {
    vi.useFakeTimers();
    const onCommit = vi.fn();
    const store = new TableStore(baseDoc(), { onCommit });
    store.setCell('r0', 'a', 'x');
    store.setDoc({
      version: 2,
      columns: [{ id: 'a', title: 'A' }],
      rows: [{ id: 'z', cells: { a: 'z' } }],
    });
    vi.runAllTimers();
    expect(onCommit).not.toHaveBeenCalled();
    expect(store.getDoc().rows[0]?.id).toBe('z');
    store.destroy();
    vi.useRealTimers();
  });

  it('flushCommit on destroy flushes pending edits', () => {
    vi.useFakeTimers();
    const onCommit = vi.fn();
    const store = new TableStore(baseDoc(), { onCommit });
    store.setCell('r0', 'a', 'flush-me');
    expect(store.hasPendingCommit()).toBe(true);
    store.destroy();
    expect(onCommit).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it('addRow / deleteRow / reorderColumns / setColumnMeta', () => {
    const store = new TableStore(baseDoc());
    store.addRow('r0');
    expect(store.getDoc().rows).toHaveLength(7);
    expect(store.getDoc().rows[1]?.cells.a).toBe('');
    store.deleteRow('r0');
    expect(store.getDoc().rows.map((r) => r.id)).not.toContain('r0');
    store.reorderColumns(['n', 'a']);
    expect(store.getDoc().view?.columnOrder).toStrictEqual(['n', 'a']);
    store.setColumnMeta('a', { width: 240, title: 'Alpha' });
    expect(store.getDoc().columns.find((c) => c.id === 'a')).toMatchObject({
      width: 240,
      title: 'Alpha',
    });
    store.destroy();
  });

  it('addRow before, addColumn left, cell style, clearCell', () => {
    const store = new TableStore(baseDoc());
    store.addRow('r0', { before: true });
    expect(store.getDoc().rows[0]?.id).not.toBe('r0');
    expect(store.getDoc().rows[1]?.id).toBe('r0');
    const beforeIds = store.getDoc().columns.map((c) => c.id);
    store.addColumn({ title: 'L' }, { beforeColId: 'a' });
    expect(store.getDoc().columns[0]?.title).toBe('L');
    expect(
      store
        .getDoc()
        .columns.map((c) => c.id)
        .slice(1)
    ).toStrictEqual(beforeIds);
    store.setCellStyle('r0', 'a', { align: 'center', background: '#abcabc' });
    expect(store.getDoc().rows.find((r) => r.id === 'r0')?.styles?.a).toStrictEqual({
      align: 'center',
      background: '#abcabc',
    });
    store.setCell('r0', 'a', 'keep');
    store.clearCell('r0', 'a');
    expect(store.getDoc().rows.find((r) => r.id === 'r0')?.cells.a).toBe('');
    store.setTheme('striped');
    expect(store.getDoc().theme).toBe('striped');
    store.setTheme('default');
    expect(store.getDoc().theme).toBeUndefined();
    store.clearTable();
    expect(store.getDoc().rows.every((r) => r.cells.a === '' && r.cells.n === '')).toBe(true);
    store.destroy();
  });

  it('paste past first rows uses full orderedRowIds', () => {
    const store = new TableStore(baseDoc());
    expect(store.getDerived().rowIds).toHaveLength(6);
    store.setSelection({ rowIds: ['r1'], active: { rowId: 'r1', colId: 'a' } });
    pasteTsv(store, 'A\nB\nC');
    expect(store.getDoc().rows[1]?.cells.a).toBe('A');
    expect(store.getDoc().rows[2]?.cells.a).toBe('B');
    expect(store.getDoc().rows[3]?.cells.a).toBe('C');
    store.destroy();
  });

  it('quickFilter narrows total without paging the sheet', () => {
    const store = new TableStore(
      baseDoc({
        view: { quickFilter: 'v5' },
      })
    );
    expect(store.getDerived().totalRowCount).toBe(1);
    store.destroy();
  });

  it('toggleSort cycles asc → desc → off', () => {
    const store = new TableStore(baseDoc());
    store.toggleSort('a');
    expect(store.getDoc().view?.sort).toStrictEqual([{ colId: 'a', dir: 'asc' }]);
    store.toggleSort('a');
    expect(store.getDoc().view?.sort).toStrictEqual([{ colId: 'a', dir: 'desc' }]);
    store.toggleSort('a');
    expect(store.getDoc().view?.sort ?? []).toHaveLength(0);
    store.destroy();
  });

  it('deleteColumn refuses last column; addColumn pads cells', () => {
    const store = new TableStore({
      version: 2,
      columns: [{ id: 'a', title: 'A' }],
      rows: [{ id: 'r1', cells: { a: '1' } }],
    });
    store.deleteColumn('a');
    expect(store.getDoc().columns).toHaveLength(1);
    store.addColumn({ id: 'b', title: 'B' });
    expect(store.getDoc().rows[0]?.cells.b).toBe('');
    store.destroy();
  });
});
