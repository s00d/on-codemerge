import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyTransaction,
  createDoc,
  createParagraph,
  createState,
  createText,
  plainText,
  resetIdCounter,
  runCommand,
  selectionHasMark,
  toggleMark,
} from '../index';

beforeEach(() => {
  resetIdCounter();
});

describe('toggleMark on/off', () => {
  it('applies bold then removes it on second toggle (same selection)', () => {
    expect.hasAssertions();
    let state = createState(createDoc([createParagraph([createText('Hello')])]));
    state = {
      ...state,
      selection: { anchor: { offset: 0, path: [0] }, focus: { offset: 5, path: [0] } },
    };

    const on = runCommand(state, toggleMark('bold'));
    expect(on).not.toBeNull();
    expect(on!.ops[0]?.type).toBe('set_mark');
    state = applyTransaction(state, on!).state;
    expect(state.doc.content![0].content![0].marks?.some((m) => m.type === 'bold')).toBe(true);
    expect(selectionHasMark('bold')(state)).toBe(true);

    // Selection must still cover the range after set_mark
    expect(state.selection.anchor.offset).toBe(0);
    expect(state.selection.focus.offset).toBe(5);

    const off = runCommand(state, toggleMark('bold'));
    expect(off).not.toBeNull();
    expect(off!.ops[0]?.type).toBe('remove_mark');
    state = applyTransaction(state, off!).state;
    expect(
      state.doc.content![0].content?.every((n) => !n.marks?.some((m) => m.type === 'bold'))
    ).toBe(true);
    expect(plainText(state.doc.content![0])).toBe('Hello');
    expect(selectionHasMark('bold')(state)).toBe(false);
  });

  it('sets bold on mixed range (partially bold → set, not remove)', () => {
    expect.hasAssertions();
    let state = createState(
      createDoc([createParagraph([createText('He', [{ type: 'bold' }]), createText('llo')])])
    );
    state = {
      ...state,
      selection: { anchor: { offset: 0, path: [0] }, focus: { offset: 5, path: [0] } },
    };
    const tr = runCommand(state, toggleMark('bold'));
    expect(tr?.ops[0]?.type).toBe('set_mark');
    state = applyTransaction(state, tr!).state;
    expect(selectionHasMark('bold')(state)).toBe(true);
  });

  it('returns null for collapsed selection', () => {
    expect.hasAssertions();
    const state = createState(createDoc([createParagraph([createText('ab')])]));
    expect(runCommand(state, toggleMark('bold'))).toBeNull();
  });
});
