import { afterEach, describe, expect, it } from 'vitest';
import { mount } from '@codemerge/sdk';
import { TableStore } from '../grid/TableStore';
import { tableGridView } from '../grid/view/gridView';

function stubBox(el: HTMLElement, width: number, height: number): void {
  Object.defineProperty(el, 'clientWidth', { configurable: true, get: () => width });
  Object.defineProperty(el, 'clientHeight', { configurable: true, get: () => height });
  Object.defineProperty(el, 'offsetHeight', { configurable: true, get: () => height });
  Object.defineProperty(el, 'offsetWidth', { configurable: true, get: () => width });
}

describe('grid cell edit', () => {
  const hosts: HTMLElement[] = [];

  afterEach(() => {
    for (const host of hosts) {
      host.remove();
    }
    hosts.length = 0;
  });

  it('mousedown then click on the same cell opens the editor', async () => {
    const store = new TableStore({
      version: 2,
      columns: [
        { id: 'a', title: 'A' },
        { id: 'b', title: 'B', type: 'number' },
      ],
      rows: [{ id: 'r1', cells: { a: 'Apples', b: 3 } }],
    });
    const host = document.createElement('div');
    stubBox(host, 640, 320);
    document.body.append(host);
    hosts.push(host);
    const handle = mount(host, tableGridView(store));
    const body = host.querySelector('.ocm-table-grid__body');
    if (body instanceof HTMLElement) {
      stubBox(body, 640, 320);
    }
    await Promise.resolve();
    await Promise.resolve();
    store.setLayoutWidth(640);

    const headers = [...host.querySelectorAll('[role="columnheader"]')].map((el) =>
      (el.textContent ?? '').replace(/\s+/g, ' ').trim()
    );
    expect(headers.some((t) => t.startsWith('A'))).toBe(true);
    expect(headers.some((t) => t.startsWith('B'))).toBe(true);
    expect(headers.some((t) => t === 'C' || t.startsWith('C '))).toBe(false);
    expect(host.querySelector('button[title="Add column"]')).toBeTruthy();

    const cell = host.querySelector('[data-ocm-row="r1"][data-ocm-col="a"]');
    expect(cell).toBeInstanceOf(HTMLElement);
    const target = cell as HTMLElement;
    target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
    target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    expect(store.isEditing()).toBe(true);
    expect(host.querySelector('input')).toBeInstanceOf(HTMLInputElement);
    handle.destroy();
    store.destroy();
  });

  it('click on column header title opens rename field', async () => {
    const store = new TableStore({
      version: 2,
      columns: [{ id: 'a', title: 'Name' }],
      rows: [{ id: 'r1', cells: { a: 'x' } }],
    });
    const host = document.createElement('div');
    stubBox(host, 640, 320);
    document.body.append(host);
    hosts.push(host);
    const handle = mount(host, tableGridView(store));
    const body = host.querySelector('.ocm-table-grid__body');
    if (body instanceof HTMLElement) {
      stubBox(body, 640, 320);
    }
    await Promise.resolve();
    await Promise.resolve();
    store.setLayoutWidth(640);

    const rename = host.querySelector('button[title="Rename column"]');
    expect(rename).toBeInstanceOf(HTMLButtonElement);
    (rename as HTMLButtonElement).dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true })
    );
    const input = host.querySelector('input[data-ocm-header-edit]');
    expect(input).toBeInstanceOf(HTMLInputElement);
    const field = input as HTMLInputElement;
    field.value = 'Fruit';
    field.dispatchEvent(new Event('change', { bubbles: true }));
    field.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    expect(store.getDoc().columns[0]?.title).toBe('Fruit');
    expect(store.getEditingHeader()).toBeNull();
    handle.destroy();
    store.destroy();
  });

  it('scrolls back to the first rows while a cell is being edited', async () => {
    const store = new TableStore({
      version: 2,
      columns: [
        { id: 'a', title: 'Name' },
        { id: 'b', title: 'Qty' },
      ],
      rows: [{ id: 'r1', cells: { a: 'Apples', b: 3 } }],
    });
    const host = document.createElement('div');
    stubBox(host, 640, 200);
    document.body.append(host);
    hosts.push(host);
    const handle = mount(host, tableGridView(store));
    const body = host.querySelector('.ocm-table-grid__body');
    if (body instanceof HTMLElement) {
      stubBox(body, 640, 200);
    }
    await Promise.resolve();
    await Promise.resolve();
    store.setLayoutWidth(640);

    const cell = host.querySelector('[data-ocm-row="r1"][data-ocm-col="a"]');
    expect(cell).toBeInstanceOf(HTMLElement);
    (cell as HTMLElement).dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true })
    );
    expect(store.isEditing()).toBe(true);

    expect(body).toBeInstanceOf(HTMLElement);
    const scroller = body as HTMLElement;
    scroller.scrollTop = 400;
    scroller.dispatchEvent(new Event('scroll'));
    const mid = host.querySelector('.ocm-table-grid__window');
    expect(mid instanceof HTMLElement ? mid.style.top : '').not.toBe('0px');
    scroller.scrollTop = 0;
    scroller.dispatchEvent(new Event('scroll'));
    await Promise.resolve();

    const windowEl = host.querySelector('.ocm-table-grid__window');
    expect(windowEl instanceof HTMLElement ? windowEl.style.top : '').toBe('0px');
    const headers = [...host.querySelectorAll('[role="columnheader"]')].map((el) =>
      (el.textContent ?? '').replace(/\s+/g, ' ').trim()
    );
    expect(headers.some((t) => t.startsWith('Name'))).toBe(true);
    expect(headers.some((t) => t.startsWith('Qty'))).toBe(true);
    expect(host.querySelector('[data-ocm-row="r1"][data-ocm-col="a"]')).toBeInstanceOf(HTMLElement);
    expect(host.querySelector('input')).toBeInstanceOf(HTMLInputElement);
    handle.destroy();
    store.destroy();
  });
});
