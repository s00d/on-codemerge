import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clearPortalRoot, getPortalRoot, setPortalRoot, teleport, isTeleport } from '../ui/portal';
import { ContextMenuService } from '../ui/context-menu';
import { NotifyService } from '../ui/notify';
import { h } from '../ui/view';

describe('portal roots', () => {
  beforeEach(() => {
    clearPortalRoot(undefined, true);
  });

  afterEach(() => {
    clearPortalRoot(undefined, true);
  });

  it('creates named roots under body', () => {
    expect.hasAssertions();
    const menu = getPortalRoot('menu');
    const popup = getPortalRoot('popup');
    expect(menu.dataset.ocmPortal).toBe('menu');
    expect(popup.dataset.ocmPortal).toBe('popup');
    expect(document.body.contains(menu)).toBe(true);
    expect(getPortalRoot('menu')).toBe(menu);
  });

  it('accepts custom HTMLElement targets and setPortalRoot', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    expect(getPortalRoot(host)).toBe(host);
    setPortalRoot('notify', host);
    expect(getPortalRoot('notify')).toBe(host);
    expect(host.classList.contains('ocm-portal--notify')).toBe(true);
    host.remove();
  });

  it('builds teleport specs', () => {
    expect.hasAssertions();
    const a = teleport('popup', h('div', null, 'x'));
    expect(isTeleport(a)).toBe(true);
    expect(a.to).toBe('popup');
    const b = teleport({ to: 'body', className: 'wrap' }, h('span'), h('span'));
    expect(b.className).toBe('wrap');
    expect(Array.isArray(b.children)).toBe(true);
  });
});

describe('contextMenuService', () => {
  let portal: HTMLElement;
  let menu: ContextMenuService;

  beforeEach(() => {
    clearPortalRoot(undefined, true);
    portal = document.createElement('div');
    document.body.append(portal);
    menu = new ContextMenuService(undefined, portal);
  });

  afterEach(() => {
    menu.destroy();
    portal.remove();
    clearPortalRoot(undefined, true);
  });

  it('opens fixed menu at click coords and hides', () => {
    expect.hasAssertions();
    menu.open(
      [
        { label: 'One', onClick: () => {} },
        { type: 'divider' },
        { label: 'Two', onClick: () => {} },
      ],
      40,
      60
    );
    const el = portal.querySelector('.ocm-context-menu') as HTMLElement | null;
    expect(el).toBeTruthy();
    expect(el!.style.position).toBe('fixed');
    expect(el!.style.left).toBe('40px');
    expect(el!.style.top).toBe('60px');
    menu.hide();
    expect(portal.querySelector('.ocm-context-menu')).toBeNull();
  });

  it('opens nested flyout and flattens group titles', () => {
    expect.hasAssertions();
    let clicked = 0;
    menu.open(
      [
        {
          label: 'Parent',
          subMenu: [
            {
              label: 'Child',
              onClick: () => {
                clicked += 1;
              },
            },
            { type: 'divider' },
          ],
        },
        { type: 'group', groupTitle: 'G', subMenu: [{ label: 'Flat', onClick: () => {} }] },
      ],
      10,
      20
    );
    expect(portal.querySelector('.ocm-menu-subwrap')).toBeTruthy();
    expect(portal.textContent).toContain('Parent');
    expect(portal.textContent).toContain('G');
    expect(portal.textContent).toContain('Flat');
    const child = [...portal.querySelectorAll('button')].find((b) => b.textContent === 'Child');
    child?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(clicked).toBe(1);
    menu.hide();
  });
});

describe('notifyService', () => {
  afterEach(() => {
    clearPortalRoot(undefined, true);
  });

  it('shows and dismisses toast', () => {
    expect.hasAssertions();
    const notify = new NotifyService();
    notify.show({ message: 'Hi', type: 'success', duration: 0 });
    const toast = document.querySelector('.ocm-notify');
    expect(toast).toBeTruthy();
    expect(toast!.textContent).toContain('Hi');
    notify.destroy();
    expect(document.querySelector('.ocm-notify')).toBeNull();
  });
});
