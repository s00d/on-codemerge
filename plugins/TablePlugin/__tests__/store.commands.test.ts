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

  it('pagination page change keeps orderedRowIds for paste past page', () => {
    const store = new TableStore(
      baseDoc({
        view: { pagination: { page: 0, pageSize: 2 } },
      })
    );
    expect(store.getDerived().rowIds).toStrictEqual(['r0', 'r1']);
    expect(store.getDerived().orderedRowIds).toHaveLength(6);
    store.setSelection({ rowIds: ['r1'], active: { rowId: 'r1', colId: 'a' } });
    pasteTsv(store, 'A\nB\nC');
    expect(store.getDoc().rows[1]?.cells.a).toBe('A');
    expect(store.getDoc().rows[2]?.cells.a).toBe('B');
    expect(store.getDoc().rows[3]?.cells.a).toBe('C');
    store.destroy();
  });

  it('setView pagination clamps and filter narrows total', () => {
    const store = new TableStore(
      baseDoc({
        view: { pagination: { page: 0, pageSize: 2 }, quickFilter: 'v5' },
      })
    );
    expect(store.getDerived().totalRowCount).toBe(1);
    store.setView({ pagination: { page: 99, pageSize: 2 } });
    expect(store.getDerived().page).toBe(0);
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
