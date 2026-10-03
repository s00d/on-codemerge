import { describe, expect, it } from 'vitest';
import { allChartTypes, getDriver } from '../drivers/registry';
import { pointHasFields } from '../drivers/types';
import { validateSeries, validateSeriesForDriver } from '../utils/validation';

describe('drivers.defaults', () => {
  it('every type defaults are non-empty valid series', () => {
    for (const type of allChartTypes()) {
      const series = getDriver(type).defaults();
      expect(validateSeries(series)).toBe(true);
      expect(series[0]!.data.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('points include required fields', () => {
    for (const type of allChartTypes()) {
      const d = getDriver(type);
      for (const s of d.defaults()) {
        for (const p of s.data) {
          expect(pointHasFields(p, d.fields)).toBe(true);
        }
      }
      expect(validateSeriesForDriver(d.defaults(), d)).toBe(true);
    }
  });
});
