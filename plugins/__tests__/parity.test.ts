import { describe, expect, it } from 'vitest';
/**
 * @jest-environment jsdom
 */
import { Editor } from '@ocm/wysiwyg/editor/Editor';
import { TablePlugin } from '@ocm/table-plugin';
import { ListsPlugin } from '@ocm/lists-plugin';
import { BlockPlugin } from '@ocm/block-plugin';
import { ToolbarPlugin } from '@ocm/toolbar-plugin';
import { createDoc, createParagraph, createText, insertText, splitBlock } from '@codemerge/kernel';
import { insertAtomAfter } from '@codemerge/sdk';
import { sizedEmptyGrid, attrsFromGrid } from '@ocm/table-plugin';

describe('wave1 lists/block', () => {
  it('wraps paragraph in list and Enter splits item', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const editor = new Editor(host, {
      plugins: [ToolbarPlugin(), ListsPlugin(), BlockPlugin()],
    });
    editor.run(insertText('hello'));
    expect(editor.command('wrapBulletList')).toBe(true);
    expect(editor.getJSON().doc.content?.[0]?.type).toBe('bulletList');
    editor.setSelection({
      anchor: { offset: 2, path: [0, 0] },
      focus: { offset: 2, path: [0, 0] },
    });
    editor.run(splitBlock);
    expect(editor.getJSON().doc.content?.[0]?.type).toBe('bulletList');
    expect(editor.getJSON().doc.content?.[0]?.content?.length).toBe(2);
    editor.destroy();
    host.remove();
  });

  it('duplicate and delete block via insertTextBlock', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const editor = new Editor(host, {
      doc: createDoc([createParagraph([createText('a')]), createParagraph([createText('b')])]),
      plugins: [BlockPlugin()],
    });
    editor.setSelection({
      anchor: { offset: 0, path: [0] },
      focus: { offset: 0, path: [0] },
    });
    const before = editor.getJSON().doc.content?.length ?? 0;
    expect(editor.command('insertTextBlock')).toBe(true);
    expect(editor.getJSON().doc.content?.length).toBe(before + 1);
    editor.destroy();
    host.remove();
  });
});

describe('wave2 table grid atom', () => {
  it('inserts tableGrid sheet', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const editor = new Editor(host, { plugins: [TablePlugin()] });
    editor.run(insertAtomAfter('tableGrid', attrsFromGrid(sizedEmptyGrid(2, 2, false))));
    expect(editor.getJSON().doc.content?.some((n) => n.type === 'tableGrid')).toBe(true);
    editor.destroy();
    host.remove();
  });
});
