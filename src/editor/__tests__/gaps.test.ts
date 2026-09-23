import { describe, expect, it, vi } from 'vitest';
import { createDoc, createParagraph, createText, insertText } from '@on-codemerge/kernel';
import { Editor } from '../Editor';
import { InputBridge, selectionFromOffsets } from '../../view/InputBridge';
import { docToHTML, htmlToDoc } from '../../io/html';
import { parseJSON, serializeJSON } from '../../io/json';
import { sanitizeHTML } from '../../io/sanitize';
import {
  createPlatform,
  destroyPlatform,
  registerPlugin,
  runExtensionSetup,
} from '../../platform/Extension';
import { TrackChangesPlugin } from '../../plugins/TrackChangesPlugin';

function mount() {
  const host = document.createElement('div');
  document.body.append(host);
  return host;
}

describe('editor and io gaps', () => {
  it('editor locale, json, html, shortcuts, toolbar, destroy', async () => {
    expect.hasAssertions();
    const host = mount();
    const editor = new Editor(host, {
      locale: 'en',
      doc: { version: 1, doc: createDoc([createParagraph([createText('a')])]) },
      plugins: [
        {
          name: 'extra',
          hotkeys: [{ keys: 'Mod-K', command: 'noop', description: '' }],
          shortcuts: [
            { keys: 'Mod-B', command: 'toggleBold' },
            { keys: 'Mod-L', command: 'noop' },
          ],
          setup: (ctx) => {
            ctx.onDom('chrome', 'click', () => {});
          },
        },
      ],
    });
    expect(editor.getLocale()).toBe('en');
    expect(editor.redo()).toBe(false);
    editor.registerLocale('ru', { greet: { hi: 'привет' } });
    await editor.setLocale('ru');
    expect(editor.t('greet.hi')).toBe('привет');
    editor.notify('saved');
    editor.notify({ message: 'err', type: 'error', duration: 0 });
    expect(editor.listShortcuts().some((s) => s.keys === 'Mod-K')).toBe(true);
    expect(editor.listShortcuts().some((s) => s.keys === 'Mod-L')).toBe(true);

    editor.setJSON(createDoc([createParagraph([createText('json')])]));
    expect(editor.getJSON().doc.content?.[0]?.content?.[0]?.text).toBe('json');
    editor.setHTML('<h2>Title</h2><p>Body</p>');
    expect(editor.getHTML()).toMatch(/Title/);
    expect(editor.getState().doc.type).toBe('doc');
    expect(editor.command('missing')).toBe(false);
    editor.run(insertText('hist'));
    expect(editor.undo()).toBe(true);
    expect(editor.redo()).toBe(true);

    const off = editor.on('docChanged', () => {});
    editor.on('selectionChanged', () => {});
    off();
    editor.toolbar.add({ id: 'custom', label: 'C', onClick: () => {} });
    editor.toolbar.refresh();
    editor.toolbar.remove('custom');

    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', metaKey: true, bubbles: true }));
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'y', ctrlKey: true, bubbles: true }));
    host.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'l', metaKey: true, shiftKey: true, bubbles: true })
    );
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));

    editor.use({ name: 'late', commands: { ping: () => null } });
    editor.destroy();
    editor.destroy();
    host.remove();
  });

  it('input bridge maps beforeinput and keys', () => {
    expect.hasAssertions();
    const host = mount();
    const editor = new Editor(host);
    const content = host.querySelector('.ocm-content');
    if (!(content instanceof HTMLElement)) {
      throw new Error(`missing content: ${host.innerHTML}`);
    }
    const dispatched: string[] = [];
    const bridge = new InputBridge(
      content,
      () => editor.getState(),
      (tr) => {
        dispatched.push(tr.ops.map((o) => o.type).join(','));
        editor.dispatch(tr);
      },
      () => false
    );
    content.dispatchEvent(
      new InputEvent('beforeinput', { inputType: 'insertText', data: 'Q', bubbles: true })
    );
    content.dispatchEvent(
      new InputEvent('beforeinput', { inputType: 'insertText', data: '', bubbles: true })
    );
    content.dispatchEvent(
      new InputEvent('beforeinput', { inputType: 'insertParagraph', bubbles: true })
    );
    content.dispatchEvent(
      new InputEvent('beforeinput', { inputType: 'deleteContentBackward', bubbles: true })
    );
    content.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    content.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', metaKey: true, bubbles: true }));
    content.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    Object.defineProperty(document, 'activeElement', { configurable: true, get: () => content });
    document.dispatchEvent(new Event('selectionchange'));
    bridge.destroy();
    bridge.destroy();
    expect(dispatched.length).toBeGreaterThan(0);
    expect(selectionFromOffsets([0], 1, 2).focus.offset).toBe(2);
    editor.destroy();
    host.remove();
  });

  it('html import/export covers blocks and marks', () => {
    expect.hasAssertions();
    const html = docToHTML({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [] },
        {
          type: 'heading',
          attrs: { level: 9 },
          content: [{ type: 'text', text: 'H', marks: [{ type: 'bold' }, { type: 'code' }] }],
        },
        {
          type: 'bulletList',
          content: [{ type: 'listItem', content: [{ type: 'text', text: 'li' }] }],
        },
        { type: 'orderedList', content: [] },
        {
          type: 'table',
          content: [{ type: 'tableRow', content: [{ type: 'tableCell', content: [] }] }],
        },
        { type: 'codeBlock', attrs: { language: 'ts', code: 'a<b' } },
        { type: 'code_block', content: [{ type: 'text', text: 'c' }] },
        { type: 'blockquote', content: [{ type: 'text', text: 'q' }] },
        { type: 'text', text: 'x&<>"' },
        { type: 'image', attrs: { src: 'a' } },
        { type: 'wrap', content: [{ type: 'text', text: 'w' }] },
      ],
    });
    expect(html).toContain('<h6>');
    expect(html).toContain('&amp;');
    const doc = htmlToDoc(
      '  loose  <p>Hi <strong>b</strong><em>i</em><u>u</u><s>s</s><br></p><h1>T</h1><ul></ul><ol><li>1</li></ol><table></table><div>d</div><span>sp</span>'
    );
    expect(doc.type).toBe('doc');
    expect(doc.content?.length).toBeGreaterThan(1);
    expect(htmlToDoc('')).toStrictEqual({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }],
    });
    expect(sanitizeHTML('<p onclick="x">ok</p><script>bad</script>')).not.toContain('script');
    const raw = serializeJSON(createDoc([createParagraph([createText('j')])]));
    expect(parseJSON(raw).type).toBe('doc');
    expect(() => parseJSON('1')).toThrow(/Invalid JSON/);
  });

  it('platform rejects duplicates and tears down', () => {
    expect.hasAssertions();
    expect(() => createPlatform([{ name: 'a' }, { name: 'a' }])).toThrow(/already/);
    expect(() => createPlatform([{ name: 'b', dependsOn: ['missing'] }])).toThrow(/depends/);
    expect(() =>
      createPlatform([
        { name: 'a', commands: { go: () => null } },
        { name: 'b', commands: { go: () => null } },
      ])
    ).toThrow(/Command already/);

    const platform = createPlatform([{ name: 'base', nodes: [{ name: 'note', group: 'block' }] }]);
    const host = mount();
    const editor = new Editor(host);
    const setup = vi.fn();
    registerPlugin(
      platform,
      { name: 'more', hotkeys: [{ keys: 'Mod-1', command: 'x' }], setup },
      editor
    );
    expect(setup).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'more',
        editor: expect.any(Object),
      })
    );
    runExtensionSetup(platform, [{ name: 'base' }], editor);
    const bareHost = document.createElement('div');
    registerPlugin(
      platform,
      {
        name: 'resolver',
        setup: (ctx) => {
          ctx.onDom('content', 'click', () => {});
          ctx.onDom('host', 'click', () => {});
        },
      },
      { host: bareHost } as never
    );
    expect(() => {
      registerPlugin(platform, { name: 'more' }, editor);
    }).toThrow(/already/);
    expect(() => {
      registerPlugin(platform, { name: 'z', dependsOn: ['nope'] }, editor);
    }).toThrow(/depends/);
    platform.commands.set('go', () => null);
    expect(() => {
      registerPlugin(platform, { name: 'dup', commands: { go: () => null } }, editor);
    }).toThrow(/Command already/);
    destroyPlatform(platform);
    editor.destroy();
    host.remove();
  });

  it('paused selection sync and insert still type', () => {
    expect.hasAssertions();
    const host = mount();
    const editor = new Editor(host);
    editor.run(insertText('z'));
    expect(editor.getJSON().doc.content?.[0]?.content?.[0]?.text).toContain('z');
    const content = host.querySelector('.ocm-content');
    if (!(content instanceof HTMLElement)) {
      throw new Error(`missing content: ${host.innerHTML}`);
    }
    const bridge = new InputBridge(
      content,
      () => editor.getState(),
      () => {},
      () => true
    );
    document.dispatchEvent(new Event('selectionchange'));
    content.dispatchEvent(new MouseEvent('mouseup'));
    bridge.destroy();
    editor.destroy();
    host.remove();
  });

  it('stored marks and soft-delete wire into typing', () => {
    expect.hasAssertions();
    const host = mount();
    const editor = new Editor(host, { plugins: [TrackChangesPlugin()] });
    expect(editor.getStoredMarks()).toStrictEqual([]);
    expect(editor.getSoftDeleteMark()).toBeNull();
    editor.setStoredMarks([{ type: 'insertion', attrs: { author: 't' } }]);
    editor.setSoftDeleteMark({ type: 'deletion', attrs: { author: 't' } });
    expect(editor.getStoredMarks()[0]?.type).toBe('insertion');
    expect(editor.getSoftDeleteMark()?.type).toBe('deletion');
    editor.run(insertText('ab', editor.getStoredMarks()));
    expect(
      editor
        .getJSON()
        .doc.content?.[0]?.content?.some((n) => n.marks?.some((m) => m.type === 'insertion'))
    ).toBe(true);
    editor.setStoredMarks([]);
    editor.setSoftDeleteMark(null);
    expect(editor.getStoredMarks()).toStrictEqual([]);
    expect(editor.getSoftDeleteMark()).toBeNull();
    editor.destroy();
    host.remove();
  });
});
