import { describe, expect, it } from 'vitest';
import type { EditorAPI } from '@codemerge/sdk';
import { ChartDataTable } from '../components/ChartDataTable';
import { getDriver } from '../drivers';
import { validateSeriesForDriver } from '../utils/validation';

function stubEditor(): EditorAPI {
  return {
    t: (k: string) => k,
  } as unknown as EditorAPI;
}

describe('ChartDataTable', () => {
  it('columns match driver.fields for bar and bubble', () => {
    for (const type of ['bar', 'bubble'] as const) {
      const host = document.createElement('div');
      document.body.append(host);
      const table = new ChartDataTable(stubEditor(), type, () => {});
      table.mountInto(host);
      const head = host.querySelector('.chart-series-point-head');
      expect(head).toBeTruthy();
      const labels = [...(head?.querySelectorAll('span') ?? [])]
        .map((el) => el.textContent)
        .filter((t) => t);
      expect(labels.length).toBeGreaterThanOrEqual(getDriver(type).fields.length);
      const series = table.getSeries();
      expect(validateSeriesForDriver(series, getDriver(type))).toBe(true);
      table.destroy();
      host.remove();
    }
  });

  it('setType coerces bar → bubble with r', () => {
    const table = new ChartDataTable(stubEditor(), 'bar', () => {});
    table.setType('bubble');
    const series = table.getSeries();
    expect(series[0]?.data.every((p) => typeof p.r === 'number')).toBe(true);
    expect(validateSeriesForDriver(series, getDriver('bubble'))).toBe(true);
    table.destroy();
  });

  it('setType bubble → pie drops xy keeps values', () => {
    const table = new ChartDataTable(stubEditor(), 'bubble', () => {});
    table.setType('pie');
    const series = table.getSeries();
    expect(series.length).toBe(1);
    expect(series[0]?.data.every((p) => typeof p.value === 'number')).toBe(true);
    expect(validateSeriesForDriver(series, getDriver('pie'))).toBe(true);
    table.destroy();
  });
});
