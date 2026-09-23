import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyOp,
  applyTransaction,
  createDoc,
  createParagraph,
  createState,
  createText,
  resetIdCounter,
  transaction,
} from '../index';

beforeEach(() => {
  resetIdCounter();
});

describe('split_paragraph inverse', () => {
  it('undoes split by merging paragraphs back', () => {
    expect.hasAssertions();
    const state = createState(createDoc([createParagraph([createText('Hello')])]));
    const { state: split, inverses } = applyTransaction(
      state,
      transaction({ offset: 2, path: [0], type: 'split_paragraph' })
    );
    expect(split.doc.content).toHaveLength(2);
    expect(split.doc.content![0].content![0].text).toBe('He');
    expect(split.doc.content![1].content![0].text).toBe('llo');

    const undone = applyTransaction(split, transaction(...inverses)).state;
    expect(undone.doc.content).toHaveLength(1);
    expect(undone.doc.content![0].content![0].text).toBe('Hello');
  });

  it('merge_paragraph joins adjacent paragraphs', () => {
    expect.hasAssertions();
    const doc = createDoc([
        createParagraph([createText('ab')]),
        createParagraph([createText('cd')]),
      ]),
      { doc: next } = applyOp(doc, { path: [1], type: 'merge_paragraph' });
    expect(next.content).toHaveLength(1);
    expect(next.content![0].content![0].text).toBe('abcd');
  });
});
