import { describe, expect, it } from 'vitest';
import {
  hexToHsv,
  hsvToHex,
  hexToRgb,
  rgbToHex,
  neutrals,
  quickSwatches,
  hueStrip,
  cssColorToHex,
} from '../colorMath';

describe('utils/colorMath hsv', () => {
  it('round-trips hex through hsv', () => {
    expect.hasAssertions();
    for (const hex of [
      '#000000',
      '#ffffff',
      '#ff0000',
      '#00ff00',
      '#0000ff',
      '#808080',
      '#ffa500',
    ]) {
      const hsv = hexToHsv(hex);
      expect(hsv).toBeTruthy();
      const back = hsvToHex(hsv!.h, hsv!.s, hsv!.v);
      const a = hexToRgb(hex)!;
      const b = hexToRgb(back)!;
      expect(Math.abs(a.r - b.r)).toBeLessThanOrEqual(1);
      expect(Math.abs(a.g - b.g)).toBeLessThanOrEqual(1);
      expect(Math.abs(a.b - b.b)).toBeLessThanOrEqual(1);
    }
  });

  it('parses short hex', () => {
    expect.hasAssertions();
    expect(rgbToHex(hexToRgb('#f00')!)).toBe('#ff0000');
  });

  it('rejects garbage', () => {
    expect.hasAssertions();
    expect(hexToRgb('nope')).toBeNull();
    expect(hexToHsv('#gg0000')).toBeNull();
  });

  it('normalizes css rgb to hex', () => {
    expect.hasAssertions();
    expect(cssColorToHex('rgb(255, 0, 0)')).toBe('#ff0000');
    expect(cssColorToHex('#0f0')).toBe('#00ff00');
  });
});

describe('utils/colorMath generate', () => {
  it('builds neutrals and hue swatches without storage', () => {
    expect.hasAssertions();
    const n = neutrals(5);
    expect(n).toHaveLength(5);
    expect(n[0]).toBe('#ffffff');
    expect(n.at(-1)).toBe('#000000');
    const q = quickSwatches(120, 8);
    expect(q).toHaveLength(8);
    expect(q.every((c) => /^#[0-9a-f]{6}$/i.test(c))).toBe(true);
    expect(hueStrip(6)).toHaveLength(6);
  });
});
