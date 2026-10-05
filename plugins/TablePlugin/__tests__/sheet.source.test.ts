import { afterEach, describe, expect, it, vi } from 'vitest';
import { TableStore } from '../grid/TableStore';
import { makeGhostRowId } from '../grid/sheet';
import { fetchLazyMatrix } from '../io/fetchMatrix';
import { emptyTableGrid, gridFromMatrix, normalizeTableGrid } from '../io/adapters';

describe('Excel sheet extent', () => {
  it('ensureCell on ghost row 10 materializes 10 SoT rows', () => {
    const store = new TableStore({
      version: 2,
      columns: [{ id: 'a', title: 'A' }],
      rows: [{ id: 'r0', cells: { a: '' } }],
    });
    expect(store.getDoc().rows).toHaveLength(1);
    const col = store.getSheetColumnIds()[0]!;
    const got = store.ensureCell(9, col);
    expect(got).toBeTruthy();
    expect(store.getDoc().rows).toHaveLength(10);
    expect(JSON.stringify(store.getDoc())).not.toContain('__ghostrow__');
    store.destroy();
  });

  it('visual columns match SoT — no ghost pad on the right', () => {
    const store = new TableStore({
      version: 2,
      columns: [
        { id: 'name', title: 'Name' },
        { id: 'qty', title: 'Qty' },
      ],
      rows: [{ id: 'r1', cells: { name: 'Apples', qty: 3 } }],
    });
    expect(store.getSheetColumnIds()).toStrictEqual(['name', 'qty']);
    expect(store.getSheetColumnIds().some((id) => id.startsWith('__ghostcol__:'))).toBe(false);
    store.destroy();
  });

  it('empty JSON does not serialize ghost rows', () => {
    const store = new TableStore(emptyTableGrid());
    const ids = store.getSheetRowIds();
    expect(ids.some((id) => id.startsWith('__ghostrow__:'))).toBe(true);
    expect(store.getDoc().rows.every((r) => !r.id.startsWith('__ghostrow__:'))).toBe(true);
    store.destroy();
  });

  it('scroll grows visual extent without extra SoT rows', () => {
    const store = new TableStore({
      version: 2,
      columns: [{ id: 'a', title: 'A' }],
      rows: [{ id: 'r0', cells: { a: 'x' } }],
    });
    const used = store.getDoc().rows.length;
    const before = store.getSheetRowCount();
    store.growSheetRows();
    expect(store.getSheetRowCount()).toBeGreaterThan(before);
    expect(store.getDoc().rows).toHaveLength(used);
    store.destroy();
  });

  it('format ghost cell persists style', () => {
    const store = new TableStore({
      version: 2,
      columns: [{ id: 'a', title: 'A' }],
      rows: [{ id: 'r0', cells: { a: '' } }],
    });
    store.setActive(makeGhostRowId(4), 'a');
    const got = store.ensureCell(4, 'a');
    expect(got).toBeTruthy();
    store.setCellStyle(got!.rowId, got!.colId, { color: '#ff0000', background: '#eeeeee' });
    expect(store.getDoc().rows[4]?.styles?.a).toStrictEqual({
      color: '#ff0000',
      background: '#eeeeee',
    });
    store.destroy();
  });
});

describe('tableGrid source import/refresh', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps source on replace and refresh', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          headers: { get: () => null },
          body: null,
          arrayBuffer: () =>
            Promise.resolve(new TextEncoder().encode(JSON.stringify([{ a: 1, b: 2 }])).buffer),
        })
      )
    );
    const url = 'https://example.com/rows.json';
    const { matrix, hasHeader } = await fetchLazyMatrix({ url, format: 'json' });
    const grid = gridFromMatrix(matrix, hasHeader);
    grid.source = { url, format: 'json', headers: hasHeader };
    const store = new TableStore();
    store.setDoc(grid, { commit: true });
    expect(store.getDoc().source?.url).toBe(url);
    expect(store.getDoc().rows.length).toBeGreaterThan(0);

    const again = await fetchLazyMatrix({ url, format: 'json' });
    const refreshed = gridFromMatrix(again.matrix, again.hasHeader);
    refreshed.source = store.getDoc().source;
    store.setDoc(refreshed, { commit: true });
    expect(normalizeTableGrid(store.getDoc()).source?.url).toBe(url);
    store.destroy();
  });
});
