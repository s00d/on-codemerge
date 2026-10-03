import { describe, expect, it } from 'vitest';
import { detectDiagramType, parse } from '@codemerge/mermaid';
import { toMermaidSource } from '../drivers/toMermaidSource';
import type { ChartSeries } from '../types';

const sample: ChartSeries[] = [
  {
    name: 'S1',
    data: [
      { label: 'A', value: 3 },
      { label: 'B', value: 5 },
    ],
  },
];

const multi: ChartSeries[] = [
  {
    name: 'S1',
    data: [
      { label: 'A', value: 3 },
      { label: 'B', value: 5 },
    ],
  },
  {
    name: 'S2',
    data: [
      { label: 'A', value: 1 },
      { label: 'B', value: 2 },
    ],
  },
];

describe('toMermaidSource', () => {
  it('emits parseable xychart for bar', () => {
    const src = toMermaidSource('bar', sample, { width: 400, height: 240, title: 'T' });
    expect(detectDiagramType(src)).toBe('xychart');
    const r = parse(src);
    expect(r.ir?.type).toBe('xychart');
  });

  it('emits line and area series kinds', () => {
    const line = toMermaidSource('line', sample, { width: 400, height: 240 });
    expect(line).toContain('line "S1"');
    expect(detectDiagramType(line)).toBe('xychart');
    const area = toMermaidSource('area', sample, { width: 400, height: 240 });
    expect(area).toContain('area "S1"');
    expect(detectDiagramType(area)).toBe('xychart');
  });

  it('emits stacked bar cumulative values and yAxis label', () => {
    const src = toMermaidSource('bar', multi, {
      width: 400,
      height: 240,
      mode: 'stacked',
      yAxis: { title: 'Sales' },
    });
    expect(src).toContain('y-axis "Sales" 0 --> 7');
    expect(src).toContain('bar "S1" [3, 5]');
    expect(src).toContain('bar "S2" [4, 7]');
    const r = parse(src);
    expect(r.ir?.type).toBe('xychart');
  });

  it('emits pie showData without title when omitted', () => {
    const src = toMermaidSource('pie', sample, { width: 400, height: 240 });
    expect(src.startsWith('pie showData\n')).toBe(true);
    expect(src).not.toContain('title');
    expect(src).toContain('"A" : 3');
  });

  it('emits pie showData donut for doughnut', () => {
    const src = toMermaidSource('doughnut', sample, { width: 400, height: 240 });
    expect(src.startsWith('pie showData donut')).toBe(true);
    expect(detectDiagramType(src)).toBe('pie');
  });

  it('emits radar-beta for radar with multi-series curves', () => {
    const src = toMermaidSource('radar', multi, { width: 400, height: 240, title: 'R' });
    expect(detectDiagramType(src)).toBe('radar');
    expect(src).toContain('title R');
    expect(src).toContain('curve s0["S1"]');
    expect(src).toContain('curve s1["S2"]');
  });
});
