import { describe, expect, it } from 'vitest';
import { renderChart } from '../drivers/renderChart';
import type { ChartSeries } from '../types';

const i18n = {
  t: (k: string) => k,
  locale: 'en',
};

function svgFromChartImg(img: HTMLImageElement): string {
  const src = img.src;
  const prefix = 'data:image/svg+xml;charset=utf-8,';
  expect(src.startsWith(prefix)).toBe(true);
  return decodeURIComponent(src.slice(prefix.length));
}

describe('renderChart colors', () => {
  it('bar multi-series uses series.color fills', () => {
    const series: ChartSeries[] = [
      {
        name: 'S1',
        color: '#e11d48',
        data: [
          { label: 'A', value: 3 },
          { label: 'B', value: 5 },
        ],
      },
      {
        name: 'S2',
        color: '#2563eb',
        data: [
          { label: 'A', value: 2 },
          { label: 'B', value: 4 },
        ],
      },
    ];
    const img = renderChart('bar', series, { width: 400, height: 240 }, i18n);
    const svg = svgFromChartImg(img);
    expect(svg).toContain('fill="#e11d48"');
    expect(svg).toContain('fill="#2563eb"');
    // Series bars use palette; theme accent may still appear on arrow markers.
    expect(svg).toMatch(/<rect[^>]+fill="#e11d48"/);
    expect(svg).toMatch(/<rect[^>]+fill="#2563eb"/);
  });

  it('pie uses point.color fills', () => {
    const series: ChartSeries[] = [
      {
        name: 'P',
        data: [
          { label: 'Dogs', value: 10, color: '#f59e0b' },
          { label: 'Cats', value: 5, color: '#10b981' },
        ],
      },
    ];
    const img = renderChart('pie', series, { width: 320, height: 240 }, i18n);
    const svg = svgFromChartImg(img);
    expect(svg).toContain('fill="#f59e0b"');
    expect(svg).toContain('fill="#10b981"');
  });

  it('doughnut keeps ring geometry and point colors', () => {
    const series: ChartSeries[] = [
      {
        name: 'P',
        data: [
          { label: 'A', value: 1, color: '#dc2626' },
          { label: 'B', value: 1, color: '#16a34a' },
        ],
      },
    ];
    const img = renderChart('doughnut', series, { width: 320, height: 240 }, i18n);
    const svg = svgFromChartImg(img);
    expect(svg).toContain('fill="#dc2626"');
    expect(svg).toContain('fill="#16a34a"');
    expect(svg).toMatch(/A[\d.]+,[\d.]+ 0 [01] 0/);
  });

  it('bar single-series uses point.color per bar (not series.color)', () => {
    const series: ChartSeries[] = [
      {
        name: 'Series 1',
        color: '#ec4899',
        data: [
          { label: 'Jan', value: 120, color: '#06b6d4' },
          { label: 'Feb', value: 90, color: '#6366f1' },
          { label: 'Mar', value: 150, color: '#ef4444' },
        ],
      },
    ];
    const img = renderChart('bar', series, { width: 400, height: 240, title: 'Sales' }, i18n);
    const svg = svgFromChartImg(img);
    expect(svg).toContain('fill="#06b6d4"');
    expect(svg).toContain('fill="#6366f1"');
    expect(svg).toContain('fill="#ef4444"');
    expect(svg).not.toMatch(/<rect[^>]+fill="#ec4899"/);
  });

  it('options.colors overrides series colors', () => {
    const series: ChartSeries[] = [
      {
        name: 'S1',
        color: '#111111',
        data: [
          { label: 'A', value: 3 },
          { label: 'B', value: 5 },
        ],
      },
    ];
    const img = renderChart('bar', series, { width: 400, height: 240, colors: ['#a855f7'] }, i18n);
    const svg = svgFromChartImg(img);
    expect(svg).toContain('fill="#a855f7"');
    expect(svg).not.toContain('fill="#111111"');
  });
});
