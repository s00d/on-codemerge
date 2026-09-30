import { describe, expect, it } from 'vitest';
import { applyOps, createDoc, createParagraph, createText, resetIdCounter } from '../index';
import { rebaseOps, transformOp } from '../transform';
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
    const afterA = applyOps(doc, a).doc;
    const rebasedB = rebaseOps(b, a);
    const finalFromA = applyOps(afterA, rebasedB).doc;
    const afterB = applyOps(doc, b).doc;
    const rebasedA = rebaseOps(a, b);
    const finalFromB = applyOps(afterB, rebasedA).doc;
    expect(finalFromA).toEqual(finalFromB);
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
});
