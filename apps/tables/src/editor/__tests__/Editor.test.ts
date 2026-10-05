import { describe, expect, it, afterEach } from 'vitest';
import { createDoc, createParagraph, createText } from '@codemerge/kernel';
import { Editor, createDefaultPlugins, ParseError } from '../../app';

describe('Tables Editor entry', () => {
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

  it('shell mounts table grid', () => {
    const editor = mount();
    expect(editor.host.querySelector('.ocm-table-root')).toBeTruthy();
  });

  it('getText / setText + invalid leaves SoT unchanged', () => {
    const editor = mount();
    const grid = {
      version: 2,
      columns: [
        { id: 'a', title: 'A' },
        { id: 'b', title: 'B' },
      ],
      rows: [{ id: 'r1', cells: { a: '1', b: '2' } }],
    };
    expect(editor.setText(JSON.stringify(grid))).toBeNull();
    expect(editor.getGrid().rows).toHaveLength(1);
    expect(editor.getGrid().rows[0]?.cells.a).toBe('1');
    const before = editor.getText();
    const err = editor.setText('{');
    expect(err).toBeInstanceOf(ParseError);
    expect(editor.getText()).toBe(before);
  });

  it('migrates legacy string[][] rows on setText', () => {
    const editor = mount();
    expect(
      editor.setText(
        JSON.stringify({
          columns: [
            { id: 'a', title: 'A' },
            { id: 'b', title: 'B' },
          ],
          rows: [['x', 'y']],
        })
      )
    ).toBeNull();
    expect(editor.getGrid().version).toBe(2);
    expect(editor.getGrid().rows[0]?.cells.a).toBe('x');
  });

  it('ConstrainedEditor rejects prose setJSON', () => {
    const editor = mount();
    expect(() => {
      editor.setJSON(createDoc([createParagraph([createText('nope')])]));
    }).toThrow(/Tables Editor document/);
    expect(editor.getJSON().doc.content?.[0]?.type).toBe('tableGrid');
  });
});
