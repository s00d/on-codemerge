import { describe, expect, it, afterEach } from 'vitest';
import {
  Editor as WysiwygEditor,
  createDefaultPlugins as createWysiwygPlugins,
} from 'on-codemerge/app';
import {
  Editor as TablesEditor,
  TablePlugin,
  emptyEditorDoc,
  createDefaultPlugins,
} from 'on-codemerge/tables';

describe('TablePlugin surface contract', () => {
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

  it('workspace without tableGrid SoT throws', () => {
    const host = document.createElement('div');
    document.body.append(host);
    hosts.push(host);
    expect(() => {
      const bad = new WysiwygEditor(host, {
        chrome: 'bar',
        plugins: [TablePlugin({ surface: 'workspace' })],
      });
      Reflect.set(host, '__editor', bad);
    }).toThrow(/surface: "workspace".*emptyEditorDoc/);
  });

  it('workspace with emptyEditorDoc mounts grid root', () => {
    const host = document.createElement('div');
    document.body.append(host);
    hosts.push(host);
    const editor = new TablesEditor(host, {
      chrome: 'bar',
      doc: emptyEditorDoc(),
      plugins: createDefaultPlugins(),
    });
    Reflect.set(host, '__editor', editor);
    expect(editor.contentElement()?.getAttribute('data-ocm-shell')).toBe('true');
    expect(host.querySelector('.ocm-table-root')).toBeTruthy();
    expect(host.querySelector('.ocm-table-grid')).toBeTruthy();
  });

  it('virtualization keeps DOM rows far below total for large docs', () => {
    const host = document.createElement('div');
    document.body.append(host);
    hosts.push(host);
    const cols = [
      { id: 'a', title: 'A' },
      { id: 'b', title: 'B' },
    ];
    const rows = Array.from({ length: 5000 }, (_, i) => ({
      id: `r${i}`,
      cells: { a: String(i), b: 'x' },
    }));
    const editor = new TablesEditor(host, {
      chrome: 'bar',
      plugins: createDefaultPlugins(),
    });
    Reflect.set(host, '__editor', editor);
    expect(
      editor.setText(
        JSON.stringify({
          version: 2,
          columns: cols,
          rows,
        })
      )
    ).toBeNull();
    const cells = host.querySelectorAll('[role="gridcell"]');
    expect(cells.length).toBeLessThan(500);
  });

  it('wysiwyg atom HTML table mounts tableGrid sheet', () => {
    const host = document.createElement('div');
    document.body.append(host);
    hosts.push(host);
    const editor = new WysiwygEditor(host, {
      chrome: 'bar',
      plugins: createWysiwygPlugins(),
    });
    Reflect.set(host, '__editor', editor);
    editor.setHTML(
      '<p>t</p><table><thead><tr><th>Name</th><th>Qty</th></tr></thead><tbody><tr><td>Apples</td><td>3</td></tr></tbody></table>'
    );
    expect(editor.getJSON().doc.content?.some((n) => n.type === 'tableGrid')).toBe(true);
    expect(host.querySelector('.ocm-table-atom')).toBeTruthy();
    expect(host.querySelector('.ocm-table-grid')).toBeTruthy();
    const atom = host.querySelector('.ocm-table-atom');
    expect(atom instanceof HTMLElement ? atom.style.height : '').toBe('240px');
  });
});
