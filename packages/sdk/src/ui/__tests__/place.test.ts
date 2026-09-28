import { describe, expect, it } from 'vitest';
import { applyPlaceRoot, applyPlaceSubmenu, placeRoot, placeSubmenu } from '../place';

describe('placeRoot', () => {
  const size = { width: 100, height: 40 };
  const viewport = { width: 400, height: 300 };

  it('places below start for a click point by default', () => {
    const r = placeRoot(size, { x: 10, y: 20 }, viewport);
    expect(r.vertical).toBe('below');
    expect(r.horizontal).toBe('start');
    expect(r.top).toBe(20);
    expect(r.left).toBe(10);
  });

  it('flips above when below overflows and above fits', () => {
    const r = placeRoot(size, { x: 10, y: 280 }, viewport);
    expect(r.vertical).toBe('above');
    expect(r.top).toBe(280 - size.height);
  });

  it('honors prefer above and flips below when above overflows', () => {
    const r = placeRoot(size, { x: 10, y: 5 }, viewport, { prefer: 'above' });
    expect(r.vertical).toBe('below');
    // pad clamp (default 8) when y is near the top edge
    expect(r.top).toBe(8);
  });

  it('uses DOMRect bottom/top anchors and flips horizontal end', () => {
    const r = placeRoot(
      size,
      { left: 350, top: 10, right: 380, bottom: 30, width: 30, height: 20 },
      viewport
    );
    expect(r.vertical).toBe('below');
    expect(r.horizontal).toBe('end');
    expect(r.left).toBeLessThanOrEqual(viewport.width - size.width - 8);
  });

  it('clamps into padded viewport', () => {
    const r = placeRoot(size, { x: -50, y: -50 }, viewport, { pad: 4 });
    expect(r.left).toBe(4);
    expect(r.top).toBe(4);
  });
});

describe('placeSubmenu', () => {
  const size = { width: 80, height: 60 };
  const viewport = { width: 400, height: 300 };
  const trigger = { left: 100, top: 50, right: 140, bottom: 70, width: 40, height: 20 };

  it('opens to the right when space allows', () => {
    const r = placeSubmenu(size, trigger, viewport);
    expect(r.side).toBe('right');
    expect(r.top).toBeGreaterThanOrEqual(-20);
  });

  it('opens to the left when right overflows', () => {
    const tight = { left: 350, top: 50, right: 390, bottom: 70, width: 40, height: 20 };
    const r = placeSubmenu(size, tight, viewport);
    expect(r.side).toBe('left');
  });

  it('shifts top when submenu would overflow bottom', () => {
    const low = { left: 100, top: 270, right: 140, bottom: 290, width: 40, height: 20 };
    const r = placeSubmenu(size, low, viewport);
    expect(r.top).toBeLessThan(0);
  });

  it('lifts top when submenu would overflow the top pad', () => {
    const high = { left: 100, top: 0, right: 140, bottom: 20, width: 40, height: 20 };
    const r = placeSubmenu({ width: 80, height: 200 }, high, viewport, { pad: 8 });
    expect(r.top).toBe(8 - high.top);
  });
});

describe('applyPlace*', () => {
  it('applyPlaceRoot writes left/top on a fixed element', () => {
    const el = document.createElement('div');
    Object.defineProperty(el, 'offsetWidth', { value: 100 });
    Object.defineProperty(el, 'offsetHeight', { value: 40 });
    document.body.append(el);
    const r = applyPlaceRoot(el, { x: 20, y: 30 });
    expect(el.style.left).toBe(`${Math.round(r.left)}px`);
    expect(el.style.top).toBe(`${Math.round(r.top)}px`);
    el.remove();
  });

  it('applyPlaceSubmenu writes right-side styles by default', () => {
    const wrap = document.createElement('div');
    wrap.style.position = 'relative';
    const trigger = document.createElement('button');
    const panel = document.createElement('div');
    Object.defineProperty(panel, 'offsetWidth', { value: 80 });
    Object.defineProperty(panel, 'offsetHeight', { value: 60 });
    wrap.append(trigger, panel);
    document.body.append(wrap);
    trigger.getBoundingClientRect = () =>
      ({
        left: 40,
        top: 40,
        right: 80,
        bottom: 60,
        width: 40,
        height: 20,
        x: 40,
        y: 40,
        toJSON: () => ({}),
      }) as DOMRect;
    const right = applyPlaceSubmenu(panel, trigger);
    expect(right.side).toBe('right');
    expect(panel.style.left).toContain('100%');
    expect(panel.style.right).toBe('auto');
    wrap.remove();
  });
});
