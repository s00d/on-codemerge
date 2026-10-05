import { describe, expect, it } from 'vitest';
import { resetIdCounter } from '@codemerge/kernel';
import {
  emptyTableGrid,
  gridFromMatrix,
  gridToMatrix,
  isTableEditorDoc,
  isTableGridDoc,
  normalizeTableGrid,
  emptyEditorDoc,
  gridFromDoc,
} from '../io/adapters';

describe('TablePlugin io/adapters v2', () => {
  it('emptyTableGrid has version 2 and row objects', () => {
    resetIdCounter();
    const g = emptyTableGrid();
    expect(g.version).toBe(2);
    expect(g.columns).toHaveLength(2);
    expect(g.rows[0]?.id).toBeTruthy();
    expect(typeof g.rows[0]?.cells).toBe('object');
  });

  it('migrates v1 string[][] rows', () => {
    const g = normalizeTableGrid({
      columns: [
        { id: 'a', title: 'A' },
        { id: 'b', title: 'B' },
      ],
      rows: [
        ['1', '2'],
        ['3', '4'],
      ],
    });
    expect(g.version).toBe(2);
    expect(g.rows).toHaveLength(2);
    expect(g.rows[0]?.cells.a).toBe('1');
    expect(g.rows[1]?.cells.b).toBe('4');
  });

  it('isTableGridDoc accepts v1 and v2', () => {
    expect(
      isTableGridDoc({
        columns: [{ id: 'a', title: 'A' }],
        rows: [['x']],
      })
    ).toBe(true);
    expect(
      isTableGridDoc({
        columns: [{ id: 'a', title: 'A' }],
        rows: [{ id: 'r1', cells: { a: 'x' } }],
      })
    ).toBe(true);
    expect(isTableGridDoc({ columns: [], rows: 'nope' })).toBe(false);
  });

  it('gridFromMatrix with header', () => {
    const g = gridFromMatrix(
      [
        ['Name', 'Qty'],
        ['Apples', '3'],
      ],
      true
    );
    expect(g.columns.map((c) => c.title)).toStrictEqual(['Name', 'Qty']);
    expect(g.rows).toHaveLength(1);
    expect(Object.values(g.rows[0]!.cells)).toStrictEqual(['Apples', '3']);
  });

  it('emptyEditorDoc / gridFromDoc roundtrip', () => {
    const doc = emptyEditorDoc({
      version: 2,
      columns: [{ id: 'c', title: 'C' }],
      rows: [{ id: 'r', cells: { c: 42 } }],
    });
    expect(isTableEditorDoc(doc)).toBe(true);
    const g = gridFromDoc(doc);
    expect(g.rows[0]?.cells.c).toBe(42);
  });

  it('gridToMatrix appends columns missing from stale columnOrder', () => {
    const g = normalizeTableGrid({
      version: 2,
      columns: [
        { id: 'a', title: 'A' },
        { id: 'b', title: 'B' },
        { id: 'c', title: 'C' },
      ],
      rows: [{ id: 'r1', cells: { a: '1', b: '2', c: '3' } }],
      view: { columnOrder: ['b', 'a'] },
    });
    expect(gridToMatrix(g)[0]).toStrictEqual(['B', 'A', 'C']);
    expect(gridToMatrix(g)[1]).toStrictEqual(['2', '1', '3']);
  });

  it('strips self/cyclic parentId edges', () => {
    const g = normalizeTableGrid({
      version: 2,
      columns: [{ id: 'a', title: 'A' }],
      rows: [
        { id: 'r1', cells: { a: '1' }, parentId: 'r2' },
        { id: 'r2', cells: { a: '2' }, parentId: 'r1' },
        { id: 'r3', cells: { a: '3' }, parentId: 'r3' },
      ],
    });
    expect(g.rows.find((r) => r.id === 'r1')?.parentId).toBeNull();
    expect(g.rows.find((r) => r.id === 'r2')?.parentId).toBeNull();
    expect(g.rows.find((r) => r.id === 'r3')?.parentId).toBeNull();
  });
});
