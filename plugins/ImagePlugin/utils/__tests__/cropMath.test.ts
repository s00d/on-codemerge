import { describe, expect, it } from 'vitest';
import { applyAspectPreset, clampCrop, fitScale, fullFrame, aspectRatioOf } from '../cropMath';

describe('cropMath', () => {
  it('fullFrame and fitScale', () => {
    expect(fullFrame(100, 50)).toStrictEqual({ x: 0, y: 0, w: 100, h: 50 });
    expect(fitScale(200, 100, 100, 100)).toBeCloseTo(0.5);
    expect(fitScale(50, 50, 100, 100)).toBe(1);
  });

  it('clampCrop keeps rect inside bounds', () => {
    const c = clampCrop({ x: -10, y: -5, w: 1000, h: 1000 }, 100, 80, null);
    expect(c.x).toBe(0);
    expect(c.y).toBe(0);
    expect(c.w).toBeLessThanOrEqual(100);
    expect(c.h).toBeLessThanOrEqual(80);
  });

  it('clampCrop locks aspect', () => {
    const c = clampCrop({ x: 0, y: 0, w: 100, h: 10 }, 100, 100, 1);
    expect(c.w).toBeCloseTo(c.h, 5);
  });

  it('applyAspectPreset centers ratio', () => {
    expect(aspectRatioOf('16:9')).toBeCloseTo(16 / 9);
    const c = applyAspectPreset(1600, 900, '1:1');
    expect(c.w).toBeCloseTo(c.h, 5);
    expect(c.x + c.w).toBeLessThanOrEqual(1600 + 0.01);
    expect(c.y + c.h).toBeLessThanOrEqual(900 + 0.01);
  });
});
