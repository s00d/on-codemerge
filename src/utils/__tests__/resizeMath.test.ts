import { describe, expect, it } from 'vitest';
import { computeResize, effectiveAspectLock } from '../resizeMath';

const bounds = { minWidth: 50, minHeight: 50, maxWidth: 800, maxHeight: 600 };

describe('computeResize', () => {
  it('se grows with positive delta when free', () => {
    expect.hasAssertions();
    const r = computeResize({
      corner: 'se',
      start: { width: 200, height: 100 },
      delta: { dx: 40, dy: 20 },
      bounds,
      aspectLock: false,
    });
    expect(r).toEqual({ width: 240, height: 120 });
  });

  it('nw shrinks with positive delta when free', () => {
    expect.hasAssertions();
    const r = computeResize({
      corner: 'nw',
      start: { width: 200, height: 100 },
      delta: { dx: 20, dy: 10 },
      bounds,
      aspectLock: false,
    });
    expect(r).toEqual({ width: 180, height: 90 });
  });

  it('sw and ne flip one axis', () => {
    expect.hasAssertions();
    const sw = computeResize({
      corner: 'sw',
      start: { width: 200, height: 100 },
      delta: { dx: 20, dy: 20 },
      bounds,
      aspectLock: false,
    });
    expect(sw).toEqual({ width: 180, height: 120 });

    const ne = computeResize({
      corner: 'ne',
      start: { width: 200, height: 100 },
      delta: { dx: 20, dy: 20 },
      bounds,
      aspectLock: false,
    });
    expect(ne).toEqual({ width: 220, height: 80 });
  });

  it('locks aspect ratio from start size', () => {
    expect.hasAssertions();
    const r = computeResize({
      corner: 'se',
      start: { width: 200, height: 100 },
      delta: { dx: 50, dy: 0 },
      bounds,
      aspectLock: true,
    });
    expect(r.width / r.height).toBeCloseTo(2, 1);
    expect(r.width).toBe(250);
    expect(r.height).toBe(125);
  });

  it('respects min bounds', () => {
    expect.hasAssertions();
    const r = computeResize({
      corner: 'se',
      start: { width: 200, height: 100 },
      delta: { dx: -400, dy: -400 },
      bounds,
      aspectLock: false,
    });
    expect(r.width).toBe(50);
    expect(r.height).toBe(50);
  });

  it('respects max bounds', () => {
    expect.hasAssertions();
    const r = computeResize({
      corner: 'se',
      start: { width: 200, height: 100 },
      delta: { dx: 5000, dy: 5000 },
      bounds,
      aspectLock: false,
    });
    expect(r.width).toBe(800);
    expect(r.height).toBe(600);
  });

  it('e/w edges change width only; n/s change height only', () => {
    expect.hasAssertions();
    expect(
      computeResize({
        corner: 'e',
        start: { width: 200, height: 100 },
        delta: { dx: 40, dy: 99 },
        bounds,
        aspectLock: false,
      })
    ).toEqual({ width: 240, height: 100 });
    expect(
      computeResize({
        corner: 's',
        start: { width: 200, height: 100 },
        delta: { dx: 99, dy: 30 },
        bounds,
        aspectLock: false,
      })
    ).toEqual({ width: 200, height: 130 });
  });

  it('edge drag with aspect lock scales the other axis', () => {
    expect.hasAssertions();
    const r = computeResize({
      corner: 'e',
      start: { width: 200, height: 100 },
      delta: { dx: 50, dy: 0 },
      bounds,
      aspectLock: true,
    });
    expect(r).toEqual({ width: 250, height: 125 });
  });
});

describe('effectiveAspectLock', () => {
  it('lock default unlocks with Shift', () => {
    expect.hasAssertions();
    expect(effectiveAspectLock('lock', false)).toBe(true);
    expect(effectiveAspectLock('lock', true)).toBe(false);
  });

  it('free default locks with Shift', () => {
    expect.hasAssertions();
    expect(effectiveAspectLock('free', false)).toBe(false);
    expect(effectiveAspectLock('free', true)).toBe(true);
  });
});
