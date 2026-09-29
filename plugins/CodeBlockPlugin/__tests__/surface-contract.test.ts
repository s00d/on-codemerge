/**
 * Surface/feature contract: atom must not pollute chrome; workspace requires code SoT + shell.
 */
import { describe, expect, it, afterEach } from 'vitest';
import { Editor as WysiwygEditor } from 'on-codemerge/app';
import { Editor as CodeEditor, CodeBlockPlugin, emptyEditorDoc } from 'on-codemerge/code';

describe('CodeBlockPlugin surface contract', () => {
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

  it('atom defaults: Insert hotkey, no workspace undo chrome', () => {
    const host = document.createElement('div');
    document.body.append(host);
    hosts.push(host);

    const editor = new WysiwygEditor(host, {
      chrome: 'bar',
      plugins: [CodeBlockPlugin({ surface: 'atom' })],
    });
    Reflect.set(host, '__editor', editor);

    const ids = [...host.querySelectorAll('[data-id]')].map((el) => el.getAttribute('data-id'));
    expect(ids).not.toContain('undo');
    expect(ids).not.toContain('redo');

    const shortcutKeys = editor.listShortcuts().map((s) => s.keys);
    expect(shortcutKeys).toContain('Mod-Alt-q');
  });

  it('workspace without code SoT throws clear TypeError', () => {
    const host = document.createElement('div');
    document.body.append(host);
    hosts.push(host);

    expect(() => {
      const bad = new WysiwygEditor(host, {
        chrome: 'bar',
        plugins: [CodeBlockPlugin({ surface: 'workspace' })],
      });
      Reflect.set(host, '__editor', bad);
    }).toThrow(/surface: "workspace".*emptyEditorDoc/);
  });

  it('workspace with emptyEditorDoc mounts source into contentElement', () => {
    const host = document.createElement('div');
    document.body.append(host);
    hosts.push(host);

    const editor = new CodeEditor(host, {
      chrome: 'bar',
      doc: emptyEditorDoc(''),
      plugins: [CodeBlockPlugin({ surface: 'workspace' })],
    });
    Reflect.set(host, '__editor', editor);

    const content = editor.contentElement();
    expect(content?.getAttribute('data-ocm-shell')).toBe('true');
    expect(content?.classList.contains('ocm-code-root')).toBe(true);
    expect(content?.querySelector('.ocm-source-editor')).toBeTruthy();
    expect(host.querySelector('[data-id="undo"]')).toBeNull();
  });

  it('workspace ignores decoy .ocm-content outside contentElement', () => {
    const host = document.createElement('div');
    document.body.append(host);
    hosts.push(host);

    const decoy = document.createElement('div');
    decoy.className = 'ocm-content';
    host.append(decoy);

    const editor = new CodeEditor(host, {
      chrome: 'bar',
      doc: emptyEditorDoc('x'),
      plugins: [CodeBlockPlugin({ surface: 'workspace' })],
    });
    Reflect.set(host, '__editor', editor);

    expect(decoy.querySelector('.ocm-source-editor')).toBeNull();
    expect(editor.contentElement()?.querySelector('.ocm-source-editor')).toBeTruthy();
  });
});
