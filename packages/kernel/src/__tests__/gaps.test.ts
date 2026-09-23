import { describe, expect, it } from 'vitest';
import {
  applyTransaction,
  comparePoints,
  createDoc,
  createHistory,
  createList,
  createListItem,
  createParagraph,
  createSchema,
  createState,
  createText,
  deleteBackward,
  docFromJSON,
  emptyState,
  exitListItemOps,
  insertText,
  isListType,
  isNormalizeIdempotent,
  isTextBlock,
  normalize,
  plainText,
  registerMark,
  registerNode,
  replaceAt,
  resolveTextPath,
  runCommand,
  sealSchema,
  selectAll,
  splitBlock,
  textBlockLength,
  textLength,
  toggleMark,
  transaction,
  assertMark,
  assertNodeType,
} from '../index';
import { ensureParagraphPath, selectionTextRange } from '../operations';

function stateWith(blocks: Parameters<typeof createDoc>[0]) {
  return createState(createDoc(blocks));
}

describe('kernel gaps', () => {
  it('deleteBackward covers list lift, table cell, and block merge', () => {
    expect.hasAssertions();
    const list = {
      type: 'bulletList',
      content: [
        { type: 'listItem', content: [createText('a')] },
        { type: 'listItem', content: [createText('b')] },
      ],
    };
    const inSecond = stateWith([list]);
    inSecond.selection = {
      anchor: { path: [0, 1], offset: 0 },
      focus: { path: [0, 1], offset: 0 },
    };
    expect(runCommand(inSecond, deleteBackward)).not.toBeNull();

    const first = stateWith([list]);
    first.selection = { anchor: { path: [0, 0], offset: 0 }, focus: { path: [0, 0], offset: 0 } };
    expect(runCommand(first, deleteBackward)).not.toBeNull();

    const afterPara = stateWith([createParagraph([createText('prev')]), list]);
    afterPara.selection = {
      anchor: { path: [1, 0], offset: 0 },
      focus: { path: [1, 0], offset: 0 },
    };
    expect(runCommand(afterPara, deleteBackward)).not.toBeNull();

    const table = {
      type: 'table',
      content: [
        {
          type: 'tableRow',
          content: [{ type: 'tableCell', content: [createParagraph([createText('c')])] }],
        },
      ],
    };
    const inCell = stateWith([table]);
    inCell.selection = {
      anchor: { path: [0, 0, 0, 0], offset: 0 },
      focus: { path: [0, 0, 0, 0], offset: 0 },
    };
    expect(runCommand(inCell, deleteBackward)).toBeNull();

    const two = stateWith([createParagraph([createText('a')]), createParagraph([createText('b')])]);
    two.selection = { anchor: { path: [1], offset: 0 }, focus: { path: [1], offset: 0 } };
    expect(runCommand(two, deleteBackward)).not.toBeNull();

    const start = stateWith([createParagraph([createText('a')])]);
    expect(runCommand(start, deleteBackward)).toBeNull();
  });

  it('splitBlock handles lists, headings, and non-text', () => {
    expect.hasAssertions();
    const emptyItem = stateWith([
      {
        type: 'bulletList',
        content: [{ type: 'listItem', content: [createText('')] }],
      },
    ]);
    emptyItem.selection = {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 0 },
    };
    expect(runCommand(emptyItem, splitBlock)).not.toBeNull();

    const filled = stateWith([
      {
        type: 'bulletList',
        content: [{ type: 'listItem', content: [createText('ab')] }],
      },
    ]);
    filled.selection = { anchor: { path: [0, 0], offset: 1 }, focus: { path: [0, 0], offset: 1 } };
    expect(runCommand(filled, splitBlock)?.ops[0]?.type).toBe('split_paragraph');

    const heading = stateWith([
      { type: 'heading', attrs: { level: 2 }, content: [createText('Hi')] },
    ]);
    heading.selection = { anchor: { path: [0], offset: 2 }, focus: { path: [0], offset: 2 } };
    expect(runCommand(heading, splitBlock)?.ops.some((o) => o.type === 'insert_node')).toBe(true);

    const table = stateWith([{ type: 'table', content: [] }]);
    expect(runCommand(table, splitBlock)).toBeNull();

    const nested = stateWith([
      {
        type: 'blockquote',
        content: [
          {
            type: 'bulletList',
            content: [{ type: 'listItem', content: [createText('')] }],
          },
        ],
      },
    ]);
    const exited = exitListItemOps(nested.doc, [0, 0], 0);
    expect(exited.ops[0]?.type).toBe('remove_node');
    expect(exited.selectionPath).toStrictEqual([0, 0]);
    expect(textBlockLength(nested.doc, [99])).toBe(0);
    expect(plainText({ type: 'text', text: 'a' })).toBe('a');
    expect(plainText({ type: 'paragraph', content: [{ type: 'span' }] })).toBe('');
  });

  it('marks, selectAll, schema, normalize, history', () => {
    expect.hasAssertions();
    const s = stateWith([createParagraph([createText('ab')])]);
    expect(runCommand(s, toggleMark('bold'))).toBeNull();
    s.selection = { anchor: { path: [0], offset: 0 }, focus: { path: [0], offset: 2 } };
    const on = runCommand(s, toggleMark('bold'));
    expect(on?.ops[0]?.type).toBe('set_mark');
    const marked = applyTransaction(s, on!).state;
    const off = runCommand(marked, toggleMark('bold'));
    expect(off?.ops[0]?.type).toBe('remove_mark');
    expect(runCommand(s, selectAll)?.ops[0]?.type).toBe('set_selection');

    const schema = createSchema();
    sealSchema(schema);
    expect(() => {
      registerNode(schema, { name: 'x' });
    }).toThrow(/sealed/);
    expect(() => {
      registerMark(schema, { name: 'x' });
    }).toThrow(/sealed/);
    const open = createSchema();
    expect(() => {
      registerNode(open, { name: 'paragraph' });
    }).toThrow(/already/);
    expect(() => {
      registerMark(open, { name: 'bold' });
    }).toThrow(/already/);
    expect(() => {
      assertMark(open, { type: 'nope' });
    }).toThrow(/Unknown mark/);
    expect(() => {
      assertNodeType(open, 'nope');
    }).toThrow(/Unknown node/);

    const empty = normalize({ type: 'doc', content: [] });
    expect(empty.content?.length).toBe(1);
    expect(() => normalize({ type: 'paragraph' })).toThrow(/doc/);
    const coalesced = normalize(
      createDoc([
        createParagraph([
          createText('a', [{ type: 'bold' }]),
          createText('b', [{ type: 'bold' }]),
          { type: 'hardBreak' },
        ]),
      ])
    );
    expect(isNormalizeIdempotent(coalesced)).toBe(true);

    expect(() => docFromJSON({ type: 'paragraph' })).toThrow(/doc/);
    expect(() => docFromJSON({ version: 1, doc: { type: 'paragraph' } })).toThrow(/doc/);
    expect(() => replaceAt(createText('a'), [0], createText('b'))).toThrow(/leaf/);
    expect(textLength({ type: 'atom' })).toBe(0);

    const hist = createHistory({ maxDepth: 1, mergeWindowMs: 1000 });
    let st = emptyState();
    expect(hist.undo(st)).toBe(st);
    expect(hist.redo(st)).toBe(st);
    st = hist.apply(st, transaction({ type: 'insert_text', path: [0], offset: 0, text: 'a' }), 1);
    st = hist.apply(st, transaction({ type: 'insert_text', path: [0], offset: 1, text: 'b' }), 2);
    expect(hist.depth()).toBe(1);
    st = hist.apply(
      st,
      transaction({ type: 'insert_node', path: [], index: 1, node: createParagraph() }),
      3
    );
    expect(hist.canUndo()).toBe(true);
    st = hist.undo(st);
    expect(hist.canRedo()).toBe(true);
    st = hist.redo(st);
    hist.apply(st, transaction({ type: 'set_selection', selection: st.selection }), 4);
    expect(resolveTextPath(st.doc, [])).toStrictEqual([0]);
  });

  it('resolves nested text paths and list exits', () => {
    expect.hasAssertions();
    const cell = {
      type: 'tableCell',
      content: [createParagraph([createText('c')])],
    };
    const row = { type: 'tableRow', content: [cell] };
    const table = { type: 'table', content: [row] };
    const doc = createDoc([table]);
    expect(resolveTextPath(doc, [0]).length).toBeGreaterThan(1);
    expect(resolveTextPath(doc, [0, 0]).at(-1)).toBe(0);
    expect(resolveTextPath(doc, [0, 0, 0]).length).toBeGreaterThan(2);
    const emptyCell = createDoc([
      {
        type: 'table',
        content: [{ type: 'tableRow', content: [{ type: 'tableCell', content: [] }] }],
      },
    ]);
    expect(resolveTextPath(emptyCell, [0, 0, 0])).toStrictEqual([0, 0, 0]);
    expect(resolveTextPath(createDoc([{ type: 'bulletList', content: [] }]), [0])).toStrictEqual([
      0,
    ]);
    expect(isTextBlock('heading')).toBe(true);
    expect(isListType('orderedList')).toBe(true);
    expect(createList('orderedList', []).content?.length).toBe(1);
    expect(createListItem().type).toBe('listItem');

    const two = createDoc([
      {
        type: 'bulletList',
        content: [
          { type: 'listItem', content: [createText('a')] },
          { type: 'listItem', content: [createText('b')] },
        ],
      },
    ]);
    expect(exitListItemOps(two, [0], 0).ops.length).toBeGreaterThan(1);
    expect(exitListItemOps(two, [0], 1).selectionPath).toStrictEqual([1]);

    const a = { path: [0], offset: 1 };
    const b = { path: [0], offset: 2 };
    expect(comparePoints(a, b)).toBe(-1);
    expect(comparePoints(b, a)).toBe(1);
    expect(comparePoints(a, { path: [1], offset: 0 })).toBe(-1);
    expect(comparePoints({ path: [0, 1], offset: 0 }, { path: [0], offset: 0 })).toBe(1);
    expect(
      selectionTextRange({
        anchor: { path: [0], offset: 0 },
        focus: { path: [1], offset: 0 },
      })
    ).toBeNull();
    expect(ensureParagraphPath(createDoc(), [])).toStrictEqual([0]);
    expect(ensureParagraphPath({ type: 'doc', content: [] }, [])).toStrictEqual([0]);

    const image = stateWith([{ type: 'image', attrs: { src: 'a' } }]);
    expect(runCommand(image, splitBlock)).toBeNull();
    const nested = stateWith([
      { type: 'blockquote', content: [createParagraph([createText('a')])] },
    ]);
    nested.selection = { anchor: { path: [0, 0], offset: 0 }, focus: { path: [0, 0], offset: 0 } };
    expect(runCommand(nested, deleteBackward)).toBeNull();
  });

  it('insertText and apply still work', () => {
    expect.hasAssertions();
    const s = stateWith([createParagraph([createText('')])]);
    const tr = runCommand(s, insertText('z'));
    expect(applyTransaction(s, tr!).state.doc.content?.[0]?.content?.[0]?.text).toBe('z');
  });
});
