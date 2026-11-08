import { afterEach, describe, expect, it } from 'vitest';
import { DisposableScope, mount } from '@codemerge/sdk';
import type { EditorAPI } from '@codemerge/sdk';
import { TableStore } from '../grid/TableStore';
import { deriveGrid } from '../grid/derive/pipeline';
import { handleGridKeydown } from '../grid/keyboard';
import { pasteTsv } from '../grid/clipboard';
import { deleteColumn, deleteRow, mergeVertical } from '../grid/ops';
import { tableGridView } from '../grid/view/gridView';
import type { TableGridDoc } from '../io/adapters';
import { gridToHtml, gridToMarkdown, htmlToGrid, markdownToGrid } from '../io/adapters';
import { mountTableGridWidget } from '../widgets/mountTableGridWidget';

function stubBox(el: HTMLElement, width: number, height: number): void {
  Object.defineProperty(el, 'clientWidth', { configurable: true, get: () => width });
  Object.defineProperty(el, 'clientHeight', { configurable: true, get: () => height });
  Object.defineProperty(el, 'offsetHeight', { configurable: true, get: () => height });
  Object.defineProperty(el, 'offsetWidth', { configurable: true, get: () => width });
}

function flushGrid(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

function grid(cols: string[], rows: TableGridDoc['rows'], view?: TableGridDoc['view']) {
  const doc: TableGridDoc = {
    version: 2,
    columns: cols.map((id) => ({ id, title: id.toUpperCase() })),
    rows,
  };
  if (view) {
    doc.view = view;
  }
  return doc;
}

describe('table audit regressions', () => {
  const hosts: HTMLElement[] = [];
  afterEach(() => {
    for (const host of hosts) {
      host.remove();
    }
    hosts.length = 0;
  });

  it('deleteRow shrinks a rowspan that covered the deleted row', () => {
    const doc = grid(
      ['a'],
      [
        { id: 'r1', cells: { a: '1' }, spans: { a: { rows: 3 } } },
        { id: 'r2', cells: { a: '' } },
        { id: 'r3', cells: { a: '' } },
        { id: 'r4', cells: { a: 'keep visible' } },
      ]
    );
    const next = deleteRow(doc, 'r2');
    expect(next.rows[0]?.spans).toStrictEqual({ a: { rows: 2 } });
    const twoRow = deleteRow(
      grid(
        ['a'],
        [
          { id: 'r1', cells: { a: '1' }, spans: { a: { rows: 2 } } },
          { id: 'r2', cells: { a: '' } },
          { id: 'r3', cells: { a: '' } },
        ]
      ),
      'r2'
    );
    expect(twoRow.rows[0]?.spans).toBeUndefined();
  });

  it('deleteColumn shrinks a covering colspan and drops view state for the column', () => {
    const doc = grid(
      ['a', 'b', 'c'],
      [
        { id: 'r1', cells: { a: '1', b: '', c: 'x' }, spans: { a: { cols: 3 } } },
        { id: 'r2', cells: { a: '2', b: '', c: 'y' } },
      ],
      {
        filters: { c: { op: 'contains', value: 'x' } },
        sort: [{ colId: 'c', dir: 'asc' }],
        groupBy: ['c'],
      }
    );
    const next = deleteColumn(doc, 'b');
    expect(next.rows[0]?.spans).toStrictEqual({ a: { cols: 2 } });
    const noC = deleteColumn(doc, 'c');
    expect(noC.view?.filters).toStrictEqual({});
    expect(noC.view?.sort).toStrictEqual([]);
    expect(noC.view?.groupBy).toBeUndefined();
    expect(deriveGrid(noC).rowIds).toStrictEqual(['r1', 'r2']);
  });

  it('HTML cell with <br> decodes entities once', () => {
    const g = htmlToGrid('<table><tr><td>a &amp;lt; b<br>c&nbsp;d</td></tr></table>');
    const col = g.columns[0]!.id;
    expect(g.rows[0]?.cells[col]).toBe('a &lt; b\nc d');
  });

  it('markdown round-trips a literal pipe in a cell', () => {
    const doc = grid(['a', 'b'], [{ id: 'r1', cells: { a: 'x|y', b: 'z' } }]);
    const back = markdownToGrid(gridToMarkdown(doc));
    const [c0, c1] = back.columns.map((c) => c.id);
    expect(back.rows[0]?.cells[c0!]).toBe('x|y');
    expect(back.rows[0]?.cells[c1!]).toBe('z');
  });

  it('Enter with groupBy edits the active row, not the row at its data index', () => {
    const store = new TableStore(
      grid(
        ['a'],
        [
          { id: 'r1', cells: { a: 'x' } },
          { id: 'r2', cells: { a: 'y' } },
        ],
        { groupBy: ['a'] }
      )
    );
    store.setActive('r2', 'a');
    handleGridKeydown(store, new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(store.getSelection().active).toStrictEqual({ rowId: 'r2', colId: 'a' });
    expect(store.isEditing()).toBe(true);
    store.destroy();
  });

  it('Escape in the cell editor leaves edit mode and reverts the draft', async () => {
    const store = new TableStore(grid(['a'], [{ id: 'r1', cells: { a: 'orig' } }]));
    const host = document.createElement('div');
    stubBox(host, 640, 320);
    document.body.append(host);
    hosts.push(host);
    const handle = mount(host, tableGridView(store));
    const body = host.querySelector('.ocm-table-grid__body');
    if (body instanceof HTMLElement) {
      stubBox(body, 640, 320);
    }
    await flushGrid();
    store.ensureCell(0, 'a');
    store.setEditing(true);
    await flushGrid();
    const field = host.querySelector('[data-ocm-cell-edit]');
    expect(field).toBeInstanceOf(HTMLTextAreaElement);
    const ta = field as HTMLTextAreaElement;
    ta.value = 'draft';
    ta.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(store.isEditing()).toBe(false);
    expect(store.getDoc().rows[0]?.cells.a).toBe('orig');
    handle.destroy();
    store.destroy();
  });

  it('atom commit after a widget remount measures the live host', async () => {
    const editor = { ui: { menu: { open: () => undefined } } } as unknown as EditorAPI;
    const doc = grid(['a'], [{ id: 'r1', cells: { a: '' } }]);
    const commits: { which: number; width: number }[] = [];
    const mountOnce = (which: number, width: number) => {
      const host = document.createElement('div');
      stubBox(host, width, 300);
      document.body.append(host);
      hosts.push(host);
      const scope = new DisposableScope();
      mountTableGridWidget(
        host,
        {
          grid: doc,
          path: [0],
          editor,
          width,
          height: 300,
          onCommit: (_g, box) => commits.push({ which, width: box.width }),
          onResize: () => undefined,
        },
        scope
      );
      const body = host.querySelector('.ocm-table-grid__body');
      if (body instanceof HTMLElement) {
        stubBox(body, width, 300);
      }
      return { host, scope };
    };
    const first = mountOnce(1, 400);
    await flushGrid();
    first.scope.dispose();
    first.host.remove();
    stubBox(first.host, 0, 0);
    const second = mountOnce(2, 500);
    await flushGrid();
    const cell = second.host.querySelector('[data-ocm-row="r1"][data-ocm-col="a"]');
    cell?.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true }));
    await flushGrid();
    const ta = second.host.querySelector('[data-ocm-cell-edit]');
    expect(ta).toBeInstanceOf(HTMLTextAreaElement);
    (ta as HTMLTextAreaElement).value = 'v';
    ta?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(commits.at(-1)).toStrictEqual({ which: 2, width: 500 });
    second.scope.dispose();
  });

  it('pasteTsv with groupBy targets visible data rows and skips group headers', () => {
    const store = new TableStore(
      grid(
        ['g', 'v'],
        [
          { id: 'r1', cells: { g: 'x', v: '' } },
          { id: 'r2', cells: { g: 'y', v: '' } },
          { id: 'r3', cells: { g: 'x', v: '' } },
        ],
        { groupBy: ['g'] }
      )
    );
    // Visual: [x-header, r1, r3, y-header, r2]
    store.setActive('r1', 'v');
    pasteTsv(store, '1\n2\n3');
    const cells = Object.fromEntries(store.getDoc().rows.map((r) => [r.id, r.cells.v]));
    expect(cells).toStrictEqual({ r1: '1', r3: '2', r2: '3' });
    store.destroy();
  });

  it('pasteTsv past the last row appends exactly the missing rows under sort', () => {
    const store = new TableStore(
      grid(['a'], [{ id: 'r1', cells: { a: 'b' } }], { sort: [{ colId: 'a', dir: 'asc' }] })
    );
    store.setActive('r1', 'a');
    pasteTsv(store, 'z\ny');
    expect(store.getDoc().rows.map((r) => r.cells.a)).toStrictEqual(['z', 'y']);
    store.destroy();
  });

  it('merges render unmerged while sort reorders rows, and merging is a no-op', async () => {
    const doc = grid(
      ['a'],
      [
        { id: 'r1', cells: { a: '2' }, spans: { a: { rows: 2 } } },
        { id: 'r2', cells: { a: '' } },
        { id: 'r3', cells: { a: '1' } },
      ],
      { sort: [{ colId: 'a', dir: 'asc' }] }
    );
    expect(mergeVertical(doc, { rowId: 'r3', colId: 'a' })).toBe(doc);
    const store = new TableStore(doc);
    const host = document.createElement('div');
    stubBox(host, 640, 320);
    document.body.append(host);
    hosts.push(host);
    const handle = mount(host, tableGridView(store));
    const body = host.querySelector('.ocm-table-grid__body');
    if (body instanceof HTMLElement) {
      stubBox(body, 640, 320);
    }
    await flushGrid();
    // r2 is covered in doc order but must still be drawn under the sorted view.
    expect(host.querySelector('[data-ocm-row="r2"][data-ocm-col="a"]')).not.toBeNull();
    expect(store.getDoc().rows[0]?.spans).toStrictEqual({ a: { rows: 2 } });
    handle.destroy();
    store.destroy();
  });

  it('HTML export/import round-trips colspan/rowspan merges', () => {
    const doc = grid(
      ['a', 'b', 'c'],
      [
        { id: 'r1', cells: { a: 'wide', b: '', c: 'c1' }, spans: { a: { cols: 2 } } },
        { id: 'r2', cells: { a: 'tall', b: 'b2', c: 'c2' }, spans: { a: { rows: 2 } } },
        { id: 'r3', cells: { a: '', b: 'b3', c: 'c3' } },
      ]
    );
    const html = gridToHtml(doc);
    expect(html).toContain('<td colspan="2">wide</td>');
    expect(html).toContain('<td rowspan="2">tall</td>');
    const back = htmlToGrid(html);
    const [a, b, c] = back.columns.map((col) => col.id);
    expect(back.rows.map((r) => [r.cells[a!], r.cells[b!], r.cells[c!]])).toStrictEqual([
      ['wide', '', 'c1'],
      ['tall', 'b2', 'c2'],
      ['', 'b3', 'c3'],
    ]);
    expect(back.rows[0]?.spans).toStrictEqual({ [a!]: { cols: 2 } });
    expect(back.rows[1]?.spans).toStrictEqual({ [a!]: { rows: 2 } });
  });
});
