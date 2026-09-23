import { afterEach, beforeEach, describe, expect, it } from 'vitest';
/**
 * @jest-environment jsdom
 */
import { Editor } from '../../editor/Editor';
import { createCorePlugins, createDefaultPlugins, createOpsCollabBinding } from '../index';
import { createDoc, createParagraph, createText, insertText } from '@on-codemerge/kernel';
import type { Operation } from '@on-codemerge/kernel';

function withSelection(editor: Editor, from: number, to: number) {
  editor.setSelection({
    anchor: { offset: from, path: [0] },
    focus: { offset: to, path: [0] },
  });
}

describe('plugins via SDK', () => {
  let editor: Editor, host: HTMLElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
    editor = new Editor(host, {
      history: { mergeWindowMs: 0 },
      plugins: createCorePlugins(),
    });
    editor.run(insertText('Hello world'));
  });

  afterEach(() => {
    editor.destroy();
    host.remove();
  });

  it('owns toolbar panel in core', () => {
    expect.hasAssertions();
    expect(host.querySelector('.ocm-toolbar')).toBeTruthy();
  });

  it('registers insert/review/tools menus in Editor core', () => {
    expect.hasAssertions();
    // Menus hide until items exist; add one per menu and check triggers.
    editor.toolbar.add({ id: 't-insert', label: 'I', menu: 'insert', onClick: () => {} });
    editor.toolbar.add({ id: 't-review', label: 'R', menu: 'review', onClick: () => {} });
    editor.toolbar.add({ id: 't-tools', label: 'T', menu: 'tools', onClick: () => {} });
    expect(host.querySelector('[data-menu="insert"]')).toBeTruthy();
    expect(host.querySelector('[data-menu="review"]')).toBeTruthy();
    expect(host.querySelector('[data-menu="tools"]')).toBeTruthy();
  });

  it('toggles marks via commands', () => {
    expect.hasAssertions();
    withSelection(editor, 0, 5);
    expect(editor.command('toggleBold')).toBe(true);
    const text = editor.getJSON().doc.content?.[0]?.content?.[0];
    expect(text?.marks?.some((m) => m.type === 'bold')).toBe(true);
    withSelection(editor, 0, 5);
    expect(editor.command('toggleBold')).toBe(true);
    const nodes = editor.getJSON().doc.content?.[0]?.content ?? [];
    expect(nodes.every((n) => !n.marks?.some((m) => m.type === 'bold'))).toBe(true);
  });

  it('heading and list and table', () => {
    expect.hasAssertions();
    expect(editor.command('setHeading1')).toBe(true);
    expect(editor.getJSON().doc.content?.[0]?.type).toBe('heading');
    editor.run(insertText('x'));
    expect(editor.command('wrapBulletList')).toBe(true);
  });

  it('opens popup from toolbar color button', () => {
    expect.hasAssertions();
    const btn = host.querySelector('[data-id="fore-color"]') as HTMLButtonElement | null;
    expect(btn).toBeTruthy();
    btn!.click();
    const popup =
      document.body.querySelector('.ocm-popup') ??
      document.querySelector('[data-ocm-portal="popup"] .ocm-popup');
    expect(popup).toBeTruthy();
    expect(popup!.querySelector('.ocm-color-well')).toBeTruthy();
    expect(popup!.querySelector('.ocm-color-well__sv')).toBeTruthy();
    editor.ui.popup.hide();
  });

  it('foreColor command opens the color well', () => {
    expect.hasAssertions();
    // UI-only commands return null transaction; side effect still opens the well.
    editor.command('foreColor');
    expect(document.querySelector('.ocm-color-well')).toBeTruthy();
    editor.ui.popup.hide();
  });

  it('color well swatch applies textColor mark', () => {
    expect.hasAssertions();
    withSelection(editor, 0, 5);
    editor.command('foreColor');
    const swatch = document.querySelector('.ocm-color-well__swatch') as HTMLButtonElement | null;
    expect(swatch).toBeTruthy();
    const hex = (swatch!.title || '').toLowerCase();
    swatch!.click();
    const text = editor.getJSON().doc.content?.[0]?.content?.[0];
    const mark = text?.marks?.find((m) => m.type === 'textColor');
    expect(mark?.attrs?.color?.toLowerCase()).toBe(hex);
    editor.ui.popup.hide();
  });

  it('loads default plugins without throw', () => {
    expect.hasAssertions();
    const h = document.createElement('div');
    document.body.append(h);
    const e = new Editor(h, { plugins: createDefaultPlugins() });
    expect(e.schema.nodes.has('chart')).toBe(true);
    e.destroy();
    h.remove();
  });
});

describe('ops collab binding', () => {
  it('applies remote ops', () => {
    expect.hasAssertions();
    const doc = createDoc([createParagraph([createText('ab')])]),
      remote: Operation[] = [],
      a = createOpsCollabBinding(doc, (ops) => remote.push(...ops));
    a.onLocal([{ offset: 2, path: [0], text: 'c', type: 'insert_text' }]);
    expect(a.getDoc().content?.[0]?.content?.[0]?.text).toBe('abc');
    const b = createOpsCollabBinding(doc);
    b.applyRemote(remote);
    expect(b.getDoc().content?.[0]?.content?.[0]?.text).toBe('abc');
  });
});
