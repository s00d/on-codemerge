import { describe, expect, it } from 'vitest';
import { createHistory, createParagraph, createState, createDoc, transaction } from '../index';

const typeAt = (offset: number, text: string) =>
  transaction({ type: 'insert_text', path: [0], offset, text });

describe('history merge boundary', () => {
  it('typing right after undo starts a new entry', () => {
    expect.hasAssertions();
    const hist = createHistory({ mergeWindowMs: 1000 });
    let st = createState(createDoc([createParagraph()]));
    st = hist.apply(st, typeAt(0, 'a'), 1);
    st = hist.apply(st, typeAt(1, 'b'), 2);
    expect(hist.depth()).toBe(1);
    st = hist.apply(
      st,
      transaction({ type: 'insert_node', path: [], index: 1, node: createParagraph() }),
      3
    );
    st = hist.undo(st);
    st = hist.apply(st, typeAt(2, 'c'), 4);
    // 'ab' and 'c' stay separate: undo removes only 'c'.
    expect(hist.depth()).toBe(2);
    st = hist.undo(st);
    expect(st.doc.content?.[0]?.content?.[0]?.text).toBe('ab');
  });

  it('typing right after redo starts a new entry', () => {
    expect.hasAssertions();
    const hist = createHistory({ mergeWindowMs: 1000 });
    let st = createState(createDoc([createParagraph()]));
    st = hist.apply(st, typeAt(0, 'a'), 1);
    st = hist.undo(st);
    st = hist.redo(st);
    st = hist.apply(st, typeAt(1, 'b'), Date.now());
    expect(hist.depth()).toBe(2);
  });
});
