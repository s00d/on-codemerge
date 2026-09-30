import { describe, expect, it } from 'vitest';
import {
  applyTransaction,
  createDoc,
  createParagraph,
  createState,
  createText,
  runCommand,
} from '@codemerge/kernel';
import { clearStyles } from '../commands';

describe('clearStyles', () => {
  it('clears style marks on selection', () => {
    expect.hasAssertions();
    let state = createState(
      createDoc([
        createParagraph([
          createText('Hi', [{ type: 'bold' }, { type: 'italic' }]),
          createText(' there'),
        ]),
      ])
    );
    state = {
      ...state,
      selection: {
        anchor: { path: [0], offset: 0 },
        focus: { path: [0], offset: 2 },
      },
    };
    const tx = runCommand(state, clearStyles());
    expect(tx).toBeTruthy();
    state = applyTransaction(state, tx!).state;
    const marks = state.doc.content?.[0]?.content?.[0]?.marks ?? [];
    expect(marks.some((m) => m.type === 'bold')).toBe(false);
    expect(marks.some((m) => m.type === 'italic')).toBe(false);
  });

  it('clears whole document when caret collapsed', () => {
    expect.hasAssertions();
    let state = createState(
      createDoc([
        createParagraph([createText('A', [{ type: 'bold' }])]),
        createParagraph([createText('B', [{ type: 'textColor', attrs: { color: '#f00' } }])]),
      ])
    );
    state = {
      ...state,
      selection: {
        anchor: { path: [0], offset: 0 },
        focus: { path: [0], offset: 0 },
      },
    };
    const tx = runCommand(state, clearStyles());
    expect(tx).toBeTruthy();
    state = applyTransaction(state, tx!).state;
    const p0 = state.doc.content?.[0]?.content?.[0];
    const p1 = state.doc.content?.[1]?.content?.[0];
    expect(p0?.marks ?? []).toHaveLength(0);
    expect(p1?.marks ?? []).toHaveLength(0);
  });

  it('clears block style attrs on collapsed clear', () => {
    expect.hasAssertions();
    let state = createState(
      createDoc([
        {
          type: 'paragraph',
          attrs: { align: 'center', style: { color: '#111' }, lineHeight: '1.8' },
          content: [createText('X')],
        },
      ])
    );
    state = {
      ...state,
      selection: {
        anchor: { path: [0], offset: 0 },
        focus: { path: [0], offset: 0 },
      },
    };
    const tx = runCommand(state, clearStyles());
    expect(tx).toBeTruthy();
    state = applyTransaction(state, tx!).state;
    const attrs = state.doc.content?.[0]?.attrs ?? {};
    expect(attrs.align).toBe('');
    expect(attrs.style).toBe('');
    expect(attrs.lineHeight).toBe('');
  });
});
