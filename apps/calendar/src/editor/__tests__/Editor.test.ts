import { describe, expect, it, afterEach } from 'vitest';
import { createDoc, createParagraph, createText } from '@codemerge/kernel';
import { Editor, createDefaultPlugins, ParseError } from '../../app';

describe('Calendar Editor entry', () => {
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

  it('shell mounts calendar studio into content', () => {
    const editor = mount();
    expect(editor.host.querySelector('.ocm-content')).toBeTruthy();
    expect(editor.host.querySelector('.ocm-studio')).toBeTruthy();
  });

  it('getText / setText + invalid leaves SoT unchanged', () => {
    const editor = mount();
    const payload = {
      title: 'Team',
      tz: 'UTC',
      view: 'month' as const,
      cursor: '2026-10-02',
      calendars: [{ id: 'main', title: 'Work', color: '#3b82f6', visible: true }],
      events: [],
    };
    expect(editor.setText(JSON.stringify(payload))).toBeNull();
    expect(editor.getJSONConfig().title).toBe('Team');
    const before = editor.getText();
    const err = editor.setText('{');
    expect(err).toBeInstanceOf(ParseError);
    expect(editor.getText()).toBe(before);
  });

  it('ConstrainedEditor rejects prose setJSON', () => {
    const editor = mount();
    expect(() => {
      editor.setJSON(createDoc([createParagraph([createText('nope')])]));
    }).toThrow(/Calendar Editor document/);
    expect(editor.getJSON().doc.content?.[0]?.type).toBe('calendar');
  });

  it('setJSONConfig updates payload SoT', () => {
    const editor = mount();
    editor.setJSONConfig({
      title: 'Seed',
      tz: 'UTC',
      view: 'week',
      cursor: '2026-10-02',
      calendars: [{ id: 'main', title: 'Work', color: '#3b82f6', visible: true }],
      events: [],
    });
    expect(editor.getJSONConfig().title).toBe('Seed');
    expect(editor.getJSONConfig().view).toBe('week');
  });
});
