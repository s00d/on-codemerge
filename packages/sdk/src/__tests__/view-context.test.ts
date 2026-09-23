import { describe, expect, it } from 'vitest';
import { DisposableScope } from '../disposable';
import { mount, h } from '../ui/view';
import { createPluginContext } from '../context';
import { PopupController, PopupService } from '../ui/popup';
import type { EditorAPI } from '../types';

describe('viewSpec mount', () => {
  it('mounts element tree and binds click', () => {
    expect.hasAssertions();
    const root = document.createElement('div');
    let clicked = 0;
    const handle = mount(
      root,
      h(
        'div',
        {
          class: 'wrap',
          on: {
            click: () => {
              clicked += 1;
            },
          },
        },
        h('span', null, 'hi')
      )
    );
    expect(root.querySelector('.wrap span')?.textContent).toBe('hi');
    root.querySelector('.wrap')?.dispatchEvent(new MouseEvent('click'));
    expect(clicked).toBe(1);
    handle.destroy();
    expect(root.childNodes).toHaveLength(0);
  });

  it('supports foreign mount with scope cleanup', () => {
    expect.hasAssertions();
    const root = document.createElement('div');
    let cleaned = false;
    const handle = mount(root, {
      foreign: (host, scope) => {
        host.textContent = 'fx';
        scope.disposable(() => {
          cleaned = true;
        });
      },
    });
    expect(root.textContent).toBe('fx');
    handle.destroy();
    expect(cleaned).toBe(true);
  });
});

describe('disposableScope', () => {
  it('disposes LIFO', () => {
    expect.hasAssertions();
    const order: number[] = [];
    const scope = new DisposableScope();
    scope.disposable(() => order.push(1));
    scope.disposable(() => order.push(2));
    scope.dispose();
    expect(order).toStrictEqual([2, 1]);
    scope.dispose(); // idempotent
    expect(order).toStrictEqual([2, 1]);
  });
});

describe('pluginContext', () => {
  it('auto-unsubscribes on dispose', () => {
    expect.hasAssertions();
    let unsubCalled = false;
    const realEditor = {
      host: document.createElement('div'),
      on: () => () => {
        unsubCalled = true;
      },
      toolbar: { add: () => () => {}, remove: () => {}, refresh: () => {} },
      notify: () => {},
      ui: {
        menu: { open: () => {} },
        popup: {
          open: () => ({
            hide: () => {},
            getValues: () => ({}),
            update: () => {},
          }),
          hide: () => {},
        },
        notify: { show: () => {} },
        contextMenu: { open: () => {} },
      },
    } as unknown as EditorAPI;

    const ctx = createPluginContext({
      editor: realEditor,
      name: 'test',
      resolveTarget: () => document.createElement('div'),
    });
    ctx.on('docChanged', () => {});
    ctx.scope.dispose();
    expect(unsubCalled).toBe(true);
  });

  it('own() tears down destroyable resources', () => {
    expect.hasAssertions();
    const editor = {
      host: document.createElement('div'),
      on: () => () => {},
      toolbar: { add: () => () => {}, remove: () => {}, refresh: () => {} },
      notify: () => {},
      ui: {
        menu: { open: () => {} },
        popup: {
          open: () => ({
            hide: () => {},
            getValues: () => ({}),
            update: () => {},
          }),
          hide: () => {},
        },
        notify: { show: () => {} },
        contextMenu: { open: () => {} },
      },
    } as unknown as EditorAPI;

    const ctx = createPluginContext({
      editor,
      name: 'own-test',
      resolveTarget: () => document.createElement('div'),
    });
    let destroyed = false;
    ctx.own({
      destroy: () => {
        destroyed = true;
      },
    });
    ctx.scope.dispose();
    expect(destroyed).toBe(true);
  });

  it('slot() replaces and tears down previous Ownable', () => {
    expect.hasAssertions();
    const scope = new DisposableScope();
    const slot = scope.slot<{ destroy: () => void }>();
    const order: string[] = [];
    slot.replace({
      destroy: () => order.push('a'),
    });
    slot.replace({
      destroy: () => order.push('b'),
    });
    expect(order).toStrictEqual(['a']);
    scope.dispose();
    expect(order).toStrictEqual(['a', 'b']);
  });

  it('popupController auto-hides previous and on scope dispose', () => {
    expect.hasAssertions();
    const scope = new DisposableScope();
    const closed: string[] = [];
    let n = 0;
    const ctrl = new PopupController(() => {
      const id = `p${n++}`;
      return {
        hide: () => closed.push(id),
        getValues: () => ({}),
        update: () => {},
      };
    }, scope);
    ctrl.open({});
    ctrl.open({});
    expect(closed).toStrictEqual(['p0']);
    scope.dispose();
    expect(closed).toStrictEqual(['p0', 'p1']);
  });

  it('popupService stale handle hide does not kill newly opened popup', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const popup = new PopupService(undefined, host);
    const scope = new DisposableScope();
    const ctrl = new PopupController((o) => popup.open(o), scope);

    ctrl.open({ title: 'First' });
    expect(host.querySelector('.ocm-popup')).toBeTruthy();
    ctrl.close();
    expect(host.querySelector('.ocm-popup')).toBeNull();

    // Re-open: OwnedSlot.replace tears down the old handle via hide() —
    // that must not close the freshly opened dialog.
    ctrl.open({ title: 'Second' });
    expect(host.querySelector('.ocm-popup')).toBeTruthy();
    expect(host.querySelector('.ocm-popup')?.textContent).toContain('Second');

    scope.dispose();
    popup.destroy();
    host.remove();
  });
});
