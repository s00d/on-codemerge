import { describe, expect, it } from 'vitest';
import { optionsFromAttrs } from '../utils/options';

describe('optionsFromAttrs contract', () => {
  it('maps presentation attrs without inventing colors', () => {
    const opts = optionsFromAttrs({
      title: 'T',
      width: 400,
      height: 240,
      showLegend: true,
      showGrid: false,
      mode: 'stacked',
      orientation: 'horizontal',
      xAxisLabel: 'X',
      yAxisLabel: 'Y',
    });
    expect(opts.title).toBe('T');
    expect(opts.legend?.show).toBe(true);
    expect(opts.grid?.show).toBe(false);
    expect(opts.mode).toBe('stacked');
    expect(opts.orientation).toBe('horizontal');
    expect(opts.xAxis?.title).toBe('X');
    expect(opts.yAxis?.title).toBe('Y');
    expect(opts.colors).toBeUndefined();
  });

  it('documents mermaid-ignored presentation attrs stay on options only', () => {
    // showLegend / showGrid / orientation are consumed by canvas drivers;
    // mermaid-backed charts ignore them in SVG (colors come from data via paletteFromSeries).
    const opts = optionsFromAttrs({
      title: '',
      width: 100,
      height: 100,
      showLegend: false,
      showGrid: true,
      mode: 'default',
      orientation: 'vertical',
      xAxisLabel: '',
      yAxisLabel: '',
    });
    expect(opts.legend?.show).toBe(false);
    expect(opts.grid?.show).toBe(true);
    expect(opts.orientation).toBe('vertical');
  });
});
