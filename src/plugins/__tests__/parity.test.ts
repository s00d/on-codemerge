import { describe, expect, it } from 'vitest';
/**
 * @jest-environment jsdom
 */
import { Editor } from '../../editor/Editor';
import { TablePlugin } from '../TablePlugin';
import { ListsPlugin } from '../ListsPlugin';
import { BlockPlugin } from '../BlockPlugin';
import { ToolbarPlugin } from '../ToolbarPlugin';
import {
  createDoc,
  createParagraph,
  createText,
  insertText,
  splitBlock,
} from '@on-codemerge/kernel';
import { insertTableCommand, addRow, deleteRow, deleteTable } from '../TablePlugin/tableOps';

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

describe('wave2 table ops', () => {
  it('insert/add row/delete row/delete table', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const editor = new Editor(host, { plugins: [TablePlugin()] });
    editor.run(insertTableCommand(2, 2));
    expect(editor.getJSON().doc.content?.[1]?.type).toBe('table');
    editor.setSelection({
      anchor: { offset: 0, path: [1, 0, 0, 0] },
      focus: { offset: 0, path: [1, 0, 0, 0] },
    });
    editor.run(addRow('below'));
    expect(editor.getJSON().doc.content?.[1]?.content?.length).toBe(3);
    editor.run(deleteRow);
    expect(editor.getJSON().doc.content?.[1]?.content?.length).toBe(2);
    editor.run(deleteTable);
    expect(editor.getJSON().doc.content?.some((n) => n.type === 'table')).toBe(false);
    editor.destroy();
    host.remove();
  });
});
