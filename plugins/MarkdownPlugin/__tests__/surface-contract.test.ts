/**
 * Surface/feature contract: atom must not pollute chrome; workspace requires MD SoT.
 */
import { describe, expect, it, afterEach } from 'vitest';
import {
  Editor as WysiwygEditor,
  createDefaultPlugins as createWysiwygPlugins,
} from 'on-codemerge/app';
import { Editor as MdEditor, MarkdownPlugin, emptyEditorDoc } from 'on-codemerge/markdown';

describe('MarkdownPlugin surface contract', () => {
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

  it('atom defaults: Insert Markdown chrome, no workspace undo chrome', () => {
    const host = document.createElement('div');
    document.body.append(host);
    hosts.push(host);

    const editor = new WysiwygEditor(host, {
      chrome: 'bar',
      plugins: [MarkdownPlugin({ surface: 'atom' })],
    });
    Reflect.set(host, '__editor', editor);

    const ids = [...host.querySelectorAll('[data-id]')].map((el) => el.getAttribute('data-id'));
    expect(ids).not.toContain('undo');
    expect(ids).not.toContain('md-redo');

    const shortcutKeys = editor.listShortcuts().map((s) => s.keys);
    expect(shortcutKeys).toContain('Mod-Alt-m');
  });

  it('atom + WYSIWYG createDefaultPlugins does not throw heading collision', () => {
    const host = document.createElement('div');
    document.body.append(host);
    hosts.push(host);

    expect(() => {
      const editor = new WysiwygEditor(host, {
        chrome: 'bar',
        plugins: createWysiwygPlugins(),
      });
      Reflect.set(host, '__editor', editor);
    }).not.toThrow();
  });

  it('workspace on CE ViewPort throws (needs shell contentTarget)', () => {
    const host = document.createElement('div');
    document.body.append(host);
    hosts.push(host);

    // Default WYSIWYG prose is a valid prose-MD SoT shape; workspace still needs shell.
    expect(() => {
      const bad = new WysiwygEditor(host, {
        chrome: 'bar',
        plugins: [MarkdownPlugin({ surface: 'workspace' })],
      });
      Reflect.set(host, '__editor', bad);
    }).toThrow(/createShellView contentTarget/);
  });

  it('workspace rejects legacy markdown blob SoT', () => {
    const host = document.createElement('div');
    document.body.append(host);
    hosts.push(host);

    expect(() => {
      const bad = new MdEditor(host, {
        chrome: 'bar',
        doc: {
          type: 'doc',
          content: [{ type: 'markdown', attrs: { text: '# x\n' }, content: [] }],
        },
        plugins: [MarkdownPlugin({ surface: 'workspace' })],
      });
      Reflect.set(host, '__editor', bad);
    }).toThrow(/emptyEditorDoc|Unknown node type: markdown|prose Markdown SoT/);
  });

  it('workspace with emptyEditorDoc mounts dual-pane into contentElement', () => {
    const host = document.createElement('div');
    document.body.append(host);
    hosts.push(host);

    const editor = new MdEditor(host, {
      chrome: 'bar',
      doc: emptyEditorDoc('# hi\n'),
      plugins: [MarkdownPlugin({ surface: 'workspace' })],
    });
    Reflect.set(host, '__editor', editor);

    const root = editor.contentElement();
    expect(root?.classList.contains('ocm-md-root')).toBe(true);
    expect(root?.querySelector('.ocm-md-panes')).toBeTruthy();
    expect(root?.querySelector('.ocm-md-gutter')).toBeTruthy();
    expect(root?.querySelector('textarea[aria-label="Source editor"]')).toBeTruthy();
    expect(root?.querySelector('.ocm-md-preview')).toBeTruthy();
  });

  it('getText/setText + getHTML/setHTML; getMarkdown/setMarkdown stay stubs', () => {
    const host = document.createElement('div');
    document.body.append(host);
    hosts.push(host);

    const editor = new MdEditor(host, {
      chrome: 'bar',
      doc: emptyEditorDoc(''),
    });
    Reflect.set(host, '__editor', editor);

    expect(editor.setText('# x\n')).toBeNull();
    expect(editor.getText()).toBe('# x\n');
    expect(editor.getHTML()).toMatch(/<h1[^>]*>x<\/h1>/i);
    expect(editor.getMarkdown()).toBe('');
    editor.setHTML('<h2>from-html</h2><p>body</p>');
    expect(editor.getText()).toMatch(/from-html/);
    expect(editor.getHTML()).toMatch(/from-html/);
    editor.setMarkdown('# y');
    expect(editor.getText()).toMatch(/from-html/);
  });
});
