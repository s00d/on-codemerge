import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createDoc,
  createParagraph,
  createState,
  createText,
  applyTransaction,
  transaction,
} from '@on-codemerge/kernel';
import { DisposableScope, OwnedSlot, teardownOwnable } from '../disposable';
import { createPluginContext } from '../context';
import { isDeclarativeWidget } from '../plugin';
import {
  attrString,
  expandOffsetToWord,
  findAncestorPath,
  insertAtomAfter,
  convertBlockType,
  replaceBlockType,
  resolveInsertSite,
  setBlockAttr,
  setMarkAttrs,
  withMarkTarget,
  wrapInList,
} from '../commands';
import { NotifyService } from '../ui/notify';
import { ContextMenuService } from '../ui/context-menu';
import { PopupController, PopupService } from '../ui/popup';
import { clearPortalRoot, getPortalRoot, setPortalRoot } from '../ui/portal';
import { downloadBlob, downloadUrl, h, pickFile } from '../ui/view';
import { ToolbarPanel } from '../ui/toolbar';
import { createI18n } from '@i18n-micro/runtime';

import type { EditorAPI } from '../types';

function fakeEditor(host: HTMLElement): EditorAPI {
  const state = createState(createDoc([createParagraph([createText('hello world')])]));
  const popup = new PopupService(undefined, host);
  const menu = new ContextMenuService(undefined, host);
  const api = {
    host,
    getJSON: () => ({ version: 1, doc: state.doc }),
    getState: () => state,
    getSelection: () => state.selection,
    setSelection: (sel: typeof state.selection) => {
      state.selection = sel;
    },
    notify: vi.fn(),
    on: vi.fn(() => () => {}),
    toolbar: { add: vi.fn(() => () => {}), remove: vi.fn(), refresh: vi.fn() },
    ui: { popup, menu, contextMenu: menu, notify: new NotifyService(undefined, popup, host) },
  };
  return api as unknown as EditorAPI;
}

describe('sdk gaps', () => {
  afterEach(() => {
    clearPortalRoot(undefined, true);
    vi.useRealTimers();
  });

  it('disposable scope covers own, slot, timers, and errors', () => {
    expect.hasAssertions();
    vi.useFakeTimers();
    const scope = new DisposableScope();
    const destroyed = vi.fn();
    const disposed = vi.fn();
    const hidden = vi.fn();
    scope.own({ destroy: destroyed });
    teardownOwnable({ dispose: disposed });
    teardownOwnable({ hide: hidden });
    teardownOwnable({});
    expect(disposed).toHaveBeenCalledWith();
    expect(hidden).toHaveBeenCalledWith();

    const slot = scope.slot<{ destroy: () => void }>();
    const a = { destroy: vi.fn() };
    const b = { destroy: vi.fn() };
    slot.replace(a);
    slot.replace(a);
    slot.replace(b);
    expect(a.destroy).toHaveBeenCalledTimes(1);
    expect(slot.value).toBe(b);
    slot.clear();

    let ticks = 0;
    const stopI = scope.interval(10, () => {
      ticks += 1;
    });
    const stopT = scope.timeout(10, () => {
      ticks += 1;
    });
    vi.advanceTimersByTime(20);
    stopI();
    stopT();
    const child = scope.child();
    child.disposable(() => {
      throw new Error('boom');
    });
    const err = vi.spyOn(console, 'error').mockReturnValue();
    scope.dispose();
    expect(scope.isDisposed).toBe(true);
    scope.dispose();
    const ran = vi.fn();
    scope.disposable(ran);
    expect(ran).toHaveBeenCalledWith();
    expect(destroyed).toHaveBeenCalledWith();
    expect(ticks).toBeGreaterThan(0);
    err.mockRestore();
    expect(new OwnedSlot(new DisposableScope()).value).toBeNull();
  });

  it('plugin context wires toolbar, popup, menu, mount, sibling, defer', async () => {
    expect.hasAssertions();
    const parent = document.createElement('div');
    const host = document.createElement('div');
    parent.append(host);
    document.body.append(parent);
    const editor = fakeEditor(host);
    const ctx = createPluginContext({
      editor,
      name: 'demo',
      resolveTarget: () => host,
    });
    const off = ctx.on('docChanged', () => {});
    off();
    ctx.onDom('content', 'click', () => {});
    ctx.toolbar.add({ id: 'x', label: 'X', onClick: () => {} });
    const handle = ctx.popup.open({ title: 'T', items: [] });
    handle.hide();
    const session = ctx.popup.session();
    expect(session).toBeInstanceOf(PopupController);
    ctx.menu.open([{ label: 'A', onClick: () => {} }], 4, 8);
    ctx.menu.open([{ label: 'B' }], { x: 1, y: 2 });
    ctx.notify('hi');
    ctx.disposable(() => {});
    const child = ctx.child();
    ctx.own({ hide: () => {} });
    const mounted = ctx.mount(host, h('span', null, 'm'));
    expect(mounted.el.textContent).toBe('m');
    const before = ctx.insertSibling('before', h('span', null, 'b'));
    const after = ctx.insertSibling('after', h('em', null, 'a'));
    expect(before.el.textContent).toBe('b');
    expect(after.el.textContent).toBe('a');

    const orphan = document.createElement('div');
    const orphanEditor = fakeEditor(orphan);
    const orphanCtx = createPluginContext({
      editor: orphanEditor,
      name: 'orphan',
      resolveTarget: () => orphan,
    });
    orphanCtx.insertSibling('before', h('i', null, 'o'));
    orphanCtx.insertSibling('after', h('i', null, 'p'));

    const err = vi.spyOn(console, 'error').mockReturnValue();
    ctx.defer(Promise.reject(new Error('nope')));
    ctx.defer(() => Promise.resolve());
    await Promise.resolve();
    expect(err).toHaveBeenCalledWith(
      expect.stringContaining('deferred task failed'),
      expect.any(Error)
    );
    err.mockRestore();
    ctx.scope.dispose();
    orphanCtx.scope.dispose();
    child.dispose();
    parent.remove();
    expect(isDeclarativeWidget({ render: () => h('span') })).toBe(true);
    expect(isDeclarativeWidget({} as { render: () => ReturnType<typeof h> })).toBe(false);
  });

  it('notify and context menu cover variants', async () => {
    expect.hasAssertions();
    vi.useFakeTimers();
    const host = document.createElement('div');
    document.body.append(host);
    const popup = new PopupService(undefined, host);
    const notify = new NotifyService(undefined, popup, host);
    notify.success('s');
    notify.error('e');
    notify.warning('w');
    notify.info('i');
    notify.show({ message: 'stay', duration: 0 });
    expect(host.textContent).toContain('stay');
    vi.advanceTimersByTime(4000);
    expect(host.textContent).toContain('stay');

    const confirmSpy = vi.spyOn(globalThis, 'confirm').mockReturnValue(true);
    const promptSpy = vi.spyOn(globalThis, 'prompt').mockReturnValue('ok');
    const bare = new NotifyService(undefined, null, host);
    await expect(bare.confirm({ title: 'T', message: 'M', variant: 'danger' })).resolves.toBe(true);
    await expect(bare.prompt('q', 'd')).resolves.toBe('ok');
    confirmSpy.mockRestore();
    promptSpy.mockRestore();

    const no = notify.confirm('plain');
    host.querySelectorAll('button').forEach((btn) => {
      if (btn.textContent === 'Cancel') {
        btn.click();
      }
    });
    await expect(no).resolves.toBe(false);
    const yes = notify.confirm({
      message: 'go',
      confirmLabel: 'Yes',
      cancelLabel: 'No',
      variant: 'danger',
    });
    host.querySelectorAll('button').forEach((btn) => {
      if (btn.textContent === 'Yes') {
        btn.click();
      }
    });
    await expect(yes).resolves.toBe(true);
    notify.destroy();
    bare.destroy();

    const menu = new ContextMenuService(undefined, host);
    menu.open(
      [
        { type: 'divider' },
        { type: 'group', groupTitle: 'G', subMenu: [{ label: 'sub', onClick: vi.fn() }] },
        {
          label: 'nest',
          subMenu: [{ label: 'inner', onClick: vi.fn() }],
        },
        { label: 'go', onClick: vi.fn(), icon: '<svg></svg>' },
        { label: 'nope', disabled: () => true, onClick: vi.fn() },
        { title: 'titled' },
      ],
      {
        anchor: {
          left: 10_000,
          bottom: 10_000,
          top: 0,
          right: 0,
          width: 0,
          height: 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        },
      }
    );
    vi.advanceTimersByTime(1);
    const go = [...host.querySelectorAll('button')].find((b) => b.textContent?.includes('go'));
    go?.click();
    const disabled = [...host.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('nope')
    );
    disabled?.click();
    menu.hide();
    menu.hide();
    menu.open([{ label: 'out' }], { x: 1, y: 1 });
    document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    popup.open({
      title: 'S',
      size: 'lg',
      closeOnClickOutside: true,
      items: [
        { type: 'text', id: 't', value: 'body' },
        { type: 'list', id: 's', options: ['a'] },
        { type: 'checkbox', id: 'c', value: true },
        { type: 'textarea', id: 'ta', value: 'x' },
      ],
      buttons: [{ label: 'Cancel', variant: 'secondary', onClick: () => {} }],
    });
    host
      .querySelector('.ocm-popup-overlay')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    popup.destroy();
    host.remove();

    const fields = document.createElement('div');
    document.body.append(fields);
    const form = new PopupService(undefined, fields);
    const handle = form.open({
      closeOnClickOutside: false,
      items: [
        { type: 'textarea', id: 'ta', label: 'T', value: 'a', onChange: () => {} },
        { type: 'checkbox', id: 'cb', value: false, onChange: () => {} },
        { type: 'radio', id: 'r', options: ['a', 'b'], onChange: () => {} },
        { type: 'number', id: 'n', value: 2, onChange: () => {} },
        { type: 'color', id: 'col', value: '#fff' },
        { type: 'url', id: 'u', placeholder: 'http' },
        { type: 'file', id: 'f', onChange: () => {} },
        { type: 'view', id: 'v', view: () => h('span', null, 'view') },
        { type: 'divider', id: 'd' },
      ],
      buttons: [
        {
          label: 'Keep',
          variant: 'primary',
          onClick: () => true,
        },
      ],
    });
    fields.querySelector('textarea')?.dispatchEvent(new Event('input'));
    fields.querySelector('input[type="checkbox"]')?.dispatchEvent(new Event('change'));
    fields.querySelector('select')?.dispatchEvent(new Event('change'));
    fields.querySelector('input[type="number"]')?.dispatchEvent(new Event('input'));
    fields.querySelector('input[type="file"]')?.dispatchEvent(new Event('change'));
    expect(handle.getValues().ta).toBeDefined();
    handle.update({ title: 'next', items: [{ type: 'text', id: 'only', value: 'z' }] });
    form.hide();
    handle.update({ title: 'reopen', items: [] });
    form.destroy();
    fields.remove();

    const named = document.createElement('div');
    named.dataset.ocmPortal = 'quoted"name';
    document.body.append(named);
    clearPortalRoot('quoted"name', false);
    expect(getPortalRoot('quoted"name')).toBe(named);
    const custom = document.createElement('div');
    setPortalRoot('custom', custom);
    expect(getPortalRoot(custom)).toBe(custom);
    clearPortalRoot('custom', true);
    named.remove();

    const barHost = document.createElement('div');
    const bar = new ToolbarPanel(barHost, () => {});
    const off = bar.add({
      id: 'b',
      label: 'B',
      group: 'g',
      order: 1,
      active: () => true,
      disabled: () => false,
      onClick: () => {},
    });
    bar.add({ id: 'cmd', command: 'undo', onClick: undefined });
    bar.refresh();
    barHost
      .querySelector('[data-id="cmd"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    off();
    bar.clear();
    bar.destroy();

    const createUrl = vi.fn(() => 'blob:1');
    const revokeUrl = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL: createUrl, revokeObjectURL: revokeUrl });
    downloadUrl('data:text/plain,hi', 'a.txt');
    downloadBlob('hi', 'b.txt', 'text/plain');
    expect(createUrl).toHaveBeenCalledWith(expect.any(Blob));
    vi.unstubAllGlobals();
    const picked = pickFile({ accept: '.txt', multiple: true });
    document.querySelector('input[type="file"]')?.dispatchEvent(new Event('change'));
    await picked;

    const i18n = createI18n({
      locale: 'en',
      fallbackLocale: 'en',
      missingWarn: false,
      messages: { en: { demo: { a: 'A', b: 'B' }, greeting: 'Hello, {name}!' } },
    });
    i18n.locale = 'de';
    expect(i18n.ts('missing.key')).toBe('missing.key');
    expect(i18n.ts('demo.a')).toBe('A');
    expect(i18n.ts('demo.b')).toBe('B');
    i18n.addTranslations('de', { demo: { a: 'Ä' } }, true);
    expect(i18n.ts('demo.a')).toBe('Ä');
    i18n.locale = 'en';
    expect(i18n.ts('greeting', { name: 'Ada' })).toBe('Hello, Ada!');
  });

  it('command helpers cover marks, atoms, and insert sites', () => {
    expect.hasAssertions();
    expect(attrString(1, 'f')).toBe('f');
    expect(attrString('x')).toBe('x');
    expect(expandOffsetToWord('', 0)).toStrictEqual({ from: 0, to: 0 });
    expect(expandOffsetToWord('hi there', 3).to).toBeGreaterThan(3);
    expect(expandOffsetToWord(' , ', 1)).toStrictEqual({ from: 1, to: 1 });
    expect(expandOffsetToWord('hi there', 4).from).toBe(3);

    const host = document.createElement('div');
    const editor = fakeEditor(host);
    editor.setSelection({ anchor: { path: [0], offset: 1 }, focus: { path: [0], offset: 1 } });
    withMarkTarget(editor, () => {});
    expect(editor.getSelection().anchor.offset).toBe(0);
    editor.setSelection({ anchor: { path: [0], offset: 0 }, focus: { path: [0], offset: 5 } });
    let called = false;
    withMarkTarget(editor, () => {
      called = true;
    });
    expect(called).toBe(true);

    const state = createState(createDoc([createParagraph([createText('ab')])]));
    expect(setMarkAttrs('bold', { x: 1 })(state)).toBeNull();
    state.selection = { anchor: { path: [0], offset: 0 }, focus: { path: [0], offset: 2 } };
    expect(setMarkAttrs('bold', { x: 1 })(state)?.[0]?.type).toBe('set_mark');
    expect(setBlockAttr('align', 'center')(state)?.[0]?.type).toBe('set_attrs');
    const listedAlign = createState(
      createDoc([
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [createText('a')] },
            { type: 'listItem', content: [createText('b')] },
          ],
        },
      ])
    );
    listedAlign.selection = {
      anchor: { path: [0, 1], offset: 0 },
      focus: { path: [0, 1], offset: 0 },
    };
    expect(setBlockAttr('align', 'center')(listedAlign)?.[0]).toMatchObject({
      path: [0, 1],
      type: 'set_attrs',
    });
    expect(replaceBlockType('heading', { level: 2 })(state)?.length).toBe(2);
    const listedTwo = createState(
      createDoc([
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [createText('a')] },
            { type: 'listItem', content: [createText('b')] },
          ],
        },
      ])
    );
    listedTwo.selection = {
      anchor: { path: [0, 1], offset: 0 },
      focus: { path: [0, 1], offset: 0 },
    };
    expect(replaceBlockType('heading', { level: 1 })(listedTwo)).toBeNull();
    const converted = convertBlockType('heading', { level: 1 })(listedTwo);
    expect(converted).not.toBeNull();
    const afterList = applyTransaction(listedTwo, transaction(...converted!)).state;
    expect(afterList.doc.content?.some((n) => n.type === 'heading')).toBe(true);
    expect(afterList.doc.content?.some((n) => n.type === 'bulletList')).toBe(true);
    expect(findAncestorPath(state.doc, [0, 9], 'paragraph')).toStrictEqual([0]);
    expect(findAncestorPath(state.doc, [], 'paragraph')).toBeNull();
    expect(resolveInsertSite(state.doc, [])).toStrictEqual({ path: [], index: 1 });

    const atom = insertAtomAfter('image', { src: 'a' });
    expect(atom(state)).not.toBeNull();
    expect(wrapInList('bulletList')(state)).not.toBeNull();
    const listed = createState(
      createDoc([
        {
          type: 'bulletList',
          content: [{ type: 'listItem', content: [createText('a')] }],
        },
      ])
    );
    expect(wrapInList('bulletList')(listed)).not.toBeNull();
    expect(wrapInList('orderedList')(listed)).not.toBeNull();
    const emptyDoc = createState(createDoc([]));
    emptyDoc.selection = { anchor: { path: [9], offset: 0 }, focus: { path: [9], offset: 0 } };
    expect(wrapInList('bulletList')(emptyDoc)).toBeNull();
  });
});
