import { describe, expect, it, afterEach } from 'vitest';
import { Editor, createDefaultPlugins, emptyEditorDoc } from '../../app';

describe('Markdown Editor', () => {
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

  it('getText / setText + oversized leaves SoT unchanged', () => {
    const host = document.createElement('div');
    document.body.append(host);
    hosts.push(host);
    const editor = new Editor(host, {
      chrome: 'bar',
      doc: emptyEditorDoc('# a\n'),
      plugins: createDefaultPlugins(),
    });
    Reflect.set(host, '__editor', editor);

    expect(editor.setText('# b\n')).toBeNull();
    expect(editor.getText()).toBe('# b\n');

    const err = editor.setText('x'.repeat(1_000_001));
    expect(err).not.toBeNull();
    expect(editor.getText()).toBe('# b\n');
  });

  it('getHTML / setHTML round-trip via preview + prose converters', () => {
    const host = document.createElement('div');
    document.body.append(host);
    hosts.push(host);
    const editor = new Editor(host, {
      chrome: 'bar',
      doc: emptyEditorDoc(''),
      plugins: createDefaultPlugins(),
    });
    Reflect.set(host, '__editor', editor);

    editor.setHTML('<h2>Title</h2><p>Hello <strong>world</strong></p>');
    expect(editor.getText()).toMatch(/Title/);
    expect(editor.getHTML()).toMatch(/Title/);
    expect(editor.getHTML()).toMatch(/<strong>world<\/strong>/i);
  });

  it('getPublishedHTML / getPublishedDocument use preview projector', () => {
    const host = document.createElement('div');
    document.body.append(host);
    hosts.push(host);
    const editor = new Editor(host, {
      chrome: 'bar',
      doc: emptyEditorDoc('# Published\n\nHello **world**\n'),
      plugins: createDefaultPlugins(),
    });
    Reflect.set(host, '__editor', editor);

    const published = editor.getPublishedHTML();
    expect(published).toMatch(/Published/);
    expect(published).toMatch(/<strong>world<\/strong>/i);
    expect(editor.getPublishedJS()).toBeNull();

    const doc = editor.getPublishedDocument();
    expect(doc).toContain('<!DOCTYPE html>');
    expect(doc).toContain(published);
    expect(doc).toContain('public.css');
    expect(doc).not.toContain('public.js');
  });

  it('getPublishedHTML wraps mermaid with md-mermaid runtime', () => {
    const host = document.createElement('div');
    document.body.append(host);
    hosts.push(host);
    const editor = new Editor(host, {
      chrome: 'bar',
      doc: emptyEditorDoc('```mermaid\nflowchart LR\n  A-->B\n```\n'),
      plugins: createDefaultPlugins(),
    });
    Reflect.set(host, '__editor', editor);

    const published = editor.getPublishedHTML();
    expect(published).toContain('data-ocm-runtime="md-mermaid"');
    expect(published).toContain('data-node="mermaid"');
    expect(editor.getPublishedJS()).toContain('public.js');
    expect(editor.getPublishedDocument()).toContain('public.js');
  });

  it('getHTML / setHTML round-trips callout + mermaid bodies', () => {
    const host = document.createElement('div');
    document.body.append(host);
    hosts.push(host);
    const editor = new Editor(host, {
      chrome: 'bar',
      doc: emptyEditorDoc(''),
      plugins: createDefaultPlugins(),
    });
    Reflect.set(host, '__editor', editor);

    expect(
      editor.setText(`:::info Tip
Hello

@btn[Go](#)
:::

\`\`\`mermaid
flowchart LR
  A-->B
\`\`\`
`)
    ).toBeNull();
    const html = editor.getHTML();
    expect(html).toContain('data-node="callout"');
    expect(html).toContain('data-node="mermaid"');
    editor.setHTML(html);
    const text = editor.getText();
    expect(text).toContain(':::info Tip');
    expect(text).toContain('Hello');
    expect(text).toContain('@btn[Go](#)');
    expect(text).toContain('```mermaid');
    expect(text).toContain('A-->B');
  });
});
