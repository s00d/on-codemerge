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

  it('pointerdown on a cell opens the editor', async () => {
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
    target.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true }));

    expect(store.isEditing()).toBe(true);
    expect(host.querySelector('[data-ocm-cell-edit]')).toBeInstanceOf(HTMLTextAreaElement);
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

  it('scrolls through a large sheet to the last used row', async () => {
    const rows = Array.from({ length: 2500 }, (_, i) => ({
      id: `r${i}`,
      cells: { a: `v${i}` },
    }));
    const store = new TableStore({
      version: 2,
      columns: [{ id: 'a', title: 'A' }],
      rows,
    });
    const host = document.createElement('div');
    stubBox(host, 640, 240);
    document.body.append(host);
    hosts.push(host);
    const handle = mount(host, tableGridView(store));
    const body = host.querySelector('.ocm-table-grid__body');
    expect(body).toBeInstanceOf(HTMLElement);
    const scroller = body as HTMLElement;
    stubBox(scroller, 640, 240);
    Object.defineProperty(scroller, 'scrollHeight', {
      configurable: true,
      get: () => store.getSheetRowCount() * 32 + 32,
    });
    await Promise.resolve();
    await Promise.resolve();
    store.setLayoutWidth(640);

    const total = store.getSheetRowCount();
    expect(total).toBeGreaterThanOrEqual(2500);
    scroller.scrollTop = Math.max(0, total * 32 - 200);
    scroller.dispatchEvent(new Event('scroll'));
    await Promise.resolve();

    const last = host.querySelector('[data-ocm-row="r2499"][data-ocm-col="a"]');
    expect(last).toBeInstanceOf(HTMLElement);
    expect(host.querySelectorAll('[role="row"]').length).toBeLessThan(80);
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
      new MouseEvent('pointerdown', { bubbles: true, cancelable: true })
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
    expect(host.querySelector('[data-ocm-cell-edit]')).toBeInstanceOf(HTMLTextAreaElement);
    handle.destroy();
    store.destroy();
  });

  it('Enter commits the cell and starts edit on the next row', async () => {
    const store = new TableStore({
      version: 2,
      columns: [{ id: 'a', title: 'A' }],
      rows: [
        { id: 'r1', cells: { a: 'Apples' } },
        { id: 'r2', cells: { a: 'Oranges' } },
      ],
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

    const cell = host.querySelector('[data-ocm-row="r1"][data-ocm-col="a"]');
    expect(cell).toBeInstanceOf(HTMLElement);
    (cell as HTMLElement).dispatchEvent(
      new MouseEvent('pointerdown', { bubbles: true, cancelable: true })
    );
    const input = host.querySelector('[data-ocm-cell-edit]');
    expect(input).toBeInstanceOf(HTMLTextAreaElement);
    const field = input as HTMLTextAreaElement;
    field.value = 'Pears';
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(store.getDoc().rows[0]?.cells.a).toBe('Pears');
    expect(store.getSelection().active).toStrictEqual({ rowId: 'r2', colId: 'a' });
    expect(store.isEditing()).toBe(true);
    const next = host.querySelector('[data-ocm-row="r2"][data-ocm-col="a"] [data-ocm-cell-edit]');
    expect(next).toBeInstanceOf(HTMLTextAreaElement);
    expect((next as HTMLTextAreaElement).value).toBe('Oranges');
    handle.destroy();
    store.destroy();
  });

  it('grows the sheet row when a cell has multiple lines', async () => {
    const store = new TableStore({
      version: 2,
      columns: [{ id: 'a', title: 'A' }],
      rows: [
        { id: 'r1', cells: { a: 'one\ntwo\nthree' } },
        { id: 'r2', cells: { a: 'single' } },
      ],
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

    const tall = host
      .querySelector('[data-ocm-row="r1"][data-ocm-col="a"]')
      ?.closest('[role="row"]');
    const short = host
      .querySelector('[data-ocm-row="r2"][data-ocm-col="a"]')
      ?.closest('[role="row"]');
    expect(tall).toBeInstanceOf(HTMLElement);
    expect(short).toBeInstanceOf(HTMLElement);
    const tallH = Number((tall as HTMLElement).style.height);
    const shortH = Number((short as HTMLElement).style.height);
    expect(shortH).toBe(32);
    expect(tallH).toBeGreaterThan(shortH);
    handle.destroy();
    store.destroy();
  });
});
