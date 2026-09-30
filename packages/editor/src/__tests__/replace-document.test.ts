/**
 * @jest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import { createDoc, createParagraph, createText, collapsedAt, insertText } from '@codemerge/kernel';
import type { PluginDefinition } from '@codemerge/sdk';
import { Editor } from '../Editor';
import type { ViewPort } from '../ViewPort';

function noopView(): ViewPort {
  return {
    update() {},
    destroy() {},
    contentTarget: () => new EventTarget(),
  };
}

describe('shared Editor replaceDocument', () => {
  it('resets selection; setJSON preserves/clamps', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const long = createDoc([createParagraph([createText('hello')])]);
    const editor = new Editor(host, {
      createView: () => noopView(),
      doc: long,
    });
    editor.setSelection(collapsedAt([0], 4));
    expect(editor.getSelection().anchor.offset).toBe(4);

    editor.replaceDocument(createDoc([createParagraph([createText('ab')])]));
    expect(editor.getSelection().anchor.offset).toBe(0);

    editor.setSelection(collapsedAt([0], 2));
    editor.setJSON(createDoc([createParagraph([createText('z')])]));
    // preserve path clamps offset 2 into length-1 text → end offset 1
    expect(editor.getSelection().anchor.offset).toBe(1);

    editor.destroy();
    host.remove();
  });

  it('replaceDocument clears history so undo does not throw on stale inverses', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const editor = new Editor(host, {
      createView: () => noopView(),
      doc: createDoc([createParagraph([createText('hello')])]),
    });
    editor.setSelection(collapsedAt([0], 5));
    expect(editor.run(insertText('!'))).toBe(true);
    expect(editor.undo()).toBe(true); // history works before replace

    editor.run(insertText('x'));
    editor.replaceDocument(createDoc([createParagraph([createText('ab')])]));
    expect(editor.undo()).toBe(false);
    expect(() => {
      editor.undo();
    }).not.toThrow();

    editor.destroy();
    host.remove();
  });

  it('listPlugins returns a copy', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const editor = new Editor(host, { createView: () => noopView() });
    const a = editor.listPlugins();
    const b = editor.listPlugins();
    expect(a).not.toBe(b);
    expect(() => {
      (a as PluginDefinition[]).push({ name: 'ghost' });
    }).not.toThrow();
    expect(editor.listPlugins()).toHaveLength(0);
    editor.destroy();
    host.remove();
  });
});
