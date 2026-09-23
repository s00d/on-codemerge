import { describe, expect, it } from 'vitest';
/**
 * @jest-environment jsdom
 */
import { Editor } from '../Editor';
import { insertText } from '@on-codemerge/kernel';
import { HistoryPlugin } from '../../plugins/HistoryPlugin';
import { TypographyPlugin } from '../../plugins/TypographyPlugin';

describe('editor facade', () => {
  it('types via dispatch and exposes getJSON', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const editor = new Editor(host);
    editor.run(insertText('Hello'));
    expect(editor.getJSON().doc.content![0].content![0].text).toBe('Hello');
    expect(editor.getHTML()).toContain('Hello');
    editor.destroy();
    host.remove();
  });

  it('getPublishedDocument links css and omits js without runtimes', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const editor = new Editor(host);
    editor.run(insertText('Pub'));
    expect(editor.getPublishedJS()).toBeNull();
    const doc = editor.getPublishedDocument();
    expect(doc).toContain('public.css');
    expect(doc).not.toContain('public.js');
    expect(doc).toContain('Pub');
    editor.destroy();
    host.remove();
  });

  it('undo/redo via history', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const editor = new Editor(host, { history: { mergeWindowMs: 0 } });
    editor.run(insertText('x'));
    expect(editor.undo()).toBe(true);
    expect(editor.getJSON().doc.content![0].content![0].text).toBe('');
    expect(editor.redo()).toBe(true);
    expect(editor.getJSON().doc.content![0].content![0].text).toBe('x');
    editor.destroy();
    host.remove();
  });

  it('setMarkdown / getMarkdown round-trip', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const editor = new Editor(host);
    editor.setMarkdown('## Hi\n\n**bold** text\n');
    expect(editor.getJSON().doc.content?.[0]?.type).toBe('heading');
    expect(editor.getMarkdown()).toContain('## Hi');
    expect(editor.getMarkdown()).toContain('**bold**');
    editor.destroy();
    host.remove();
  });

  it('registers typography plugin commands', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const editor = new Editor(host, { plugins: [TypographyPlugin()] });
    editor.run(insertText('abc'));
    editor.setSelection({
      anchor: { offset: 0, path: [0] },
      focus: { offset: 3, path: [0] },
    });
    expect(editor.command('toggleBold')).toBe(true);
    const { marks } = editor.getJSON().doc.content![0].content![0];
    expect(marks?.some((m) => m.type === 'bold')).toBe(true);
    // Second toggle must remove bold
    editor.setSelection({
      anchor: { offset: 0, path: [0] },
      focus: { offset: 3, path: [0] },
    });
    expect(editor.command('toggleBold')).toBe(true);
    const after = editor.getJSON().doc.content![0].content ?? [];
    expect(after.every((n) => !n.marks?.some((m) => m.type === 'bold'))).toBe(true);
    editor.destroy();
    host.remove();
  });

  it('history plugin wires undo', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const editor = new Editor(host, {
      history: { mergeWindowMs: 0 },
      plugins: [HistoryPlugin()],
    });
    editor.run(insertText('z'));
    editor.undo();
    expect(editor.getJSON().doc.content![0].content![0].text).toBe('');
    editor.destroy();
    host.remove();
  });

  it('setHTML / notify / toolbar / locale / shortcuts', async () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const editor = new Editor(host, { plugins: [HistoryPlugin()] });
    editor.setHTML('<p>from-html</p>');
    expect(editor.getHTML()).toContain('from-html');
    editor.notify('toast');
    editor.notify({ message: 'T', type: 'info', duration: 0 });
    editor.registerLocale('xx', { toolbar: { bold: 'Bld' } });
    await editor.setLocale('xx');
    expect(editor.getLocale()).toBe('xx');
    expect(editor.t('toolbar.bold')).toBe('Bld');
    const shortcuts = editor.listShortcuts();
    expect(shortcuts.some((s) => s.keys === 'Mod-B')).toBe(true);
    const rem = editor.toolbar.add({
      id: 'test-btn',
      label: () => editor.t('toolbar.bold'),
      title: () => editor.t('toolbar.bold'),
      onClick: () => {},
    });
    expect(host.querySelector('[data-id="test-btn"]')?.getAttribute('title')).toBe('Bld');
    editor.registerLocale('yy', { toolbar: { bold: 'BoldYY' } });
    await editor.setLocale('yy');
    expect(host.querySelector('[data-id="test-btn"]')?.getAttribute('title')).toBe('BoldYY');
    editor.toolbar.refresh();
    rem();
    editor.toolbar.remove('test-btn');
    expect(editor.getState().doc.type).toBe('doc');
    editor.destroy();
    host.remove();
  });

  it('setJSON round-trip', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const editor = new Editor(host);
    const json = editor.getJSON();
    editor.run(insertText('keep'));
    editor.setJSON(json);
    expect(editor.getJSON().doc.content?.[0]?.content?.[0]?.text ?? '').not.toBe('keep');
    editor.destroy();
    host.remove();
  });

  it('colorScheme host leaves documentElement.dark alone', () => {
    expect.hasAssertions();
    document.documentElement.classList.remove('dark');
    const host = document.createElement('div');
    document.body.append(host);
    const editor = new Editor(host, { colorScheme: 'host' });
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    editor.destroy();
    host.remove();
  });

  it('colorScheme system toggles owned dark class and cleans up', () => {
    expect.hasAssertions();
    document.documentElement.classList.remove('dark');
    const listeners: ((e: MediaQueryListEvent) => void)[] = [];
    const mql = {
      matches: true,
      media: '(prefers-color-scheme: dark)',
      addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => {
        listeners.push(cb);
      },
      removeEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => {
        const i = listeners.indexOf(cb);
        if (i !== -1) {
          listeners.splice(i, 1);
        }
      },
    } as MediaQueryList;
    const prev = window.matchMedia;
    window.matchMedia = () => mql;

    const host = document.createElement('div');
    document.body.append(host);
    const editor = new Editor(host, { colorScheme: 'system' });
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    listeners[0]?.({ matches: false } as MediaQueryListEvent);
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    listeners[0]?.({ matches: true } as MediaQueryListEvent);
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    editor.destroy();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(listeners).toHaveLength(0);

    window.matchMedia = prev;
    host.remove();
  });

  it('page chrome hides sticky toolbar until content click', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const editor = new Editor(host, {
      chrome: 'page',
      plugins: [HistoryPlugin()],
    });
    expect(editor.chrome).toBe('page');
    expect(host.classList.contains('ocm-editor-root--page')).toBe(true);
    const toolbarHost = host.querySelector('.ocm-toolbar-host') as HTMLElement;
    expect(toolbarHost).toBeTruthy();
    expect(toolbarHost.classList.contains('is-page-open')).toBe(false);
    expect(toolbarHost.querySelector('.ocm-toolbar')).toBeTruthy();

    const content = host.querySelector('.ocm-content') as HTMLElement;
    content.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 40, clientY: 40 }));

    expect(toolbarHost.classList.contains('is-page-open')).toBe(true);
    expect(toolbarHost.querySelector('.ocm-toolbar[role="toolbar"]')).toBeTruthy();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(toolbarHost.classList.contains('is-page-open')).toBe(false);

    editor.destroy();
    host.remove();
  });

  it('page chrome hides float after toolbar button click', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const editor = new Editor(host, {
      chrome: 'page',
      plugins: [HistoryPlugin()],
    });
    const content = host.querySelector('.ocm-content') as HTMLElement;
    content.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 20, clientY: 20 }));

    const toolbarHost = host.querySelector('.ocm-toolbar-host') as HTMLElement;
    expect(toolbarHost.classList.contains('is-page-open')).toBe(true);

    // Prefer typed action path: any non-menu toolbar button dismisses float.
    const btn = toolbarHost.querySelector(
      'button.ocm-toolbar__btn:not(.ocm-toolbar__btn--menu):not([data-menu])'
    ) as HTMLButtonElement;
    expect(btn).toBeTruthy();
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(toolbarHost.classList.contains('is-page-open')).toBe(false);

    editor.destroy();
    host.remove();
  });

  it('page chrome keeps float open for menu triggers', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const editor = new Editor(host, {
      chrome: 'page',
      plugins: [HistoryPlugin()],
    });
    editor.toolbar.defineMenu({ id: 'insert', label: 'Insert' });
    editor.toolbar.add({
      id: 't-table',
      label: 'Table',
      menu: 'insert',
      onClick: () => {},
    });
    editor.toolbar.refresh();

    const content = host.querySelector('.ocm-content') as HTMLElement;
    content.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 20, clientY: 20 }));

    const toolbarHost = host.querySelector('.ocm-toolbar-host') as HTMLElement;
    expect(toolbarHost.classList.contains('is-page-open')).toBe(true);

    const menuBtn = toolbarHost.querySelector(
      'button.ocm-toolbar__btn--menu, button[data-menu]'
    ) as HTMLButtonElement;
    expect(menuBtn).toBeTruthy();
    menuBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    // Menu open is a typed `menu` action — float stays.
    expect(toolbarHost.classList.contains('is-page-open')).toBe(true);

    editor.destroy();
    host.remove();
  });

  it('page chrome toolbar mousedown does not move caret', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const editor = new Editor(host, {
      chrome: 'page',
      plugins: [HistoryPlugin()],
    });
    editor.run(insertText('Hello'));
    editor.setSelection({
      anchor: { path: [0], offset: 2 },
      focus: { path: [0], offset: 2 },
    });

    const content = host.querySelector('.ocm-content') as HTMLElement;
    content.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 20, clientY: 20 }));

    const toolbarHost = host.querySelector('.ocm-toolbar-host') as HTMLElement;
    expect(toolbarHost.classList.contains('is-page-open')).toBe(true);

    const before = editor.getSelection();
    const md = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    toolbarHost.dispatchEvent(md);
    expect(md.defaultPrevented).toBe(true);

    const after = editor.getSelection();
    expect(after.anchor.offset).toBe(before.anchor.offset);
    expect(after.focus.offset).toBe(before.focus.offset);

    editor.destroy();
    host.remove();
  });

  it('bar chrome keeps sticky toolbar by default', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const editor = new Editor(host);
    expect(editor.chrome).toBe('bar');
    expect(host.classList.contains('ocm-editor-root--page')).toBe(false);
    expect(host.querySelector('.ocm-toolbar-host > .ocm-toolbar')).toBeTruthy();
    editor.destroy();
    host.remove();
  });
});
