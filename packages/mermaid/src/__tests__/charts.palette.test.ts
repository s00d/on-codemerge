import { describe, expect, it } from 'vitest';
import { render } from '../index';
import { DEFAULTS } from '../theme';

const PALETTE = ['#ff0000', '#00ff00', '#0000ff'];

describe('RenderOptions.palette', () => {
  it('uses custom palette fills for xychart series', () => {
    const svg = render(
      'xychart-beta\n  x-axis [a, b]\n  y-axis 0 --> 10\n  bar "A" [3, 5]\n  bar "B" [2, 4]',
      { palette: PALETTE }
    );
    expect(svg).toContain('fill="#ff0000"');
    expect(svg).toContain('fill="#00ff00"');
  });

  it('single-series bar uses per-category palette colors', () => {
    const svg = render('xychart-beta\n  x-axis [a, b, c]\n  y-axis 0 --> 10\n  bar [3, 5, 2]', {
      palette: PALETTE,
    });
    expect(svg).toMatch(/<rect[^>]+fill="#ff0000"/);
    expect(svg).toMatch(/<rect[^>]+fill="#00ff00"/);
    expect(svg).toMatch(/<rect[^>]+fill="#0000ff"/);
  });

  it('uses custom palette fills for pie slices', () => {
    const svg = render('pie showData\n  "Dogs" : 10\n  "Cats" : 5', { palette: PALETTE });
    expect(svg).toContain('fill="#ff0000"');
    expect(svg).toContain('fill="#00ff00"');
  });

  it('uses custom palette fills for radar curves', () => {
    const svg = render(
      'radar-beta\n  axis a, b, c\n  curve c1{1, 2, 3}\n  curve c2{3, 2, 1}\n  max 10',
      { palette: PALETTE }
    );
    expect(svg).toContain('fill="#ff0000"');
    expect(svg).toContain('fill="#00ff00"');
  });

  it('falls back to zinc theme palette without options.palette', () => {
    const svg = render('pie\n  "A" : 1\n  "B" : 1');
    expect(svg).toContain(`fill="${DEFAULTS.accent}"`);
    expect(svg).not.toContain('fill="#ff0000"');
  });
});
