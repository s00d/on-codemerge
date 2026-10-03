import { describe, expect, it, afterEach } from 'vitest';
import { createDoc, createParagraph, createText } from '@codemerge/kernel';
import { Editor, createDefaultPlugins, ParseError } from '../../app';

describe('Charts Editor entry', () => {
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

  it('shell mounts chart studio', () => {
    const editor = mount();
    expect(editor.host.querySelector('.ocm-studio')).toBeTruthy();
  });

  it('getText / setText + invalid leaves SoT unchanged', () => {
    const editor = mount();
    const attrs = {
      chartType: 'bar',
      title: 'Sales',
      data: [{ name: 'S', data: [{ label: 'A', value: 1 }] }],
    };
    expect(editor.setText(JSON.stringify(attrs))).toBeNull();
    expect(editor.getJSONConfig().chartType).toBe('bar');
    const before = editor.getText();
    const err = editor.setText('{');
    expect(err).toBeInstanceOf(ParseError);
    expect(editor.getText()).toBe(before);
  });

  it('ConstrainedEditor rejects prose setJSON', () => {
    const editor = mount();
    expect(() => {
      editor.setJSON(createDoc([createParagraph([createText('nope')])]));
    }).toThrow(/Charts Editor document/);
    expect(editor.getJSON().doc.content?.[0]?.type).toBe('chart');
  });
});
