/**
 * Surface/feature contract: atom must not pollute chrome; workspace requires JSON SoT.
 */
import { describe, expect, it, afterEach } from 'vitest';
import { Editor as WysiwygEditor } from 'on-codemerge/app';
import { Editor as JsonEditor, JsonPlugin, emptyEditorDoc } from 'on-codemerge/json';

describe('JsonPlugin surface contract', () => {
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

  it('atom defaults: Insert JSON chrome, editor undo + no workspace format/shortcuts', () => {
    const host = document.createElement('div');
    document.body.append(host);
    hosts.push(host);

    const editor = new WysiwygEditor(host, {
      chrome: 'bar',
      plugins: [JsonPlugin({ surface: 'atom' })],
    });
    Reflect.set(host, '__editor', editor);

    const ids = [...host.querySelectorAll('[data-id]')].map((el) => el.getAttribute('data-id'));
    // Insert-menu items are portaled only while open — assert via shortcuts / commands.
    expect(ids).toContain('undo');
    expect(ids).toContain('redo');
    expect(ids).not.toContain('json-format-pretty');
    expect(ids).not.toContain('shortcuts');
    expect(ids).not.toContain('json-atom-info');

    const shortcutKeys = editor.listShortcuts().map((s) => s.keys);
    expect(shortcutKeys).toContain('Mod-Alt-j');
    expect(shortcutKeys).not.toContain('Mod-Shift-f');
    expect(shortcutKeys).not.toContain('Mod-/');
  });

  it('workspace without JSON SoT throws clear TypeError', () => {
    const host = document.createElement('div');
    document.body.append(host);
    hosts.push(host);

    expect(() => {
      const bad = new WysiwygEditor(host, {
        chrome: 'bar',
        plugins: [JsonPlugin({ surface: 'workspace' })],
      });
      Reflect.set(host, '__editor', bad);
    }).toThrow(/surface: "workspace".*emptyEditorDoc/);
  });

  it('workspace with emptyEditorDoc mounts Tree into contentElement', () => {
    const host = document.createElement('div');
    document.body.append(host);
    hosts.push(host);

    const editor = new JsonEditor(host, {
      chrome: 'bar',
      doc: emptyEditorDoc(null),
      plugins: [JsonPlugin({ surface: 'workspace' })],
    });
    Reflect.set(host, '__editor', editor);

    const content = editor.contentElement();
    expect(content?.getAttribute('data-ocm-shell')).toBe('true');
    expect(content?.querySelector('.ocm-json-tree')).toBeTruthy();
    // Undo/redo toolbar is seeded by `@codemerge/editor` (no HistoryChrome plugin).
    expect(host.querySelector('[data-id="undo"]')).toBeTruthy();
    expect(host.querySelector('[data-id="redo"]')).toBeTruthy();
  });

  it('workspace ignores decoy .ocm-content outside contentElement', () => {
    const host = document.createElement('div');
    const decoy = document.createElement('div');
    decoy.className = 'ocm-content';
    host.append(decoy);
    document.body.append(host);
    hosts.push(host);

    const editor = new JsonEditor(host, {
      chrome: 'bar',
      doc: emptyEditorDoc(null),
      plugins: [JsonPlugin({ surface: 'workspace' })],
    });
    Reflect.set(host, '__editor', editor);

    expect(decoy.querySelector('.ocm-json-tree')).toBeNull();
    expect(editor.contentElement()?.querySelector('.ocm-json-tree')).toBeTruthy();
  });
});
