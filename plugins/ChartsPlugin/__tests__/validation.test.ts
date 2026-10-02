import { describe, expect, it } from 'vitest';
import { isChartPoint, normalizeChartData, validateSeries } from '../utils/validation';

describe('validateSeries', () => {
  it('accepts series and rejects empty', () => {
    expect(validateSeries([])).toBe(false);
    expect(validateSeries([{ name: 'S', data: [{ label: 'A', value: 1 }] }])).toBe(true);
  });

  it('rejects empty series data and bad points', () => {
    expect(validateSeries([{ name: 'S', data: [] }])).toBe(false);
    expect(validateSeries([{ name: 'S', data: [{ label: '', value: 1 }] }])).toBe(false);
  });

  it('accepts XY series points', () => {
    expect(validateSeries([{ name: 'S', data: [{ label: 'P', x: 1, y: 2, value: 2 }] }])).toBe(
      true
    );
  });
});

describe('isChartPoint / normalizeChartData', () => {
  it('accepts value and XY points', () => {
    expect(isChartPoint({ label: 'A', value: 1 })).toBe(true);
    expect(isChartPoint({ label: 'P', x: 1, y: 2 })).toBe(true);
    expect(isChartPoint({ label: 'P', x: 1 })).toBe(false);
    expect(isChartPoint({ label: '', value: 1 })).toBe(false);
  });

  it('wraps points into a series', () => {
    expect(normalizeChartData([{ label: 'A', value: 1 }])).toStrictEqual([
      { name: 'Series 1', data: [{ label: 'A', value: 1 }] },
    ]);
  });

  it('passes series through', () => {
    const series = [{ name: 'S', data: [{ label: 'A', value: 1 }] }];
    expect(normalizeChartData(series)).toStrictEqual(series);
  });

  it('tolerates non-arrays', () => {
    expect(normalizeChartData(null)).toStrictEqual([]);
    expect(normalizeChartData({})).toStrictEqual([]);
  });
});
