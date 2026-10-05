import { describe, expect, it } from 'vitest';
import { filterRowIds } from '../grid/derive/filter';
import { normalizeTableGrid } from '../io/adapters';

const base = normalizeTableGrid({
  version: 2,
  columns: [
    { id: 'n', title: 'N' },
    { id: 'q', title: 'Q', type: 'number' },
  ],
  rows: [
    { id: 'r1', cells: { n: 'alpha', q: 10 } },
    { id: 'r2', cells: { n: 'beta', q: 20 } },
    { id: 'r3', cells: { n: '', q: 5 } },
  ],
});

describe('filter ops', () => {
  it('eq / neq / contains / startsWith', () => {
    const ids = ['r1', 'r2', 'r3'];
    expect(
      filterRowIds({ ...base, view: { filters: { n: { op: 'eq', value: 'alpha' } } } }, ids)
    ).toStrictEqual(['r1']);
    expect(
      filterRowIds({ ...base, view: { filters: { n: { op: 'neq', value: 'alpha' } } } }, ids)
    ).toStrictEqual(['r2', 'r3']);
    expect(
      filterRowIds({ ...base, view: { filters: { n: { op: 'contains', value: 'et' } } } }, ids)
    ).toStrictEqual(['r2']);
    expect(
      filterRowIds({ ...base, view: { filters: { n: { op: 'startsWith', value: 'al' } } } }, ids)
    ).toStrictEqual(['r1']);
  });

  it('empty / notEmpty / gt / lt', () => {
    const ids = ['r1', 'r2', 'r3'];
    expect(
      filterRowIds({ ...base, view: { filters: { n: { op: 'empty', value: '' } } } }, ids)
    ).toStrictEqual(['r3']);
    expect(
      filterRowIds({ ...base, view: { filters: { n: { op: 'notEmpty', value: '' } } } }, ids)
    ).toStrictEqual(['r1', 'r2']);
    expect(
      filterRowIds({ ...base, view: { filters: { q: { op: 'gt', value: 10 } } } }, ids)
    ).toStrictEqual(['r2']);
    expect(
      filterRowIds({ ...base, view: { filters: { q: { op: 'lt', value: 10 } } } }, ids)
    ).toStrictEqual(['r3']);
  });

  it('combines column filter with quickFilter', () => {
    const ids = ['r1', 'r2', 'r3'];
    expect(
      filterRowIds(
        {
          ...base,
          view: {
            filters: { q: { op: 'gt', value: 0 } },
            quickFilter: 'beta',
          },
        },
        ids
      )
    ).toStrictEqual(['r2']);
  });
});
