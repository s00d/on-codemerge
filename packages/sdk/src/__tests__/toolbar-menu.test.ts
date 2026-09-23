import { afterEach, describe, expect, it } from 'vitest';
import { clearPortalRoot } from '../ui/portal';
import { ToolbarPanel } from '../ui/toolbar';

const waitTick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe('toolbarPanel menus', () => {
  afterEach(() => {
    clearPortalRoot(undefined, true);
  });

  it('defineMenu + menu: buttons open portal dropdown', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const commands: string[] = [];
    const bar = new ToolbarPanel(host, (name) => {
      commands.push(name);
    });

    bar.defineMenu({ id: 'insert', label: 'Insert', group: 'insert', order: 40 });
    bar.add({ id: 'bold', label: 'B', group: 'marks', order: 1 });
    bar.add({
      id: 'table',
      label: 'Table',
      menu: 'insert',
      order: 1,
      command: 'insertTable',
    });

    expect(host.querySelector('[data-id="bold"]')).toBeTruthy();
    expect(host.querySelector('[data-id="table"]')).toBeNull();
    const trigger = host.querySelector('[data-menu="insert"]') as HTMLButtonElement;
    expect(trigger).toBeTruthy();
    trigger.click();

    const item = document.querySelector(
      '[data-ocm-toolbar-menu="insert"] [data-id="table"]'
    ) as HTMLButtonElement;
    expect(item).toBeTruthy();
    item.click();
    expect(commands).toContain('insertTable');
    expect(document.querySelector('[data-ocm-toolbar-menu="insert"]')).toBeNull();

    bar.destroy();
    host.remove();
  });

  it('hides empty menus and sorts by group then order', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const bar = new ToolbarPanel(host, () => {});
    bar.defineMenu({ id: 'tools', label: 'Tools', group: 'tools', order: 1 });
    bar.add({ id: 'z', label: 'Z', group: 'format', order: 2 });
    bar.add({ id: 'a', label: 'A', group: 'marks', order: 99 });
    bar.add({ id: 'h', label: 'H', group: 'history', order: 1 });

    const ids = [...host.querySelectorAll('.ocm-toolbar__btn')].map((el) => el.dataset.id);
    expect(ids).toStrictEqual(['a', 'h', 'z']);
    expect(host.querySelector('[data-menu="tools"]')).toBeNull();
    expect(host.querySelectorAll('.ocm-toolbar__sep')).toHaveLength(2);

    bar.destroy();
    host.remove();
  });

  it('closes on Escape, outside click, toggle, and dispose of defineMenu', async () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const bar = new ToolbarPanel(host, () => {});
    const disposeMenu = bar.defineMenu({
      id: 'insert',
      label: 'Insert',
      icon: '<svg></svg>',
      group: 'insert',
      order: 40,
    });
    bar.defineMenu({ id: 'insert', label: 'Insert+', title: 'Add stuff' });
    bar.add({
      id: 'table',
      label: 'Table',
      icon: '<i>t</i>',
      menu: 'insert',
      onClick: () => {},
    });
    bar.add({
      id: 'off',
      label: 'Off',
      menu: 'insert',
      disabled: () => true,
      onClick: () => {
        throw new Error('should not run');
      },
    });

    const trigger = () => host.querySelector('[data-menu="insert"]') as HTMLButtonElement;

    expect(trigger().title).toBe('Add stuff');
    trigger().click();
    await waitTick();
    expect(document.querySelector('[data-ocm-toolbar-menu="insert"]')).toBeTruthy();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(document.querySelector('[data-ocm-toolbar-menu="insert"]')).toBeNull();

    trigger().click();
    await waitTick();
    expect(document.querySelector('[data-ocm-toolbar-menu="insert"]')).toBeTruthy();
    trigger().click();
    expect(document.querySelector('[data-ocm-toolbar-menu="insert"]')).toBeNull();

    trigger().click();
    await waitTick();
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(document.querySelector('[data-ocm-toolbar-menu="insert"]')).toBeNull();

    trigger().click();
    await waitTick();
    globalThis.dispatchEvent(new Event('scroll'));
    expect(document.querySelector('[data-ocm-toolbar-menu="insert"]')).toBeNull();

    trigger().click();
    await waitTick();
    globalThis.dispatchEvent(new Event('resize'));
    expect(document.querySelector('[data-ocm-toolbar-menu="insert"]')).toBeNull();

    trigger().click();
    await waitTick();
    const disabled = document.querySelector(
      '[data-ocm-toolbar-menu="insert"] [data-id="off"]'
    ) as HTMLButtonElement;
    disabled.click();
    expect(document.querySelector('[data-ocm-toolbar-menu="insert"]')).toBeTruthy();

    disposeMenu();
    expect(host.querySelector('[data-menu="insert"]')).toBeNull();
    expect(document.querySelector('[data-ocm-toolbar-menu="insert"]')).toBeNull();

    bar.clear();
    bar.destroy();
    host.remove();
  });

  it('opens on pointerenter immediately and stays while over the panel', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const bar = new ToolbarPanel(host, () => {});
    bar.defineMenu({ id: 'insert', label: 'Insert', group: 'insert', order: 40 });
    bar.add({ id: 'table', label: 'Table', menu: 'insert', order: 1, onClick: () => {} });

    const trigger = host.querySelector('[data-menu="insert"]') as HTMLButtonElement;
    trigger.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
    const panel = document.querySelector('[data-ocm-toolbar-menu="insert"]') as HTMLElement;
    expect(panel).toBeTruthy();

    // Remount replaces the trigger — re-query live nodes.
    const liveTrigger = host.querySelector('[data-menu="insert"]') as HTMLButtonElement;
    panel.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
    liveTrigger.dispatchEvent(
      new PointerEvent('pointerleave', { bubbles: true, relatedTarget: panel })
    );
    expect(document.querySelector('[data-ocm-toolbar-menu="insert"]')).toBeTruthy();

    panel.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }));
    expect(document.querySelector('[data-ocm-toolbar-menu="insert"]')).toBeNull();

    bar.destroy();
    host.remove();
  });

  it('bar button closes open menu; hover switches between menus', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const bar = new ToolbarPanel(host, () => {});
    bar.defineMenu({ id: 'insert', label: 'Insert', group: 'insert', order: 40 });
    bar.defineMenu({ id: 'tools', label: 'Tools', group: 'tools', order: 60 });
    bar.add({ id: 'table', label: 'Table', menu: 'insert', onClick: () => {} });
    bar.add({ id: 'kbd', label: 'Kbd', menu: 'tools', onClick: () => {} });
    bar.add({ id: 'bold', label: 'B', group: 'marks', onClick: () => {} });

    const insert = host.querySelector('[data-menu="insert"]') as HTMLButtonElement;
    insert.click();
    expect(document.querySelector('[data-ocm-toolbar-menu="insert"]')).toBeTruthy();

    (host.querySelector('[data-id="bold"]') as HTMLButtonElement).click();
    expect(document.querySelector('[data-ocm-toolbar-menu="insert"]')).toBeNull();

    const insert2 = host.querySelector('[data-menu="insert"]') as HTMLButtonElement;
    insert2.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
    expect(document.querySelector('[data-ocm-toolbar-menu="insert"]')).toBeTruthy();

    const tools3 = host.querySelector('[data-menu="tools"]') as HTMLButtonElement;
    const insert3 = host.querySelector('[data-menu="insert"]') as HTMLButtonElement;
    insert3.dispatchEvent(
      new PointerEvent('pointerleave', { bubbles: true, relatedTarget: tools3 })
    );
    tools3.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
    expect(document.querySelector('[data-ocm-toolbar-menu="insert"]')).toBeNull();
    expect(document.querySelector('[data-ocm-toolbar-menu="tools"]')).toBeTruthy();

    bar.destroy();
    host.remove();
  });

  it('remove closes open menu and refresh keeps bar', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const bar = new ToolbarPanel(host, () => {});
    bar.defineMenu({ id: 'review', label: 'Review', group: 'review' });
    bar.add({ id: 'c', label: 'C', menu: 'review', active: () => true });
    const trigger = host.querySelector('[data-menu="review"]') as HTMLButtonElement;
    trigger.click();
    expect(document.querySelector('[data-ocm-toolbar-menu="review"]')).toBeTruthy();
    bar.remove('review');
    expect(document.querySelector('[data-ocm-toolbar-menu="review"]')).toBeNull();
    bar.add({ id: 'x', label: 'X', group: 'custom' });
    bar.refresh();
    expect(host.querySelector('[data-id="x"]')).toBeTruthy();
    bar.destroy();
    host.remove();
  });
});
