import { describe, expect, it, afterEach } from 'vitest';
import { Editor, createDefaultPlugins } from '../../app';

describe('Tables Editor IO surface', () => {
  const hosts: HTMLElement[] = [];

  afterEach(() => {
    for (const host of hosts) {
      const ed = Reflect.get(host, '__editor');
      if (ed && typeof ed.destroy === 'function') {
        ed.destroy();
      }
      host.remove();
    }
    hosts.length = 0;
  });

  function mount(): Editor {
    const host = document.createElement('div');
    document.body.append(host);
    hosts.push(host);
    const editor = new Editor(host, {
      chrome: 'bar',
      plugins: createDefaultPlugins(),
    });
    Reflect.set(host, '__editor', editor);
    return editor;
  }

  it('setGrid / getGrid roundtrip preserves view', () => {
    const editor = mount();
    const grid = {
      version: 2 as const,
      columns: [
        { id: 'a', title: 'A' },
        { id: 'b', title: 'B', type: 'number' as const },
      ],
      rows: [
        { id: 'r1', cells: { a: 'x', b: 1 } },
        { id: 'r2', cells: { a: 'y', b: 2 } },
      ],
      view: {
        sort: [{ colId: 'b', dir: 'desc' as const }],
        quickFilter: 'y',
        pagination: { page: 0, pageSize: 10 },
      },
    };
    editor.setGrid(grid);
    const out = editor.getGrid();
    expect(out.view?.sort).toStrictEqual([{ colId: 'b', dir: 'desc' }]);
    expect(out.view?.quickFilter).toBe('y');
    expect(out.rows).toHaveLength(2);
  });

  it('empty setText keeps valid empty grid', () => {
    const editor = mount();
    expect(editor.setText('')).toBeNull();
    expect(editor.getGrid().columns.length).toBeGreaterThan(0);
    expect(editor.getGrid().rows.length).toBeGreaterThan(0);
  });

  it('renders cells after setText into DOM', () => {
    const editor = mount();
    editor.setText(
      JSON.stringify({
        version: 2,
        columns: [{ id: 'a', title: 'Name' }],
        rows: [{ id: 'r1', cells: { a: 'hello-grid' } }],
      })
    );
    expect(editor.host.textContent).toContain('hello-grid');
    expect(editor.host.textContent).toContain('Name');
  });

  it('rejects non-object JSON with ParseError', () => {
    const editor = mount();
    const before = editor.getText();
    const err = editor.setText('42');
    expect(err).toBeTruthy();
    expect(editor.getText()).toBe(before);
  });
});
