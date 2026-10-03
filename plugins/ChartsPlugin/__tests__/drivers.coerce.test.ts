import { describe, expect, it } from 'vitest';
import { allChartTypes, getDriver } from '../drivers/registry';
import { validateSeriesForDriver } from '../utils/validation';

describe('drivers.coerce', () => {
  it('fromType × toType always yields valid non-empty series for target', () => {
    const types = allChartTypes();
    for (const from of types) {
      const source = getDriver(from).defaults();
      for (const to of types) {
        const driver = getDriver(to);
        const coerced = driver.coerce(source);
        expect(coerced.length).toBeGreaterThan(0);
        expect(validateSeriesForDriver(coerced, driver)).toBe(true);
        if (driver.seriesMode === 'single') {
          expect(coerced.length).toBe(1);
        }
        if (to === 'bubble') {
          for (const p of coerced[0]!.data) {
            expect(typeof p.r).toBe('number');
          }
        }
      }
    }
  });

  it('empty input falls back to defaults', () => {
    for (const type of allChartTypes()) {
      const d = getDriver(type);
      const coerced = d.coerce([]);
      expect(validateSeriesForDriver(coerced, d)).toBe(true);
    }
  });
});
