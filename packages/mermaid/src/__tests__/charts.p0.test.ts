import { describe, expect, it } from 'vitest';
import { parse, render } from '../index';

describe('P0 chart diagrams', () => {
  it('parses xychart bar/line values', () => {
    const r = parse(
      'xychart-beta\n  x-axis [jan, feb]\n  y-axis 0 --> 100\n  bar "A" [10, 20]\n  line [15, 25]'
    );
    expect(r.ir?.type).toBe('xychart');
    if (r.ir?.type !== 'xychart') {
      return;
    }
    expect(r.ir.categories).toStrictEqual(['jan', 'feb']);
    expect(r.ir.series).toHaveLength(2);
    expect(r.ir.series[0]?.values).toStrictEqual([10, 20]);
  });

  it('parses radar axes and curves', () => {
    const r = parse('radar-beta\n  axis a, b, c\n  curve c1{1, 2, 3}\n  max 10');
    expect(r.ir?.type).toBe('radar');
    if (r.ir?.type !== 'radar') {
      return;
    }
    expect(r.ir.axes).toHaveLength(3);
    expect(r.ir.curves[0]?.values).toStrictEqual([1, 2, 3]);
    expect(r.ir.max).toBe(10);
  });

  it('pie showData includes values in SVG text', () => {
    const svg = render('pie showData\n  title T\n  "Dogs" : 10\n  "Cats" : 5');
    expect(svg).toContain('Dogs 10');
    expect(svg).toContain('Cats 5');
  });

  it('pie donut uses ring path not center-wedge', () => {
    const full = render('pie\n  "A" : 1\n  "B" : 1');
    const donut = render('pie showData donut\n  "A" : 1\n  "B" : 1');
    expect(full).toContain(`M`);
    expect(donut).toMatch(/A[\d.]+,[\d.]+ 0 [01] 0/);
    expect(donut).not.toBe(full);
  });
});
