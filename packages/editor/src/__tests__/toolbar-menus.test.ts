/**
 * @jest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import { definePlugin } from '@on-codemerge/sdk';
import { Editor } from '../Editor';
import type { ViewPort } from '../ViewPort';

function noopView(): ViewPort {
  return {
    update() {},
    destroy() {},
    contentTarget: () => new EventTarget(),
  };
}

describe('Editor toolbar.menus', () => {
  it('defaults register Insert / Review / Tools; plugin menu lands in dropdown', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const editor = new Editor(host, {
      createView: () => noopView(),
      plugins: [
        definePlugin({
          name: 'chart-demo',
          setup(ctx) {
            ctx.toolbar.add({
              id: 'chart',
              label: 'Chart',
              menu: 'insert',
              order: 1,
              onClick: () => {},
            });
          },
        }),
      ],
    });
    const bar = host.querySelector('.ocm-toolbar');
    expect(bar?.querySelector('[data-menu="insert"]')).not.toBeNull();
    expect(bar?.querySelector('[data-id="chart"]')).toBeNull();
    editor.destroy();
    host.remove();
  });

  it('menus: [] puts plugin menu buttons on the bar', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const editor = new Editor(host, {
      createView: () => noopView(),
      toolbar: { menus: [] },
      plugins: [
        definePlugin({
          name: 'chart-demo',
          setup(ctx) {
            ctx.toolbar.add({
              id: 'chart',
              label: 'Chart',
              menu: 'insert',
              order: 1,
              onClick: () => {},
            });
          },
        }),
      ],
    });
    const bar = host.querySelector('.ocm-toolbar');
    expect(bar?.querySelector('[data-menu="insert"]')).toBeNull();
    expect(bar?.querySelector('[data-id="chart"]')).not.toBeNull();
    editor.destroy();
    host.remove();
  });

  it('defineMenu still accepts custom menus after construct', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const editor = new Editor(host, {
      createView: () => noopView(),
      toolbar: { menus: [] },
    });
    editor.toolbar.defineMenu({ id: 'acme', label: 'Acme', group: 'tools', order: 70 });
    editor.toolbar.add({
      id: 'acme-x',
      label: 'X',
      menu: 'acme',
      order: 1,
      onClick: () => {},
    });
    const bar = host.querySelector('.ocm-toolbar');
    expect(bar?.querySelector('[data-menu="acme"]')).not.toBeNull();
    expect(bar?.querySelector('[data-id="acme-x"]')).toBeNull();
    editor.destroy();
    host.remove();
  });
});
