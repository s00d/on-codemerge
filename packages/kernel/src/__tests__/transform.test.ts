import { describe, expect, it } from 'vitest';
import {
  applyOps,
  collapsedAt,
  createDoc,
  createParagraph,
  createText,
  resetIdCounter,
} from '../index';
import { rebaseOps, transformOp, transformPair } from '../transform';
import type { Operation } from '../operations';

describe('transformOp / rebaseOps', () => {
  it('shifts insert offset after earlier insert on same path', () => {
    const against: Operation = {
      type: 'insert_text',
      path: [0],
      offset: 0,
      text: 'Hi',
    };
    const op: Operation = { type: 'insert_text', path: [0], offset: 1, text: '!' };
    expect(transformOp(op, against)).toEqual({
      type: 'insert_text',
      path: [0],
      offset: 3,
      text: '!',
    });
  });

  it('shifts sibling path after insert_node', () => {
    const against: Operation = {
      type: 'insert_node',
      path: [],
      index: 0,
      node: createParagraph([createText('x')]),
    };
    const op: Operation = { type: 'insert_text', path: [0], offset: 0, text: 'a' };
    expect(transformOp(op, against)).toEqual({
      type: 'insert_text',
      path: [1],
      offset: 0,
      text: 'a',
    });
  });

  it('rebases concurrent inserts to same final doc', () => {
    resetIdCounter();
    const doc = createDoc([createParagraph([createText('ab')])]);
    const a: Operation[] = [{ type: 'insert_text', path: [0], offset: 0, text: 'X' }];
    const b: Operation[] = [{ type: 'insert_text', path: [0], offset: 2, text: 'Y' }];
    const afterA = applyOps(doc, a, collapsedAt([0, 0], 0)).doc;
    const rebasedB = rebaseOps(b, a);
    const finalFromA = applyOps(afterA, rebasedB, collapsedAt([0, 0], 0)).doc;
    const afterB = applyOps(doc, b, collapsedAt([0, 0], 0)).doc;
    const rebasedA = rebaseOps(a, b);
    const finalFromB = applyOps(afterB, rebasedA, collapsedAt([0, 0], 0)).doc;
    expect(finalFromA).toEqual(finalFromB);
  });

  it('shifts sibling node ops after split_paragraph / merge_paragraph', () => {
    const split: Operation = { type: 'split_paragraph', path: [1], offset: 2 };
    expect(transformOp({ type: 'remove_node', path: [], index: 2 }, split)).toEqual({
      type: 'remove_node',
      path: [],
      index: 3,
    });
    expect(transformOp({ type: 'remove_node', path: [], index: 0 }, split)).toEqual({
      type: 'remove_node',
      path: [],
      index: 0,
    });
    const merge: Operation = { type: 'merge_paragraph', path: [1] };
    expect(transformOp({ type: 'remove_node', path: [], index: 2 }, merge)).toEqual({
      type: 'remove_node',
      path: [],
      index: 1,
    });
    expect(transformOp({ type: 'remove_node', path: [], index: 1 }, merge)).toBeNull();
  });

  it('drops set_selection from rebase', () => {
    const client: Operation[] = [
      {
        type: 'set_selection',
        selection: { anchor: { path: [0], offset: 0 }, focus: { path: [0], offset: 0 } },
      },
      { type: 'insert_text', path: [0], offset: 0, text: 'a' },
    ];
    expect(rebaseOps(client, [])).toEqual([
      { type: 'insert_text', path: [0], offset: 0, text: 'a' },
    ]);
  });

  it('transformPair converges on insert ties and multi-op sequences', () => {
    resetIdCounter();
    const doc = createDoc([
      createParagraph([createText('ab')]),
      createParagraph([createText('cd')]),
    ]);
    const sel = collapsedAt([0, 0], 0);
    const cases: Array<[Operation[], Operation[]]> = [
      [
        [{ type: 'insert_text', path: [0], offset: 1, text: 'A' }],
        [{ type: 'insert_text', path: [0], offset: 1, text: 'B' }],
      ],
      [
        [
          { type: 'insert_node', path: [], index: 0, node: createParagraph([createText('n')]) },
          { type: 'insert_text', path: [1], offset: 0, text: 'A' },
        ],
        [
          { type: 'insert_text', path: [0], offset: 2, text: 'B' },
          { type: 'insert_node', path: [], index: 0, node: createParagraph([createText('m')]) },
        ],
      ],
    ];
    for (const [a, b] of cases) {
      const [a2, b2] = transformPair(a, b);
      const viaA = applyOps(applyOps(doc, a, sel).doc, b2, sel).doc;
      const viaB = applyOps(applyOps(doc, b, sel).doc, a2, sel).doc;
      expect(viaA).toEqual(viaB);
      expect(rebaseOps(a, b)).toEqual(a2);
    }
  });
});
