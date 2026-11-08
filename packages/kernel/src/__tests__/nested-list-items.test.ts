import { describe, expect, it } from 'vitest';
import {
  applyTransaction,
  createDoc,
  createState,
  createText,
  deleteBackward,
  exitListItemOps,
  plainText,
  runCommand,
  splitBlock,
} from '../index';
import type { Command, DocNode, EditorState } from '../index';

const para = (text: string): DocNode => ({ type: 'paragraph', content: [createText(text)] });
const item = (...content: DocNode[]): DocNode => ({ type: 'listItem', content });
const list = (...items: DocNode[]): DocNode => ({ type: 'bulletList', content: items });

/** ul > li[ p("ab"), ul > li("cd") ] , p("tail") */
function state(path: number[], offset: number): EditorState {
  const base = createState(
    createDoc([list(item(para('ab'), list(item(createText('cd'))))), para('tail')])
  );
  return { ...base, selection: { anchor: { path, offset }, focus: { path, offset } } };
}

function run(s: EditorState, cmd: Command): EditorState {
  const tr = runCommand(s, cmd);
  expect(tr).not.toBeNull();
  return applyTransaction(s, tr!).state;
}

/** Compact shape: lists → arrays of items, items → arrays of children, text blocks → text. */
function shape(node: DocNode): unknown {
  if (node.type === 'bulletList' || node.type === 'orderedList' || node.type === 'listItem') {
    const kids = node.content ?? [];
    if (node.type === 'listItem' && kids.every((k) => k.type === 'text')) {
      return plainText(node);
    }
    return kids.map(shape);
  }
  return plainText(node);
}

describe('block-form list items', () => {
  it('backspace at start of first item lifts paragraph and keeps the nested list', () => {
    expect.hasAssertions();
    const next = run(state([0, 0, 0], 0), deleteBackward);
    expect(next.doc.content!.map((n) => n.type)).toStrictEqual([
      'paragraph',
      'bulletList',
      'paragraph',
    ]);
    expect(next.doc.content!.map(shape)).toStrictEqual(['ab', ['cd'], 'tail']);
    expect(next.selection.anchor).toStrictEqual({ path: [0], offset: 0 });
  });

  it('exitListItemOps keeps every block of a block-form item', () => {
    expect.hasAssertions();
    const s = state([0, 0, 0], 0);
    const { ops } = exitListItemOps(s.doc, [0], 0);
    const inserted = ops.flatMap((op) => (op.type === 'insert_node' ? [shape(op.node)] : []));
    expect(inserted).toStrictEqual(['ab', ['cd']]);
  });

  it('enter mid-paragraph splits into a new item; nested list moves with the tail', () => {
    expect.hasAssertions();
    const next = run(state([0, 0, 0], 1), splitBlock);
    expect(shape(next.doc.content![0]!)).toStrictEqual([['a'], ['b', ['cd']]]);
    expect(next.selection.anchor).toStrictEqual({ path: [0, 1, 0], offset: 0 });
  });

  it('enter at end of item paragraph opens a new item that owns the nested list', () => {
    expect.hasAssertions();
    const next = run(state([0, 0, 0], 2), splitBlock);
    expect(shape(next.doc.content![0]!)).toStrictEqual([['ab'], ['', ['cd']]]);
    expect(next.selection.anchor).toStrictEqual({ path: [0, 1, 0], offset: 0 });
  });

  it('enter in an empty item paragraph lifts the item, nested list kept', () => {
    expect.hasAssertions();
    const base = createState(
      createDoc([list(item(para('x')), item(para(''), list(item(createText('n')))))])
    );
    const s = {
      ...base,
      selection: { anchor: { path: [0, 1, 0], offset: 0 }, focus: { path: [0, 1, 0], offset: 0 } },
    };
    const next = run(s, splitBlock);
    expect(next.doc.content!.map(shape)).toStrictEqual([[['x']], '', ['n']]);
    expect(next.selection.anchor).toStrictEqual({ path: [1], offset: 0 });
  });
});
