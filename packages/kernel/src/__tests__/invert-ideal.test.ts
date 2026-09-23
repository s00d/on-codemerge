import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyOp,
  applyTransaction,
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
  MAX_INSERT_CHARS,
  plainText,
  resetIdCounter,
  runCommand,
  selectAll,
  softDeleteBackward,
  transaction,
  insertText,
} from '../index';

beforeEach(() => {
  resetIdCounter();
});

describe('invert ideal', () => {
  it('delete_text undo restores marks', () => {
    expect.hasAssertions();
    const state = createState(createDoc([createParagraph([createText('ab', [{ type: 'bold' }])])]));
    const { state: next, inverses } = applyTransaction(
      state,
      transaction({ type: 'delete_text', path: [0], offset: 0, length: 2 })
    );
    expect(plainText(next.doc.content![0])).toBe('');
    const undone = applyTransaction(next, transaction(...inverses)).state;
    expect(undone.doc.content![0].content![0].text).toBe('ab');
    expect(undone.doc.content![0].content![0].marks?.[0]?.type).toBe('bold');
  });

  it('remove_mark undo restores mark', () => {
    expect.hasAssertions();
    const state = createState(
      createDoc([createParagraph([createText('hi', [{ type: 'italic' }])])])
    );
    const { state: next, inverses } = applyTransaction(
      state,
      transaction({ type: 'remove_mark', path: [0], from: 0, to: 2, markType: 'italic' })
    );
    expect(next.doc.content![0].content![0].marks ?? []).toHaveLength(0);
    expect(inverses[0]?.type).toBe('replace_slice');
    const undone = applyTransaction(next, transaction(...inverses)).state;
    expect(undone.doc.content![0].content![0].marks?.[0]?.type).toBe('italic');
  });

  it('set_attrs replace inverse drops new keys', () => {
    expect.hasAssertions();
    const state = createState(createDoc([createParagraph([createText('x')], { align: 'left' })]));
    const { state: next, inverses } = applyTransaction(
      state,
      transaction({
        type: 'set_attrs',
        path: [0],
        attrs: { align: 'center', color: 'red' },
      })
    );
    expect({ ...next.doc.content![0].attrs }).toStrictEqual({ align: 'center', color: 'red' });
    expect(inverses[0]).toMatchObject({
      type: 'set_attrs',
      replace: true,
    });
    expect({ ...(inverses[0] as { attrs: Record<string, unknown> }).attrs }).toStrictEqual({
      align: 'left',
    });
    const undone = applyTransaction(next, transaction(...inverses)).state;
    expect({ ...undone.doc.content![0].attrs }).toStrictEqual({ align: 'left' });
    expect(undone.doc.content![0].attrs).not.toHaveProperty('color');
  });

  it('insert_text keeps hardBreak', () => {
    expect.hasAssertions();
    const para = createParagraph([createText('a'), { type: 'hardBreak' }, createText('b')]);
    const state = createState(createDoc([para]));
    const { state: next } = applyTransaction(
      state,
      transaction({ type: 'insert_text', path: [0], offset: 1, text: 'X' })
    );
    const content = next.doc.content![0].content!;
    expect(content.map((n) => n.type)).toStrictEqual(['text', 'hardBreak', 'text']);
    expect(content[0].text).toBe('aX');
    expect(content[2].text).toBe('b');
  });

  it('nested list deleteBackward keeps outer list', () => {
    expect.hasAssertions();
    const doc = createDoc([
      createList('bulletList', [
        createListItem([
          createParagraph([createText('outer')]),
          createList('bulletList', [createListItem([createParagraph([createText('inner')])])]),
        ]),
      ]),
    ]);
    let state = createState(doc);
    // caret at start of nested item's paragraph
    state = {
      ...state,
      selection: {
        anchor: { path: [0, 0, 1, 0, 0], offset: 0 },
        focus: { path: [0, 0, 1, 0, 0], offset: 0 },
      },
    };
    const tr = runCommand(state, deleteBackward);
    expect(tr).not.toBeNull();
    state = applyTransaction(state, tr!).state;
    expect(state.doc.content![0].type).toBe('bulletList');
    expect(state.doc.content![0].content![0].type).toBe('listItem');
    const itemContent = state.doc.content![0].content![0].content!;
    // Nested list lifted into parent listItem (optionally merged with prev paragraph)
    expect(itemContent.some((n) => n.type === 'bulletList')).toBe(false);
    expect(plainText(state.doc.content![0])).toContain('outer');
    expect(plainText(state.doc.content![0])).toContain('inner');
    expect(state.doc.content).toHaveLength(1);
  });

  it('history redo restores selection after softDeleteBackward', () => {
    expect.hasAssertions();
    const history = createHistory({ mergeWindowMs: 0 });
    let state = createState(createDoc([createParagraph([createText('ab')])]));
    state = {
      ...state,
      selection: { anchor: { path: [0], offset: 2 }, focus: { path: [0], offset: 2 } },
    };
    const soft = runCommand(
      state,
      softDeleteBackward({ type: 'deletion', attrs: { author: 'a' } })
    );
    expect(soft).not.toBeNull();
    state = history.apply(state, soft!, 1);
    expect(state.selection.anchor.offset).toBe(1);
    const afterSoft = state.selection;

    state = history.undo(state);
    expect(state.selection.anchor.offset).toBe(2);

    state = history.redo(state);
    expect(state.selection).toStrictEqual(afterSoft);
  });

  it('rejects non-integer path segments', () => {
    expect.hasAssertions();
    const doc = createDoc([createParagraph([createText('')])]);
    expect(() => applyOp(doc, { type: 'insert_text', path: [0.5], offset: 0, text: 'x' })).toThrow(
      /integer/i
    );
  });

  it('text ops fail closed on nested block children', () => {
    expect.hasAssertions();
    const doc = createDoc([createListItem([createParagraph([createText('x')])])]);
    // path [0] is listItem containing a paragraph — not a leaf text block
    expect(() => applyOp(doc, { type: 'insert_text', path: [0], offset: 0, text: 'y' })).toThrow(
      /leaf text block/i
    );
  });

  it('selectAll then deleteBackward clears multi-paragraph doc', () => {
    expect.hasAssertions();
    let state = createState(
      createDoc([
        createParagraph([createText('aa')]),
        createParagraph([createText('bb')]),
        createParagraph([createText('cc')]),
      ])
    );
    state = applyTransaction(state, runCommand(state, selectAll)!).state;
    const tr = runCommand(state, deleteBackward);
    expect(tr).not.toBeNull();
    state = applyTransaction(state, tr!).state;
    expect(state.doc.content).toHaveLength(1);
    expect(plainText(state.doc.content![0])).toBe('');
  });

  it('createState clamps out-of-range selection', () => {
    expect.hasAssertions();
    const state = createState(createDoc([createParagraph([createText('hi')])]), {
      anchor: { path: [0], offset: 99 },
      focus: { path: [0], offset: 99 },
    });
    expect(state.selection.anchor.offset).toBe(2);
  });

  it('normalize fills empty heading and listItem', () => {
    expect.hasAssertions();
    const state = createState({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [] },
        { type: 'listItem', content: [] },
      ],
    });
    expect(state.doc.content![0].content?.[0]?.type).toBe('text');
    expect(state.doc.content![1].content?.[0]?.type).toBe('text');
  });

  it('docFromJSON rejects wrong version', () => {
    expect.hasAssertions();
    expect(() =>
      docFromJSON({ version: 99, doc: createDoc([createParagraph([createText('x')])]) })
    ).toThrow(/version/i);
  });

  it('insert_text rejects oversized payload', () => {
    expect.hasAssertions();
    const doc = createDoc([createParagraph([createText('')])]);
    expect(() =>
      applyOp(doc, {
        type: 'insert_text',
        path: [0],
        offset: 0,
        text: 'x'.repeat(MAX_INSERT_CHARS + 1),
      })
    ).toThrow(/MAX_INSERT_CHARS/);
  });

  it('history stops merging past maxEntryChars', () => {
    expect.hasAssertions();
    const hist = createHistory({ maxDepth: 10, mergeWindowMs: 10_000, maxEntryChars: 3 });
    let state = createState(createDoc([createParagraph([createText('')])]));
    state = hist.apply(
      state,
      transaction({ type: 'insert_text', path: [0], offset: 0, text: 'ab' }),
      1
    );
    state = hist.apply(
      state,
      transaction({ type: 'insert_text', path: [0], offset: 2, text: 'cd' }),
      2
    );
    expect(hist.depth()).toBe(2);
    expect(plainText(state.doc.content![0])).toBe('abcd');
  });

  it('delete_text undo restores hardBreak keeps', () => {
    expect.hasAssertions();
    const para = createParagraph([createText('a'), { type: 'hardBreak' }, createText('b')]);
    let state = createState(createDoc([para]));
    const { state: next, inverses } = applyTransaction(
      state,
      transaction({ type: 'delete_text', path: [0], offset: 0, length: 2 })
    );
    expect(plainText(next.doc.content![0])).toBe('');
    expect(next.doc.content![0].content?.some((n) => n.type === 'hardBreak')).toBe(false);
    state = applyTransaction(next, transaction(...inverses)).state;
    expect(state.doc.content![0].content?.some((n) => n.type === 'hardBreak')).toBe(true);
    expect(plainText(state.doc.content![0])).toBe('ab');
  });

  it('merge undo restores right block type', () => {
    expect.hasAssertions();
    let state = createState(
      createDoc([
        createParagraph([createText('L')]),
        { type: 'heading', attrs: { level: 2 }, content: [createText('R')], id: 'h1' },
      ])
    );
    const { state: merged, inverses } = applyTransaction(
      state,
      transaction({ type: 'merge_paragraph', path: [1] })
    );
    expect(merged.doc.content![0].type).toBe('paragraph');
    state = applyTransaction(merged, transaction(...inverses)).state;
    expect(state.doc.content).toHaveLength(2);
    expect(state.doc.content![1].type).toBe('heading');
    expect(state.doc.content![1].attrs?.level).toBe(2);
    expect(plainText(state.doc.content![1])).toBe('R');
  });

  it('nested list selection delete removes covered items', () => {
    expect.hasAssertions();
    let state = createState(
      createDoc([
        createList('bulletList', [
          createListItem([createParagraph([createText('aa')])]),
          createListItem([createParagraph([createText('bb')])]),
        ]),
      ])
    );
    state = {
      ...state,
      selection: {
        anchor: { path: [0, 0, 0], offset: 0 },
        focus: { path: [0, 1, 0], offset: 2 },
      },
    };
    const tr = runCommand(state, deleteBackward);
    expect(tr).not.toBeNull();
    state = applyTransaction(state, tr!).state;
    // Empty list husk collapses to a paragraph via normalize
    expect(state.doc.content).toHaveLength(1);
    expect(state.doc.content![0].type).toBe('paragraph');
    expect(plainText(state.doc.content![0])).toBe('');
  });

  it('softDeleteBackward on range hard-deletes selection', () => {
    expect.hasAssertions();
    let state = createState(createDoc([createParagraph([createText('abcdef')])]));
    state = {
      ...state,
      selection: {
        anchor: { path: [0], offset: 1 },
        focus: { path: [0], offset: 4 },
      },
    };
    const tr = runCommand(state, softDeleteBackward({ type: 'deletion' }));
    expect(tr?.ops[0]).toMatchObject({ type: 'delete_text', offset: 1, length: 3 });
  });

  it('set_attrs rejects __proto__ pollution', () => {
    expect.hasAssertions();
    const doc = createDoc([createParagraph([createText('x')])]);
    const polluted = JSON.parse('{"__proto__":{"admin":true},"ok":1}') as Record<string, unknown>;
    const { doc: next } = applyOp(doc, {
      type: 'set_attrs',
      path: [0],
      attrs: polluted,
    });
    expect(Object.getPrototypeOf(next.content![0].attrs!)).toBeNull();
    expect((next.content![0].attrs as { admin?: boolean }).admin).toBeUndefined();
    expect(next.content![0].attrs?.ok).toBe(1);
  });

  it('replace_slice respects MAX_INSERT_CHARS', () => {
    expect.hasAssertions();
    const doc = createDoc([createParagraph([createText('')])]);
    expect(() =>
      applyOp(doc, {
        type: 'replace_slice',
        path: [0],
        from: 0,
        to: 0,
        runs: [{ text: 'x'.repeat(MAX_INSERT_CHARS + 1), marks: [] }],
      })
    ).toThrow(/MAX_INSERT_CHARS/);
  });

  it('applyOp with schema rejects unknown marks', () => {
    expect.hasAssertions();
    const schema = createSchema();
    const doc = createDoc([createParagraph([createText('ab')])]);
    expect(() =>
      applyOp(doc, { type: 'set_mark', path: [0], from: 0, to: 2, mark: { type: 'bogus' } }, schema)
    ).toThrow(/Unknown mark/);
  });

  it('nested paragraph listItems merge on backspace', () => {
    expect.hasAssertions();
    let state = createState(
      createDoc([
        createList('bulletList', [
          createListItem([createParagraph([createText('aa')])]),
          createListItem([createParagraph([createText('bb')])]),
        ]),
      ])
    );
    state = {
      ...state,
      selection: { anchor: { path: [0, 1, 0], offset: 0 }, focus: { path: [0, 1, 0], offset: 0 } },
    };
    const tr = runCommand(state, deleteBackward);
    expect(tr).not.toBeNull();
    state = applyTransaction(state, tr!).state;
    expect(state.doc.content![0].content).toHaveLength(1);
    expect(plainText(state.doc.content![0].content![0])).toBe('aabb');
  });

  it('partial nested list range keeps end suffix', () => {
    expect.hasAssertions();
    let state = createState(
      createDoc([
        createList('bulletList', [
          createListItem([createParagraph([createText('aa')])]),
          createListItem([createParagraph([createText('cc')])]),
        ]),
      ])
    );
    state = {
      ...state,
      selection: {
        anchor: { path: [0, 0, 0], offset: 1 },
        focus: { path: [0, 1, 0], offset: 1 },
      },
    };
    const tr = runCommand(state, deleteBackward);
    expect(tr).not.toBeNull();
    state = applyTransaction(state, tr!).state;
    const texts = (state.doc.content![0].content ?? []).map((item) => plainText(item));
    expect(texts.join('')).toBe('ac');
  });

  it('schema rejects evil keep and rightNode', () => {
    expect.hasAssertions();
    const schema = createSchema();
    const doc = createDoc([createParagraph([createText('x')])]);
    expect(() =>
      applyOp(
        doc,
        {
          type: 'replace_slice',
          path: [0],
          from: 0,
          to: 0,
          runs: [],
          keeps: [{ at: 0, node: { type: 'evilScript' } }],
        },
        schema
      )
    ).toThrow(/Unknown node/);
    expect(() =>
      applyOp(
        doc,
        {
          type: 'split_paragraph',
          path: [0],
          offset: 0,
          rightNode: { type: 'notARealType', content: [createText('')] },
        },
        schema
      )
    ).toThrow(/Unknown node/);
  });

  it('insert_node / remove_node remaps selection sibling index', () => {
    expect.hasAssertions();
    let state = createState(
      createDoc([
        createParagraph([createText('aaa')]),
        createParagraph([createText('bbb')]),
        createParagraph([createText('ccc')]),
      ])
    );
    state = {
      ...state,
      selection: { anchor: { path: [1], offset: 1 }, focus: { path: [1], offset: 1 } },
    };
    state = applyTransaction(
      state,
      transaction({
        type: 'insert_node',
        path: [],
        index: 0,
        node: createParagraph([createText('zzz')]),
      })
    ).state;
    expect(state.selection.anchor.path).toStrictEqual([2]);
    const content = state.doc.content ?? [];
    expect(plainText(content[2])).toBe('bbb');
  });

  it('clampPoint lifts selection off text leaves after normalize', () => {
    expect.hasAssertions();
    const state = createState(
      { type: 'doc', content: [{ type: 'bulletList', content: [] }] },
      { anchor: { path: [0, 0], offset: 0 }, focus: { path: [0, 0], offset: 0 } }
    );
    expect(state.doc.content![0].type).toBe('paragraph');
    expect(state.selection.anchor.path).toStrictEqual([0]);
    const tr = runCommand(state, insertText('X'));
    expect(tr).not.toBeNull();
    const next = applyTransaction(state, tr!).state;
    expect(next.doc.content![0].content?.[0]?.type).toBe('text');
    expect(next.doc.content![0].content?.[0]?.content).toBeUndefined();
    expect(plainText(next.doc.content![0])).toBe('X');
  });
});
