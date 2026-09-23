import { describe, expect, it } from 'vitest';
import { placeRoot, placeSubmenu } from '../ui/place';

describe('placeRoot', () => {
  const viewport = { width: 1000, height: 800 };
  const size = { width: 200, height: 120 };

  it('places below-start near a point when space allows', () => {
    expect.hasAssertions();
    const r = placeRoot(size, { x: 100, y: 100 }, viewport);
    expect(r.vertical).toBe('below');
    expect(r.horizontal).toBe('start');
    expect(r.left).toBe(100);
    expect(r.top).toBe(100);
  });

  it('flips above when below would overflow', () => {
    expect.hasAssertions();
    const r = placeRoot(size, { x: 100, y: 750 }, viewport);
    expect(r.vertical).toBe('above');
    expect(r.top).toBe(750 - 120);
  });

  it('flips to end when right would overflow', () => {
    expect.hasAssertions();
    const r = placeRoot(size, { x: 900, y: 100 }, viewport);
    expect(r.horizontal).toBe('end');
    expect(r.left).toBe(900 - 200);
  });

  it('clamps into pad when menu larger than remaining space', () => {
    expect.hasAssertions();
    const r = placeRoot(
      { width: 400, height: 300 },
      { x: 5, y: 5 },
      { width: 500, height: 400 },
      {
        pad: 8,
      }
    );
    expect(r.left).toBeGreaterThanOrEqual(8);
    expect(r.top).toBeGreaterThanOrEqual(8);
    expect(r.left + 400).toBeLessThanOrEqual(500 - 8);
  });

  it('uses rect bottom/top for DOMRect anchors', () => {
    expect.hasAssertions();
    const rect = { left: 50, top: 40, right: 150, bottom: 70, width: 100, height: 30 };
    const r = placeRoot(size, rect, viewport);
    expect(r.top).toBe(70);
    expect(r.left).toBe(50);
  });
});

describe('placeSubmenu', () => {
  const viewport = { width: 1000, height: 800 };
  const size = { width: 180, height: 200 };

  it('opens to the right when space allows', () => {
    expect.hasAssertions();
    const trigger = { left: 100, top: 100, right: 280, bottom: 132, width: 180, height: 32 };
    const r = placeSubmenu(size, trigger, viewport);
    expect(r.side).toBe('right');
    expect(r.top).toBe(0);
  });

  it('opens to the left near the right edge', () => {
    expect.hasAssertions();
    const trigger = { left: 820, top: 100, right: 980, bottom: 132, width: 160, height: 32 };
    const r = placeSubmenu(size, trigger, viewport);
    expect(r.side).toBe('left');
  });

  it('shifts up when bottom would overflow', () => {
    expect.hasAssertions();
    const trigger = { left: 100, top: 700, right: 280, bottom: 732, width: 180, height: 32 };
    const r = placeSubmenu(size, trigger, viewport);
    expect(r.side).toBe('right');
    expect(r.top).toBeLessThan(0);
    expect(700 + r.top + 200).toBeLessThanOrEqual(800 - 8);
  });
});
