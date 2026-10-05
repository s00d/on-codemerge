import { describe, expect, it } from 'vitest';
import {
  exportCsv,
  gridFromMatrix,
  gridToMatrix,
  normalizeTableGrid,
  coerceCellForColumn,
  parseTableBoolean,
} from '../io/adapters';
import {
  escapeCsvField,
  matrixToCsv,
  parseCsv,
  parseJsonToMatrix,
  stringifyCell,
} from '../io/matrix';

describe('io/csv + matrix', () => {
  it('parseCsv handles quotes, commas, newlines', () => {
    const m = parseCsv('a,"b,c","d\ne"\n1,2,3');
    expect(m).toStrictEqual([
      ['a', 'b,c', 'd\ne'],
      ['1', '2', '3'],
    ]);
  });

  it('escapeCsvField + matrixToCsv roundtrip', () => {
    const matrix = [
      ['a', 'b,c'],
      ['"q"', 'x'],
    ];
    const csv = matrixToCsv(matrix);
    expect(csv).toContain('"b,c"');
    expect(parseCsv(csv)).toStrictEqual(matrix);
  });

  it('exportCsv uses column titles and grid order', () => {
    const grid = normalizeTableGrid({
      version: 2,
      columns: [
        { id: 'b', title: 'Beta' },
        { id: 'a', title: 'Alpha' },
      ],
      rows: [{ id: 'r1', cells: { a: '1', b: '2' } }],
      view: { columnOrder: ['a', 'b'] },
    });
    const csv = exportCsv(grid);
    expect(csv.split('\n')[0]).toBe('Alpha,Beta');
    expect(csv.split('\n')[1]).toBe('1,2');
  });

  it('gridFromMatrix with header + gridToMatrix appends missing cols', () => {
    const g = gridFromMatrix(
      [
        ['A', 'B'],
        ['1', '2'],
      ],
      true
    );
    const firstId = g.columns[0]!.id;
    g.columns.push({ id: 'extra', title: 'Extra' });
    g.rows[0]!.cells.extra = '3';
    g.view = { columnOrder: [firstId] };
    const m = gridToMatrix(g);
    expect(m[0]).toContain('Extra');
    expect(m[1]?.[m[0]!.indexOf('Extra')]).toBe('3');
  });

  it('parseJsonToMatrix accepts array of objects and nested arrays', () => {
    expect(
      parseJsonToMatrix([
        { a: 1, b: 2 },
        { a: 3, b: 4 },
      ]).matrix
    ).toStrictEqual([
      ['a', 'b'],
      ['1', '2'],
      ['3', '4'],
    ]);
    expect(parseJsonToMatrix([['x'], ['y']]).matrix).toStrictEqual([['x'], ['y']]);
  });

  it('stringifyCell + coerce cover null/bool/number', () => {
    expect(stringifyCell(null)).toBe('');
    expect(stringifyCell(true)).toBe('true');
    expect(escapeCsvField('a,b')).toBe('"a,b"');
    expect(coerceCellForColumn({ id: 'b', title: 'B', type: 'boolean' }, 'false')).toBe(false);
    expect(coerceCellForColumn({ id: 'b', title: 'B', type: 'boolean' }, 'yes')).toBe(true);
    expect(parseTableBoolean(null)).toBe(false);
  });
});
