/**
 * @jest-environment jsdom
 */
import { afterEach, describe, expect, it } from 'vitest';
import { clearPortalRoot, foreign, h, mount, teleport, viewToHtml } from '../index';

describe('@codemerge/view', () => {
  afterEach(() => {
    clearPortalRoot(undefined, true);
    document.body.replaceChildren();
  });

  it('mounts and updates a simple tree', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const handle = mount(host, h('button', { attrs: { type: 'button' } }, 'Go'));
    expect(host.querySelector('button')?.textContent).toBe('Go');
    handle.update(h('button', { attrs: { type: 'button' } }, 'Next'));
    expect(host.querySelector('button')?.textContent).toBe('Next');
    handle.destroy();
    expect(host.childNodes).toHaveLength(0);
  });

  it('foreign dispose runs on destroy', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    let disposed = false;
    const handle = mount(host, {
      foreign: (_el, scope) => {
        scope.disposable(() => {
          disposed = true;
        });
      },
    });
    handle.destroy();
    expect(disposed).toBe(true);
  });

  it('teleport mounts into a named portal root', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const handle = mount(host, teleport('popup', h('div', { class: 'modal' }, 'Hi')));
    const portal = document.querySelector('[data-ocm-portal="popup"] .modal');
    expect(portal?.textContent).toBe('Hi');
    handle.destroy();
  });

  it('viewToHtml serializes a detached tree', () => {
    expect.hasAssertions();
    const html = viewToHtml(h('p', { class: 'x' }, 'hello'));
    expect(html).toContain('hello');
    expect(html).toContain('class="x"');
  });

  it('keeps the same DOM node when the key is unchanged', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const handle = mount(host, h('button', { key: 'go', attrs: { type: 'button' } }, 'Go'));
    const first = host.querySelector('button');
    handle.update(h('button', { key: 'go', attrs: { type: 'button' } }, 'Next'));
    const second = host.querySelector('button');
    expect(first?.isSameNode(second ?? null)).toBe(true);
    expect(second?.textContent).toBe('Next');
    handle.destroy();
  });

  it('does not remount foreign when the key is unchanged', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    let mounts = 0;
    let disposed = 0;
    const spec = (label: string) =>
      foreign(
        (_el, scope) => {
          mounts += 1;
          scope.disposable(() => {
            disposed += 1;
          });
        },
        { key: 'box', class: label }
      );
    const handle = mount(host, spec('a'));
    handle.update(spec('b'));
    expect(mounts).toBe(1);
    expect(disposed).toBe(0);
    handle.destroy();
    expect(disposed).toBe(1);
  });

  it('disposes foreign when the key changes', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    let disposed = 0;
    const spec = (key: string) =>
      foreign(
        (_el, scope) => {
          scope.disposable(() => {
            disposed += 1;
          });
        },
        { key }
      );
    const handle = mount(host, spec('a'));
    handle.update(spec('b'));
    expect(disposed).toBe(1);
    handle.destroy();
    expect(disposed).toBe(2);
  });
});
