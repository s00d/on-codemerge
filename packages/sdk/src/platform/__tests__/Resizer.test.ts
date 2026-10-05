import { afterEach, describe, expect, it, vi } from 'vitest';

import { Resizer } from '../Resizer';

function setBox(el: HTMLElement, width: number, height: number): void {
  Object.defineProperty(el, 'offsetWidth', { configurable: true, get: () => width });
  Object.defineProperty(el, 'offsetHeight', { configurable: true, get: () => height });
  el.style.width = `${width}px`;
  el.style.height = `${height}px`;
}

function pointer(
  type: string,
  target: EventTarget,
  init: Partial<PointerEventInit> & { clientX: number; clientY: number }
): void {
  const event = new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    pointerId: 1,
    pointerType: 'mouse',
    button: 0,
    buttons: type === 'pointerup' ? 0 : 1,
    ...init,
  });
  target.dispatchEvent(event);
}

describe('resizer', () => {
  let host: HTMLElement;
  let resizer: Resizer | null = null;

  afterEach(() => {
    resizer?.destroy();
    resizer = null;
    host?.remove();
    document.documentElement.classList.remove('ocm-resizing');
    document.documentElement.style.removeProperty('cursor');
  });

  function mount(opts: ConstructorParameters<typeof Resizer>[1] = {}): Resizer {
    host = document.createElement('div');
    setBox(host, 200, 100);
    document.body.append(host);
    resizer = new Resizer(host, opts);
    return resizer;
  }

  it('mounts frame + 8 handles (corners + edges) + badge', () => {
    mount();
    expect(host.querySelector('.ocm-resize-frame')).toBeTruthy();
    expect(host.querySelectorAll('.ocm-resize-handle')).toHaveLength(8);
    for (const handle of ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']) {
      expect(host.querySelector(`.ocm-resize-handle--${handle}`)).toBeTruthy();
    }
    expect(host.querySelector('.ocm-resize-badge')).toBeTruthy();
    expect(host.classList.contains('ocm-resize--selected')).toBe(true);
  });

  it('pointer drag on E edge updates width only', () => {
    const onResize = vi.fn();
    mount({ aspect: 'free', onResize });

    Object.defineProperty(host, 'offsetWidth', {
      configurable: true,
      get: () => Math.trunc(Number(host.style.width)) || 200,
    });
    Object.defineProperty(host, 'offsetHeight', {
      configurable: true,
      get: () => Math.trunc(Number(host.style.height)) || 100,
    });

    const handle = host.querySelector('.ocm-resize-handle--e') as HTMLElement;
    pointer('pointerdown', handle, { clientX: 200, clientY: 50 });
    pointer('pointermove', document, { clientX: 280, clientY: 80 });
    expect(host.style.width).toBe('280px');
    expect(host.style.height).toBe('100px');
    pointer('pointerup', document, { clientX: 280, clientY: 80 });
  });

  it('forces overflow visible while selected so edge handles are not clipped', () => {
    host = document.createElement('div');
    setBox(host, 200, 100);
    host.style.overflow = 'hidden';
    document.body.append(host);
    resizer = new Resizer(host);
    expect(host.style.overflow).toBe('visible');
    expect(host.classList.contains('ocm-resize--selected')).toBe(true);
    resizer.destroy();
    resizer = null;
    expect(host.style.overflow).toBe('hidden');
  });

  it('pointer drag on SE updates size and shows live badge', () => {
    const onResize = vi.fn();
    const onResizeEnd = vi.fn();
    mount({ aspect: 'free', onResize, onResizeEnd });

    const handle = host.querySelector('.ocm-resize-handle--se') as HTMLElement;
    pointer('pointerdown', handle, { clientX: 200, clientY: 100 });
    expect(document.documentElement.classList.contains('ocm-resizing')).toBe(true);
    expect(host.classList.contains('ocm-resize--active')).toBe(true);

    const badge = host.querySelector('.ocm-resize-badge') as HTMLElement;
    expect(badge.hidden).toBe(false);
    expect(badge.textContent).toBe('200 × 100');

    // Simulate growing box as style is applied
    Object.defineProperty(host, 'offsetWidth', {
      configurable: true,
      get: () => Math.trunc(Number(host.style.width)) || 200,
    });
    Object.defineProperty(host, 'offsetHeight', {
      configurable: true,
      get: () => Math.trunc(Number(host.style.height)) || 100,
    });

    pointer('pointermove', document, { clientX: 260, clientY: 140 });
    expect(host.style.width).toBe('260px');
    expect(host.style.height).toBe('140px');
    expect(badge.textContent).toBe('260 × 140');
    expect(onResize).toHaveBeenCalledWith(260, 140, expect.any(PointerEvent));

    pointer('pointerup', document, { clientX: 260, clientY: 140 });
    expect(document.documentElement.classList.contains('ocm-resizing')).toBe(false);
    expect(badge.hidden).toBe(true);
    expect(onResizeEnd).toHaveBeenCalledWith(260, 140);
  });

  it('escape during drag restores start size and fires onCancel + onBlur', () => {
    const onCancel = vi.fn();
    const onBlur = vi.fn();
    const onResizeEnd = vi.fn();
    mount({ aspect: 'free', onCancel, onBlur, onResizeEnd });

    const handle = host.querySelector('.ocm-resize-handle--se') as HTMLElement;
    pointer('pointerdown', handle, { clientX: 200, clientY: 100 });
    pointer('pointermove', document, { clientX: 300, clientY: 200 });
    expect(host.style.width).toBe('300px');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(host.style.width).toBe('200px');
    expect(host.style.height).toBe('100px');
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(onResizeEnd).not.toHaveBeenCalled();
    expect(document.documentElement.classList.contains('ocm-resizing')).toBe(false);
  });

  it('outside pointerdown fires onBlur', () => {
    const onBlur = vi.fn();
    mount({ onBlur });

    const outside = document.createElement('div');
    document.body.append(outside);
    pointer('pointerdown', outside, { clientX: 0, clientY: 0 });
    expect(onBlur).toHaveBeenCalledTimes(1);
    outside.remove();
  });

  it('aspect lock keeps ratio on SE drag', () => {
    mount({ aspect: 'lock' });
    const handle = host.querySelector('.ocm-resize-handle--se') as HTMLElement;
    pointer('pointerdown', handle, { clientX: 200, clientY: 100 });
    // Dominant dx: width 300 → height 150 (ratio 2)
    pointer('pointermove', document, { clientX: 300, clientY: 110 });
    expect(host.style.width).toBe('300px');
    expect(host.style.height).toBe('150px');
    pointer('pointerup', document, { clientX: 300, clientY: 110 });
  });

  it('destroy removes chrome and listeners', () => {
    const onBlur = vi.fn();
    const r = mount({ onBlur });
    r.destroy();
    resizer = null;
    expect(host.querySelector('.ocm-resize-frame')).toBeNull();
    expect(host.classList.contains('ocm-resize--selected')).toBe(false);

    const outside = document.createElement('div');
    document.body.append(outside);
    pointer('pointerdown', outside, { clientX: 0, clientY: 0 });
    expect(onBlur).not.toHaveBeenCalled();
    outside.remove();
  });
});
