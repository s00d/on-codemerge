import { describe, expect, it } from 'vitest';
import { layoutColumns } from '../grid/derive/columns';
import { filterRowIds } from '../grid/derive/filter';
import { groupRowIds, isGroupRowId } from '../grid/derive/group';
import { pageRowIds } from '../grid/derive/page';
import { sortRowIds } from '../grid/derive/sort';
import { flattenTreeRowIds, rowDepth } from '../grid/derive/tree';
import type { TableGridDoc } from '../io/adapters';
import { normalizeTableGrid } from '../io/adapters';
import { TableStore } from '../grid/TableStore';
import { parseTableBoolean, coerceCellForColumn } from '../io/adapters';

function doc(
  partial: Partial<TableGridDoc> & Pick<TableGridDoc, 'columns' | 'rows'>
): TableGridDoc {
  return normalizeTableGrid({ version: 2, ...partial });
}

describe('derive/columns layoutColumns', () => {
  it('appends columns missing from stale columnOrder', () => {
    const d = doc({
      columns: [
        { id: 'a', title: 'A' },
        { id: 'b', title: 'B' },
        { id: 'c', title: 'C' },
      ],
      rows: [{ id: 'r1', cells: { a: '', b: '', c: '' } }],
      view: { columnOrder: ['b', 'a'] },
    });
    expect(layoutColumns(d).columnIds).toStrictEqual(['b', 'a', 'c']);
  });

  it('pins left then center then right', () => {
    const d = doc({
      columns: [
        { id: 'a', title: 'A', pinned: 'right' },
        { id: 'b', title: 'B' },
        { id: 'c', title: 'C', pinned: 'left' },
      ],
      rows: [{ id: 'r1', cells: { a: '', b: '', c: '' } }],
    });
    const layout = layoutColumns(d);
    expect(layout.columnIds).toStrictEqual(['c', 'b', 'a']);
    expect(layout.pinnedLeft).toStrictEqual(['c']);
    expect(layout.pinnedRight).toStrictEqual(['a']);
    expect(layout.center).toStrictEqual(['b']);
  });
});

describe('derive/filter + sort', () => {
  const base = doc({
    columns: [
      { id: 'n', title: 'N', type: 'text' },
      { id: 'q', title: 'Q', type: 'number' },
      { id: 'ok', title: 'Ok', type: 'boolean' },
    ],
    rows: [
      { id: 'r1', cells: { n: 'banana', q: 2, ok: false } },
      { id: 'r2', cells: { n: 'apple', q: 1, ok: true } },
      { id: 'r3', cells: { n: 'cherry', q: 3, ok: false } },
    ],
  });

  it('quickFilter is case-insensitive substring', () => {
    const d = {
      ...base,
      view: { quickFilter: 'APP' },
    };
    expect(filterRowIds(d, ['r1', 'r2', 'r3'])).toStrictEqual(['r2']);
  });

  it('sorts text asc/desc and number', () => {
    const asc = { ...base, view: { sort: [{ colId: 'n', dir: 'asc' as const }] } };
    expect(sortRowIds(asc, ['r1', 'r2', 'r3'])).toStrictEqual(['r2', 'r1', 'r3']);
    const byQ = { ...base, view: { sort: [{ colId: 'q', dir: 'desc' as const }] } };
    expect(sortRowIds(byQ, ['r1', 'r2', 'r3'])).toStrictEqual(['r3', 'r1', 'r2']);
  });

  it('sorts boolean with parseTableBoolean (string false is false)', () => {
    const dirty = doc({
      columns: [{ id: 'ok', title: 'Ok', type: 'boolean' }],
      rows: [
        { id: 'r1', cells: { ok: 'false' as unknown as boolean } },
        { id: 'r2', cells: { ok: true } },
      ],
      view: { sort: [{ colId: 'ok', dir: 'asc' }] },
    });
    expect(sortRowIds(dirty, ['r1', 'r2'])).toStrictEqual(['r1', 'r2']);
  });
});

describe('derive/tree', () => {
  it('flattens parent before children when expanded', () => {
    const d = doc({
      columns: [{ id: 'a', title: 'A' }],
      rows: [
        { id: 'p', cells: { a: 'p' } },
        { id: 'c1', cells: { a: 'c1' }, parentId: 'p' },
        { id: 'c2', cells: { a: 'c2' }, parentId: 'p' },
      ],
    });
    expect(flattenTreeRowIds(d, ['p', 'c1', 'c2'])).toStrictEqual(['p', 'c1', 'c2']);
    expect(rowDepth(d, 'c1')).toBe(1);
  });

  it('hides children when parent not in expandedRowIds', () => {
    const d = doc({
      columns: [{ id: 'a', title: 'A' }],
      rows: [
        { id: 'p', cells: { a: 'p' } },
        { id: 'c1', cells: { a: 'c1' }, parentId: 'p' },
      ],
      view: { expandedRowIds: [] },
    });
    expect(flattenTreeRowIds(d, ['p', 'c1'])).toStrictEqual(['p']);
  });

  it('normalize strips cyclic parentId so flatten still shows rows', () => {
    const d = doc({
      columns: [{ id: 'a', title: 'A' }],
      rows: [
        { id: 'a', cells: { a: '1' }, parentId: 'b' },
        { id: 'b', cells: { a: '2' }, parentId: 'a' },
      ],
    });
    expect(d.rows.every((r) => r.parentId === null)).toBe(true);
    expect(flattenTreeRowIds(d, ['a', 'b']).toSorted()).toStrictEqual(['a', 'b']);
  });
});

describe('derive/group + page', () => {
  it('groups and defaults all expanded', () => {
    const d = doc({
      columns: [
        { id: 'g', title: 'G' },
        { id: 'n', title: 'N', type: 'number' },
      ],
      rows: [
        { id: 'r1', cells: { g: 'A', n: 10 } },
        { id: 'r2', cells: { g: 'A', n: 5 } },
        { id: 'r3', cells: { g: 'B', n: 1 } },
      ],
      view: { groupBy: ['g'] },
    });
    const { displayIds, groups } = groupRowIds(d, ['r1', 'r2', 'r3']);
    expect(groups).toHaveLength(2);
    expect(displayIds.filter(isGroupRowId)).toHaveLength(2);
    expect(groups[0]?.agg.n?.sum).toBe(15);
  });

  it('collapsed group hides members via expandedGroupIds', () => {
    const d = doc({
      columns: [{ id: 'g', title: 'G' }],
      rows: [
        { id: 'r1', cells: { g: 'A' } },
        { id: 'r2', cells: { g: 'B' } },
      ],
      view: { groupBy: ['g'], expandedGroupIds: ['__group__:B'] },
    });
    const { displayIds } = groupRowIds(d, ['r1', 'r2']);
    expect(displayIds).toStrictEqual(['__group__:A', '__group__:B', 'r2']);
  });

  it('pageRowIds clamps page and slices', () => {
    const d = doc({
      columns: [{ id: 'a', title: 'A' }],
      rows: Array.from({ length: 5 }, (_, i) => ({
        id: `r${i}`,
        cells: { a: String(i) },
      })),
      view: { pagination: { page: 9, pageSize: 2 } },
    });
    const page = pageRowIds(d, ['r0', 'r1', 'r2', 'r3', 'r4']);
    expect(page.page).toBe(2);
    expect(page.rowIds).toStrictEqual(['r4']);
    expect(page.pageCount).toBe(3);
  });
});

describe('coerce + store integration', () => {
  it('parseTableBoolean treats false strings as false', () => {
    expect(parseTableBoolean('false')).toBe(false);
    expect(parseTableBoolean('FALSE')).toBe(false);
    expect(parseTableBoolean('0')).toBe(false);
    expect(parseTableBoolean('true')).toBe(true);
    expect(parseTableBoolean(1)).toBe(true);
    expect(parseTableBoolean(0)).toBe(false);
  });

  it('coerceCellForColumn for number empty stays empty string', () => {
    expect(coerceCellForColumn({ id: 'n', title: 'N', type: 'number' }, '')).toBe('');
    expect(coerceCellForColumn({ id: 'n', title: 'N', type: 'number' }, '12')).toBe(12);
  });

  it('group toggle does not wipe tree expandedRowIds', () => {
    const store = new TableStore({
      version: 2,
      columns: [
        { id: 'g', title: 'G' },
        { id: 'a', title: 'A' },
      ],
      rows: [
        { id: 'p', cells: { g: 'A', a: 'p' } },
        { id: 'c', cells: { g: 'A', a: 'c' }, parentId: 'p' },
        { id: 'q', cells: { g: 'B', a: 'q' } },
      ],
      view: {
        groupBy: ['g'],
        expandedRowIds: ['p'],
        expandedGroupIds: ['__group__:A', '__group__:B'],
      },
    });
    expect(store.getDerived().orderedRowIds).toContain('c');
    store.setView({ expandedGroupIds: ['__group__:A'] });
    expect(store.getDoc().view?.expandedRowIds).toStrictEqual(['p']);
    expect(store.getDerived().orderedRowIds).toContain('c');
    expect(store.getDerived().orderedRowIds).not.toContain('q');
    store.destroy();
  });

  it('getDerived.groups match visible tree-collapsed members', () => {
    const store = new TableStore({
      version: 2,
      columns: [
        { id: 'g', title: 'G' },
        { id: 'n', title: 'N', type: 'number' },
      ],
      rows: [
        { id: 'p', cells: { g: 'A', n: 10 } },
        { id: 'c1', cells: { g: 'A', n: 5 }, parentId: 'p' },
        { id: 'c2', cells: { g: 'A', n: 7 }, parentId: 'p' },
      ],
      view: { groupBy: ['g'], expandedRowIds: [] },
    });
    const g = store.getDerived().groups[0];
    expect(g?.rowIds).toStrictEqual(['p']);
    expect(g?.agg.n?.sum).toBe(10);
    store.destroy();
  });
});
