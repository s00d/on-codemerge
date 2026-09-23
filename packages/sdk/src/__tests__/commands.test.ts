import { describe, expect, it } from 'vitest';
import {
  applyTransaction,
  createDoc,
  createParagraph,
  createState,
  createText,
  runCommand,
} from '@on-codemerge/kernel';
import type { Selection } from '@on-codemerge/kernel';
import {
  expandOffsetToWord,
  insertAtomAfter,
  insertBlockNearSelection,
  resolveInsertSite,
  withMarkTarget,
} from '../commands';
import { core } from '../core';
import type { EditorAPI } from '../types';

function mockEditor(sel: Selection, blocks: string[]): EditorAPI {
  const state = { selection: sel };
  return {
    getSelection: () => state.selection,
    setSelection: (next: Selection) => {
      state.selection = next;
    },
    getJSON: () => ({
      version: 1,
      doc: {
        type: 'doc',
        content: blocks.map((t, i) => ({
          type: 'paragraph',
          id: `p${i}`,
          content: [{ type: 'text', text: t }],
        })),
      },
    }),
  } as unknown as EditorAPI;
}

describe('expandOffsetToWord', () => {
  it('expands middle of word', () => {
    expect.hasAssertions();
    expect(expandOffsetToWord('hello world', 2)).toStrictEqual({ from: 0, to: 5 });
  });

  it('expands second word', () => {
    expect.hasAssertions();
    expect(expandOffsetToWord('hello world', 8)).toStrictEqual({ from: 6, to: 11 });
  });

  it('expands word before space when caret on space', () => {
    expect.hasAssertions();
    expect(expandOffsetToWord('hello world', 5)).toStrictEqual({ from: 0, to: 5 });
  });

  it('stays collapsed between words with double space', () => {
    expect.hasAssertions();
    expect(expandOffsetToWord('hello  world', 6)).toStrictEqual({ from: 6, to: 6 });
  });
});

describe('withMarkTarget', () => {
  it('keeps non-collapsed word range', () => {
    expect.hasAssertions();
    const editor = mockEditor(
      {
        anchor: { path: [0], offset: 6 },
        focus: { path: [0], offset: 11 },
      },
      ['hello world']
    );
    let ran = false;
    withMarkTarget(editor, () => {
      ran = true;
      expect(editor.getSelection()).toStrictEqual({
        anchor: { path: [0], offset: 6 },
        focus: { path: [0], offset: 11 },
      });
    });
    expect(ran).toBe(true);
  });

  it('expands caret to word in current block not block 0', () => {
    expect.hasAssertions();
    const editor = mockEditor(
      {
        anchor: { path: [1], offset: 2 },
        focus: { path: [1], offset: 2 },
      },
      ['first', 'second block']
    );
    withMarkTarget(editor, () => {});
    expect(editor.getSelection()).toStrictEqual({
      anchor: { path: [1], offset: 0 },
      focus: { path: [1], offset: 6 },
    });
  });
});

describe('resolveInsertSite / insertBlockNearSelection', () => {
  const tableDoc = createDoc([
    {
      type: 'table',
      attrs: { cols: 1 },
      content: [
        {
          type: 'tableRow',
          content: [
            {
              type: 'tableCell',
              content: [createParagraph([createText('cell')])],
            },
          ],
        },
      ],
    },
  ]);

  it('resolves into table cell when caret is inside', () => {
    expect.hasAssertions();
    expect(resolveInsertSite(tableDoc, [0, 0, 0, 0])).toStrictEqual({
      path: [0, 0, 0],
      index: 1,
    });
    expect(resolveInsertSite(tableDoc, [0, 0, 0])).toStrictEqual({
      path: [0, 0, 0],
      index: 0,
    });
  });

  it('resolves after top-level block otherwise', () => {
    expect.hasAssertions();
    const doc = createDoc([createParagraph([createText('a')])]);
    expect(resolveInsertSite(doc, [0])).toStrictEqual({ path: [], index: 1 });
  });

  it('inserts nested table into selected cell', () => {
    expect.hasAssertions();
    let state = createState(tableDoc);
    state = {
      ...state,
      selection: {
        anchor: { offset: 0, path: [0, 0, 0, 0] },
        focus: { offset: 0, path: [0, 0, 0, 0] },
      },
    };
    const nested = {
      type: 'table',
      id: 'nested',
      attrs: { cols: 1 },
      content: [
        {
          type: 'tableRow',
          content: [
            {
              type: 'tableCell',
              content: [createParagraph([createText('')])],
            },
          ],
        },
      ],
    };
    state = applyTransaction(
      state,
      runCommand(
        state,
        insertBlockNearSelection(nested, {
          trailingParagraph: true,
          select: (p) => core.collapsedAt([...p, 0, 0, 0], 0),
        })
      )!
    ).state;
    const cell = state.doc.content![0].content![0].content![0];
    expect(cell.content!.map((n) => n.type)).toStrictEqual(['paragraph', 'table', 'paragraph']);
    expect(state.doc.content).toHaveLength(1);
  });

  it('insertAtomAfter nests into cell', () => {
    expect.hasAssertions();
    let state = createState(tableDoc);
    state = {
      ...state,
      selection: {
        anchor: { offset: 0, path: [0, 0, 0, 0] },
        focus: { offset: 0, path: [0, 0, 0, 0] },
      },
    };
    state = applyTransaction(
      state,
      runCommand(state, insertAtomAfter('image', { src: 'x' }))!
    ).state;
    const cell = state.doc.content![0].content![0].content![0];
    expect(cell.content![1].type).toBe('image');
  });
});
