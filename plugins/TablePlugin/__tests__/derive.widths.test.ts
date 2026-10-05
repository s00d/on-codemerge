import { describe, expect, it } from 'vitest';
import {
  columnWidths,
  MIN_COL_WIDTH,
  ROW_INDEX_GUTTER,
  ADD_COL_GUTTER,
} from '../grid/derive/widths';
import type { TableGridDoc } from '../io/adapters';

function doc(widths: number[], fit?: 'fill' | 'content'): TableGridDoc {
  return {
    version: 2,
    columns: widths.map((width, i) => ({
      id: `c${i}`,
      title: `C${i}`,
      width,
    })),
    rows: [],
    view: fit ? { fit } : undefined,
  };
}

describe('columnWidths', () => {
  it('fills remaining viewport by default', () => {
    const ids = ['c0', 'c1'];
    const client = ROW_INDEX_GUTTER + ADD_COL_GUTTER + 800;
    const map = columnWidths(doc([160, 96]), ids, client);
    expect(map.get('c0')! + map.get('c1')!).toBe(800);
    expect(map.get('c0')!).toBeGreaterThan(map.get('c1')!);
  });

  it('content fit keeps stored widths', () => {
    const map = columnWidths(doc([160, 96], 'content'), ['c0', 'c1'], 1200);
    expect(map.get('c0')).toBe(160);
    expect(map.get('c1')).toBe(96);
  });

  it('does not fill when client is too narrow', () => {
    const map = columnWidths(doc([160, 96]), ['c0', 'c1'], 20);
    expect(map.get('c0')).toBe(160);
    expect(map.get('c1')).toBe(96);
  });

  it('freeze pins one column and fills the rest', () => {
    const map = columnWidths(
      doc([160, 96, 96]),
      ['c0', 'c1', 'c2'],
      ROW_INDEX_GUTTER + ADD_COL_GUTTER + 600,
      {
        id: 'c0',
        width: 200,
      }
    );
    expect(map.get('c0')).toBe(200);
    expect(map.get('c1')! + map.get('c2')!).toBe(400);
    expect(map.get('c1')!).toBeGreaterThanOrEqual(MIN_COL_WIDTH);
  });
});
