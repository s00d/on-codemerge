import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyTransaction,
  createDoc,
  createList,
  createListItem,
  createParagraph,
  createState,
  createText,
  deleteBackward,
  resetIdCounter,
  runCommand,
  splitBlock,
  insertText,
} from '../index';

beforeEach(() => {
  resetIdCounter();
});

describe('nested list editing', () => {
  it('enter mid-item splits into two list items (does not destroy list)', () => {
    expect.hasAssertions();
    let state = createState(
      createDoc([createList('bulletList', [createListItem([createText('abcd')])])])
    );
    state = {
      ...state,
      selection: { anchor: { offset: 2, path: [0, 0] }, focus: { offset: 2, path: [0, 0] } },
    };
    state = applyTransaction(state, runCommand(state, splitBlock)!).state;
    expect(state.doc.content![0].type).toBe('bulletList');
    expect(state.doc.content![0].content).toHaveLength(2);
    expect(state.doc.content![0].content![0].type).toBe('listItem');
    expect(state.doc.content![0].content![1].type).toBe('listItem');
    expect(state.doc.content![0].content![0].content![0].text).toBe('ab');
    expect(state.doc.content![0].content![1].content![0].text).toBe('cd');
    expect(state.selection.anchor).toStrictEqual({ offset: 0, path: [0, 1] });
  });

  it('enter on empty list item after split exits list', () => {
    expect.hasAssertions();
    let state = createState(
      createDoc([createList('bulletList', [createListItem([createText('keep')])])])
    );
    state = {
      ...state,
      selection: { anchor: { offset: 4, path: [0, 0] }, focus: { offset: 4, path: [0, 0] } },
    };
    state = applyTransaction(state, runCommand(state, splitBlock)!).state;
    expect(state.doc.content![0].content![1].type).toBe('listItem');
    expect(state.selection.anchor.path).toStrictEqual([0, 1]);
    // second Enter on empty item → paragraph after list
    state = applyTransaction(state, runCommand(state, splitBlock)!).state;
    expect(state.doc.content![0].type).toBe('bulletList');
    expect(state.doc.content![0].content).toHaveLength(1);
    expect(state.doc.content![1].type).toBe('paragraph');
    expect(state.selection.anchor.path).toStrictEqual([1]);
  });

  it('enter on empty paragraph wrongly nested in list still exits', () => {
    expect.hasAssertions();
    let state = createState(
      createDoc([
        {
          type: 'bulletList',
          content: [createListItem([createText('a')]), createParagraph([createText('')])],
        },
      ])
    );
    state = {
      ...state,
      selection: { anchor: { offset: 0, path: [0, 1] }, focus: { offset: 0, path: [0, 1] } },
    };
    state = applyTransaction(state, runCommand(state, splitBlock)!).state;
    expect(state.doc.content![0].type).toBe('bulletList');
    expect(state.doc.content![0].content).toHaveLength(1);
    expect(state.doc.content![1].type).toBe('paragraph');
  });

  it('enter on empty list item exits list to paragraph', () => {
    expect.hasAssertions();
    let state = createState(
      createDoc([
        createList('bulletList', [
          createListItem([createText('keep')]),
          createListItem([createText('')]),
        ]),
      ])
    );
    state = {
      ...state,
      selection: { anchor: { offset: 0, path: [0, 1] }, focus: { offset: 0, path: [0, 1] } },
    };
    state = applyTransaction(state, runCommand(state, splitBlock)!).state;
    expect(state.doc.content![0].type).toBe('bulletList');
    expect(state.doc.content![0].content).toHaveLength(1);
    expect(state.doc.content![1].type).toBe('paragraph');
    expect(state.selection.anchor.path).toStrictEqual([1]);
  });

  it('enter on sole empty list item replaces list with paragraph', () => {
    expect.hasAssertions();
    let state = createState(
      createDoc([createList('bulletList', [createListItem([createText('')])])])
    );
    state = {
      ...state,
      selection: { anchor: { offset: 0, path: [0, 0] }, focus: { offset: 0, path: [0, 0] } },
    };
    state = applyTransaction(state, runCommand(state, splitBlock)!).state;
    expect(state.doc.content).toHaveLength(1);
    expect(state.doc.content![0].type).toBe('paragraph');
  });

  it('does not wipe list when path points at list container (resolves to item)', () => {
    expect.hasAssertions();
    let state = createState(
      createDoc([createList('bulletList', [createListItem([createText('x')])])])
    );
    state = {
      ...state,
      selection: { anchor: { offset: 1, path: [0] }, focus: { offset: 1, path: [0] } },
    };
    state = applyTransaction(state, runCommand(state, splitBlock)!).state;
    expect(state.doc.content![0].type).toBe('bulletList');
    expect(state.doc.content![0].content).toHaveLength(2);
  });

  it('backspace merges adjacent list items', () => {
    expect.hasAssertions();
    let state = createState(
      createDoc([
        createList('bulletList', [
          createListItem([createText('ab')]),
          createListItem([createText('cd')]),
        ]),
      ])
    );
    state = {
      ...state,
      selection: { anchor: { offset: 0, path: [0, 1] }, focus: { offset: 0, path: [0, 1] } },
    };
    state = applyTransaction(state, runCommand(state, deleteBackward)!).state;
    expect(state.doc.content![0].content).toHaveLength(1);
    expect(state.doc.content![0].content![0].content![0].text).toBe('abcd');
  });

  it('typing into list item inserts text', () => {
    expect.hasAssertions();
    let state = createState(
      createDoc([createList('bulletList', [createListItem([createText('a')])])])
    );
    state = {
      ...state,
      selection: { anchor: { offset: 1, path: [0, 0] }, focus: { offset: 1, path: [0, 0] } },
    };
    state = applyTransaction(state, runCommand(state, insertText('b'))!).state;
    expect(state.doc.content![0].content![0].content![0].text).toBe('ab');
  });
});

describe('heading Enter', () => {
  it('enter at end of heading inserts paragraph after', () => {
    expect.hasAssertions();
    let state = createState(
      createDoc([{ type: 'heading', attrs: { level: 1 }, content: [createText('Title')] }])
    );
    state = {
      ...state,
      selection: { anchor: { offset: 5, path: [0] }, focus: { offset: 5, path: [0] } },
    };
    state = applyTransaction(state, runCommand(state, splitBlock)!).state;
    expect(state.doc.content![0].type).toBe('heading');
    expect(state.doc.content![1].type).toBe('paragraph');
    expect(state.selection.anchor.path).toStrictEqual([1]);
  });
});

describe('table cell Enter', () => {
  it('enter inside cell paragraph does not destroy table', () => {
    expect.hasAssertions();
    const table = {
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
    };
    let state = createState(createDoc([table]));
    state = {
      ...state,
      selection: {
        anchor: { offset: 2, path: [0, 0, 0, 0] },
        focus: { offset: 2, path: [0, 0, 0, 0] },
      },
    };
    state = applyTransaction(state, runCommand(state, splitBlock)!).state;
    expect(state.doc.content![0].type).toBe('table');
    const cell = state.doc.content![0].content![0].content![0];
    expect(cell.content).toHaveLength(2);
    expect(state.selection.anchor.path).toStrictEqual([0, 0, 0, 1]);
  });
});
