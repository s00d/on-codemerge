import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyTransaction,
  createDoc,
  createHistory,
  createParagraph,
  createSchema,
  createState,
  createText,
  deleteBackward,
  deleteForward,
  docToJSON,
  insertText,
  isNormalizeIdempotent,
  normalize,
  plainText,
  registerNode,
  resetIdCounter,
  runCommand,
  sealSchema,
  softDeleteBackward,
  splitBlock,
  transaction,
} from '../index';

beforeEach(() => {
  resetIdCounter();
});

describe('operations + transaction', () => {
  it('inserts text and inverts', () => {
    expect.hasAssertions();
    const state = createState(createDoc([createParagraph([createText('')])]));
    const { state: next, inverses } = applyTransaction(
      state,
      transaction({ offset: 0, path: [0], text: 'Hi', type: 'insert_text' })
    );
    expect(next.doc.content![0].content![0].text).toBe('Hi');
    const undone = applyTransaction(next, transaction(...inverses)).state;
    expect(undone.doc.content![0].content![0].text).toBe('');
  });

  it('split_paragraph creates two paragraphs', () => {
    expect.hasAssertions();
    let state = createState(createDoc([createParagraph([createText('Hello')])]));
    state = applyTransaction(
      state,
      transaction({ offset: 2, path: [0], type: 'split_paragraph' })
    ).state;
    expect(state.doc.content).toHaveLength(2);
    expect(state.doc.content![0].content![0].text).toBe('He');
    expect(state.doc.content![1].content![0].text).toBe('llo');
  });

  it('insert_text applies explicit marks', () => {
    expect.hasAssertions();
    const state = createState(createDoc([createParagraph([createText('')])]));
    const { state: next } = applyTransaction(
      state,
      transaction({
        offset: 0,
        path: [0],
        text: 'Hi',
        type: 'insert_text',
        marks: [{ type: 'insertion', attrs: { author: 'a' } }],
      })
    );
    expect(next.doc.content![0].content![0].text).toBe('Hi');
    expect(next.doc.content![0].content![0].marks?.[0].type).toBe('insertion');
  });

  it('softDeleteBackward marks deletion then hard-deletes marked text', () => {
    expect.hasAssertions();
    let state = createState(createDoc([createParagraph([createText('ab')])]));
    state = {
      ...state,
      selection: { anchor: { offset: 2, path: [0] }, focus: { offset: 2, path: [0] } },
    };
    const soft = runCommand(
      state,
      softDeleteBackward({ type: 'deletion', attrs: { author: 'a' } })
    );
    expect(soft).not.toBeNull();
    state = applyTransaction(state, soft!).state;
    expect(plainText(state.doc.content![0])).toBe('ab');
    expect(
      state.doc.content![0].content!.some((n) => n.marks?.some((m) => m.type === 'deletion'))
    ).toBe(true);
    expect(state.selection.anchor.offset).toBe(1);

    state = {
      ...state,
      selection: { anchor: { offset: 2, path: [0] }, focus: { offset: 2, path: [0] } },
    };
    const hard = runCommand(
      state,
      softDeleteBackward({ type: 'deletion', attrs: { author: 'a' } })
    );
    state = applyTransaction(state, hard!).state;
    expect(plainText(state.doc.content![0])).toBe('a');
  });

  it('softDeleteBackward hard-deletes insertion marks and falls back at offset 0', () => {
    expect.hasAssertions();
    let state = createState(
      createDoc([
        createParagraph([createText('xy', [{ type: 'insertion', attrs: { author: 'a' } }])]),
      ])
    );
    state = {
      ...state,
      selection: { anchor: { offset: 2, path: [0] }, focus: { offset: 2, path: [0] } },
    };
    const hard = runCommand(
      state,
      softDeleteBackward({ type: 'deletion', attrs: { author: 'a' } })
    );
    state = applyTransaction(state, hard!).state;
    expect(plainText(state.doc.content![0])).toBe('x');

    state = {
      ...state,
      selection: { anchor: { offset: 0, path: [0] }, focus: { offset: 0, path: [0] } },
    };
    // offset 0 → normal deleteBackward (may be null for sole paragraph)
    const atStart = runCommand(
      state,
      softDeleteBackward({ type: 'deletion', attrs: { author: 'a' } })
    );
    expect(atStart === null || Array.isArray(atStart.ops)).toBe(true);
  });

  it('insertText command forwards optional marks', () => {
    expect.hasAssertions();
    let state = createState(createDoc([createParagraph([createText('')])]));
    const tr = runCommand(state, insertText('Z', [{ type: 'insertion', attrs: { author: 'b' } }]));
    expect(tr).not.toBeNull();
    state = applyTransaction(state, tr!).state;
    expect(state.doc.content![0].content![0].marks?.[0].type).toBe('insertion');
  });
});

describe('normalize', () => {
  it('is idempotent', () => {
    expect.hasAssertions();
    const doc = createDoc([createParagraph([createText('a'), createText('b')])]);
    expect(isNormalizeIdempotent(doc)).toBe(true);
    const n = normalize(doc);
    expect(n.content![0].content).toHaveLength(1);
    expect(n.content![0].content![0].text).toBe('ab');
  });
});

describe('history', () => {
  it('caps depth at maxDepth', () => {
    expect.hasAssertions();
    const history = createHistory({ maxDepth: 5, mergeWindowMs: 0 });
    let state = createState();
    for (let i = 0; i < 20; i++) {
      const tr = runCommand(state, insertText(String(i)))!;
      state = history.apply(state, tr, i * 1000);
    }
    expect(history.depth()).toBeLessThanOrEqual(5);
  });

  it('undo/redo restores text', () => {
    expect.hasAssertions();
    const history = createHistory({ mergeWindowMs: 0 });
    let state = createState();
    state = history.apply(state, runCommand(state, insertText('x'))!, 1);
    expect(state.doc.content![0].content![0].text).toBe('x');
    state = history.undo(state);
    expect(state.doc.content![0].content![0].text).toBe('');
    state = history.redo(state);
    expect(state.doc.content![0].content![0].text).toBe('x');
  });
});

describe('commands', () => {
  it('deleteBackward removes previous char', () => {
    expect.hasAssertions();
    let state = createState(createDoc([createParagraph([createText('ab')])]));
    state = {
      ...state,
      selection: { anchor: { offset: 2, path: [0] }, focus: { offset: 2, path: [0] } },
    };
    state = applyTransaction(state, runCommand(state, deleteBackward)!).state;
    expect(state.doc.content![0].content![0].text).toBe('a');
  });

  it('splitBlock on enter', () => {
    expect.hasAssertions();
    let state = createState(createDoc([createParagraph([createText('ab')])]));
    state = {
      ...state,
      selection: { anchor: { offset: 1, path: [0] }, focus: { offset: 1, path: [0] } },
    };
    state = applyTransaction(state, runCommand(state, splitBlock)!).state;
    expect(state.doc.content).toHaveLength(2);
    expect(state.selection.anchor).toStrictEqual({ offset: 0, path: [1] });
    expect(state.doc.content![0].content![0].text).toBe('a');
    expect(state.doc.content![1].content![0].text).toBe('b');
  });

  it('deleteBackward at start merges with previous paragraph', () => {
    expect.hasAssertions();
    let state = createState(
      createDoc([createParagraph([createText('ab')]), createParagraph([createText('cd')])])
    );
    state = {
      ...state,
      selection: { anchor: { offset: 0, path: [1] }, focus: { offset: 0, path: [1] } },
    };
    state = applyTransaction(state, runCommand(state, deleteBackward)!).state;
    expect(state.doc.content).toHaveLength(1);
    expect(state.doc.content![0].content![0].text).toBe('abcd');
    expect(state.selection.anchor).toStrictEqual({ offset: 2, path: [0] });
  });

  it('insertText replaces same-path selection', () => {
    expect.hasAssertions();
    let state = createState(createDoc([createParagraph([createText('abcdef')])]));
    state = {
      ...state,
      selection: { anchor: { offset: 1, path: [0] }, focus: { offset: 5, path: [0] } },
    };
    state = applyTransaction(state, runCommand(state, insertText('X'))!).state;
    expect(state.doc.content![0].content![0].text).toBe('aXf');
  });

  it('deleteBackward deletes same-path selection', () => {
    expect.hasAssertions();
    let state = createState(createDoc([createParagraph([createText('abcdef')])]));
    state = {
      ...state,
      selection: { anchor: { offset: 1, path: [0] }, focus: { offset: 5, path: [0] } },
    };
    state = applyTransaction(state, runCommand(state, deleteBackward)!).state;
    expect(state.doc.content![0].content![0].text).toBe('af');
  });

  it('deleteForward deletes next char', () => {
    expect.hasAssertions();
    let state = createState(createDoc([createParagraph([createText('abcd')])]));
    state = {
      ...state,
      selection: { anchor: { offset: 2, path: [0] }, focus: { offset: 2, path: [0] } },
    };
    state = applyTransaction(state, runCommand(state, deleteForward)!).state;
    expect(state.doc.content![0].content![0].text).toBe('abd');
  });
});

describe('schema', () => {
  it('seals and rejects new nodes', () => {
    expect.hasAssertions();
    const schema = createSchema();
    sealSchema(schema);
    expect(() => {
      registerNode(schema, { atom: true, name: 'chart' });
    }).toThrow(/sealed/);
  });
});

describe('scale bench', () => {
  it('applies insert_text on 10k paragraphs under budget', () => {
    expect.hasAssertions();
    const paras = Array.from({ length: 10_000 }, (_, i) => createParagraph([createText(`p${i}`)]));
    let state = createState(createDoc(paras));
    const start = performance.now();
    state = applyTransaction(
      state,
      transaction({ offset: 0, path: [5000], text: '!', type: 'insert_text' })
    ).state;
    const ms = performance.now() - start;
    expect(state.doc.content![5000].content![0].text?.startsWith('!')).toBe(true);
    expect(ms).toBeLessThan(50);
  });

  it('jSON round-trip 1k nodes', () => {
    expect.hasAssertions();
    const paras = Array.from({ length: 1000 }, (_, i) => createParagraph([createText(`p${i}`)])),
      doc = createDoc(paras),
      json = docToJSON(doc);
    expect(json.doc.content).toHaveLength(1000);
  });
});
