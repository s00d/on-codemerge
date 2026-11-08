import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PopupService } from '../ui/popup';
import { clearPortalRoot, getPortalRoot } from '@codemerge/view';
import { createPortal, h, mount, teleport } from '@codemerge/view';

describe('popupService ViewSpec', () => {
  let portal: HTMLElement;
  let popup: PopupService;

  beforeEach(() => {
    clearPortalRoot(undefined, true);
    portal = document.createElement('div');
    document.body.append(portal);
    popup = new PopupService(undefined, portal);
  });

  afterEach(() => {
    popup.destroy();
    portal.remove();
    clearPortalRoot(undefined, true);
  });

  it('opens chrome with title and input, closes on hide', () => {
    expect.hasAssertions();
    const handle = popup.open({
      title: 'Test',
      items: [{ type: 'input', id: 'name', label: 'Name', value: 'a' }],
      buttons: [{ label: 'Ok', variant: 'primary', onClick: () => {} }],
    });
    expect(portal.querySelector('.ocm-popup-overlay')).toBeTruthy();
    expect(portal.querySelector('.ocm-popup__header')?.textContent).toContain('Test');
    const input = portal.querySelector('#name') as HTMLInputElement | null;
    expect(input?.value).toBe('a');
    handle.hide();
    expect(portal.querySelector('.ocm-popup')).toBeNull();
  });

  it('stale handle update reopens once, then re-binds to the new popup', () => {
    expect.hasAssertions();
    const stale = popup.open({ title: 'A', items: [] });
    popup.open({ title: 'B', items: [] });
    stale.update({ title: 'C', items: [{ type: 'input', id: 'n', value: 'c' }] });
    const overlay = portal.querySelector('.ocm-popup-overlay');
    expect(stale.getValues()).toStrictEqual({ n: 'c' });
    stale.update({ title: 'D', items: [{ type: 'input', id: 'n', value: 'd' }] });
    // Patched in place — same overlay node, not a fresh open.
    expect(portal.querySelector('.ocm-popup-overlay')).toBe(overlay);
    expect(portal.querySelector('.ocm-popup__header')?.textContent).toContain('D');
    stale.hide();
    expect(portal.querySelector('.ocm-popup')).toBeNull();
  });

  it('password item renders input type=password', () => {
    expect.hasAssertions();
    popup.open({ items: [{ type: 'password', id: 'key', value: 's' }] });
    expect(portal.querySelector('#key')?.getAttribute('type')).toBe('password');
  });

  it('closes on overlay pointerdown', () => {
    expect.hasAssertions();
    popup.open({ title: 'Overlay', items: [] });
    const overlay = portal.querySelector('.ocm-popup-overlay');
    expect(overlay).toBeTruthy();
    overlay?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(portal.querySelector('.ocm-popup')).toBeNull();
  });

  it('closes on Escape', () => {
    expect.hasAssertions();
    popup.open({ title: 'Esc', items: [] });
    expect(portal.querySelector('.ocm-popup')).toBeTruthy();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(portal.querySelector('.ocm-popup')).toBeNull();
  });

  it('locks document scroll while open', () => {
    expect.hasAssertions();
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    popup.open({ title: 'Scroll', items: [] });
    expect(document.documentElement.style.overflow).toBe('hidden');
    expect(document.body.style.overflow).toBe('hidden');
    popup.hide();
    expect(document.documentElement.style.overflow).toBe('');
    expect(document.body.style.overflow).toBe('');
  });

  it('tracks input values', () => {
    expect.hasAssertions();
    const handle = popup.open({
      items: [{ type: 'input', id: 'x', value: '' }],
      buttons: [],
    });
    const input = portal.querySelector('#x') as HTMLInputElement;
    input.value = 'hello';
    input.dispatchEvent(new Event('input'));
    expect(handle.getValues().x).toBe('hello');
  });

  it('stale handle hide does not close a newer popup', () => {
    expect.hasAssertions();
    const first = popup.open({ title: 'First', items: [] });
    first.hide();
    expect(portal.querySelector('.ocm-popup')).toBeNull();

    const second = popup.open({ title: 'Second', items: [] });
    expect(portal.querySelector('.ocm-popup__header')?.textContent).toContain('Second');
    // Simulate OwnedSlot.replace teardown of the previous handle while second is active.
    first.hide();
    expect(portal.querySelector('.ocm-popup')).toBeTruthy();
    expect(portal.querySelector('.ocm-popup__header')?.textContent).toContain('Second');
    second.hide();
    expect(portal.querySelector('.ocm-popup')).toBeNull();
  });
});

describe('portal / teleport', () => {
  afterEach(() => {
    clearPortalRoot(undefined, true);
  });

  it('creates named roots under body', () => {
    expect.hasAssertions();
    const root = getPortalRoot('popup');
    expect(root.dataset.ocmPortal).toBe('popup');
    expect(document.body.contains(root)).toBe(true);
  });

  it('createPortal mounts into named target', () => {
    expect.hasAssertions();
    const p = createPortal(h('div', { class: 'x' }, 'hi'), { to: 'menu', className: 'host' });
    expect(getPortalRoot('menu').contains(p.el)).toBe(true);
    expect(p.el.textContent).toBe('hi');
    p.destroy();
    expect(getPortalRoot('menu').contains(p.el)).toBe(false);
  });

  it('teleport ViewSpec moves content out of local tree', () => {
    expect.hasAssertions();
    const local = document.createElement('div');
    document.body.append(local);
    const handle = mount(
      local,
      h('div', { class: 'wrap' }, [
        'local',
        teleport('body', h('div', { class: 'teleported' }, 'away')),
      ])
    );
    expect(local.querySelector('.teleported')).toBeNull();
    expect(getPortalRoot('body').querySelector('.teleported')?.textContent).toBe('away');
    handle.destroy();
    expect(getPortalRoot('body').querySelector('.teleported')).toBeNull();
    local.remove();
  });
});
