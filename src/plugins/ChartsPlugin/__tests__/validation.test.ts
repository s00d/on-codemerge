import { describe, expect, it, vi, afterEach } from 'vitest';
import { normalizeChartData, validateChartData } from '../utils/validation';

describe('validateChartData', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects empty and non-array', () => {
    expect.hasAssertions();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(validateChartData([])).toBe(false);
    expect(validateChartData(null)).toBe(false);
  });

  it('accepts value points and series', () => {
    expect.hasAssertions();
    expect(validateChartData([{ label: 'A', value: 1 }])).toBe(true);
    expect(validateChartData([{ name: 'S', data: [{ label: 'A', value: 1 }] }])).toBe(true);
  });

  it('rejects missing label/value and empty series data', () => {
    expect.hasAssertions();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(validateChartData([{ label: '', value: 1 }])).toBe(false);
    expect(validateChartData([{ label: 'A', value: Number.NaN }])).toBe(false);
    expect(validateChartData([{ name: 'S', data: [] }])).toBe(false);
  });

  it('accepts XY points and rejects incomplete XY', () => {
    expect.hasAssertions();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(validateChartData([{ label: 'A', x: 1, y: 2 }])).toBe(true);
    expect(validateChartData([{ label: 'A', x: 1 }])).toBe(false);
  });
});

describe('normalizeChartData', () => {
  it('wraps points into a series', () => {
    expect.hasAssertions();
    expect(normalizeChartData([{ label: 'A', value: 1 }])).toStrictEqual([
      { name: 'Series 1', data: [{ label: 'A', value: 1 }] },
    ]);
  });

  it('passes series through', () => {
    expect.hasAssertions();
    const series = [{ name: 'S', data: [{ label: 'A', value: 1 }] }];
    expect(normalizeChartData(series)).toStrictEqual(series);
  });

  it('normalizeChartData tolerates non-arrays', () => {
    expect.hasAssertions();
    expect(normalizeChartData(null)).toStrictEqual([]);
    expect(normalizeChartData({})).toStrictEqual([]);
  });
});
