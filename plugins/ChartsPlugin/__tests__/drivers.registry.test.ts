import { describe, expect, it } from 'vitest';
import { allChartTypes, DRIVERS, getDriver } from '../drivers';
import { validateSeriesForDriver } from '../utils/validation';

describe('drivers.registry', () => {
  it('registers every ChartType', () => {
    const types = allChartTypes();
    expect(types.length).toBe(8);
    for (const type of types) {
      const d = getDriver(type);
      expect(d.type).toBe(type);
      expect(DRIVERS[type]).toBe(d);
      expect(d.fields.length).toBeGreaterThan(0);
      expect(d.fields).toContain('label');
      expect(d.icon).toBeTruthy();
      expect(d.name).toBeTruthy();
    }
  });

  it('seriesMode matches family intent', () => {
    expect(getDriver('bar').seriesMode).toBe('multi');
    expect(getDriver('line').seriesMode).toBe('multi');
    expect(getDriver('area').seriesMode).toBe('multi');
    expect(getDriver('radar').seriesMode).toBe('multi');
    expect(getDriver('pie').seriesMode).toBe('single');
    expect(getDriver('doughnut').seriesMode).toBe('single');
    expect(getDriver('scatter').seriesMode).toBe('single');
    expect(getDriver('bubble').seriesMode).toBe('single');
  });

  it('bubble requires r; scatter does not', () => {
    expect(getDriver('bubble').fields).toContain('r');
    expect(getDriver('scatter').fields).not.toContain('r');
    expect(getDriver('scatter').fields).toContain('x');
    expect(getDriver('bubble').fields).toContain('x');
  });

  it('defaults validate against driver fields', () => {
    for (const type of allChartTypes()) {
      const d = getDriver(type);
      expect(validateSeriesForDriver(d.defaults(), d)).toBe(true);
    }
  });
});
