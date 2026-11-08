import { afterEach, describe, expect, it } from 'vitest';
import { applyTransaction, createDoc, createState, createText, plainText } from '@codemerge/kernel';
import type { DocNode, EditorState } from '@codemerge/kernel';
import { EditorView } from '../EditorView';
import { InputBridge } from '../InputBridge';

/** bulletList > li[ p("ab"), bulletList > li("cd"), li[p("ef")] ] */
function nestedDoc(): DocNode {
  return createDoc([
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [
            { type: 'paragraph', content: [createText('ab')] },
            {
              type: 'bulletList',
              content: [
                { type: 'listItem', content: [createText('cd')] },
                {
                  type: 'listItem',
                  content: [{ type: 'paragraph', content: [createText('ef')] }],
                },
              ],
            },
          ],
        },
      ],
    },
  ]);
}

let cleanup: (() => void) | null = null;
afterEach(() => {
  cleanup?.();
  cleanup = null;
});

function setup() {
  const host = document.createElement('div');
  document.body.append(host);
  let state: EditorState = createState(nestedDoc());
  const view = new EditorView(host, state);
  const bridge = new InputBridge(
    view.content,
    () => state,
    (tr) => {
      state = applyTransaction(state, tr).state;
      view.update(state);
    },
    () => view.isProjecting
  );
  cleanup = () => {
    bridge.destroy();
    view.destroy();
    host.remove();
  };
  /** Put the DOM caret inside the text node whose data is `text`. */
  const caret = (text: string, offset: number) => {
    const walker = document.createTreeWalker(view.content, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node && (node as Text).data !== text) {
      node = walker.nextNode();
    }
    if (!node) {
      throw new Error(`no text node "${text}" in ${view.content.innerHTML}`);
    }
    const range = document.createRange();
    range.setStart(node, offset);
    range.collapse(true);
    const sel = globalThis.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);
  };
  const input = (inputType: string, data?: string) =>
    view.content.dispatchEvent(
      new InputEvent('beforeinput', { inputType, data, bubbles: true, cancelable: true })
    );
  const enter = () =>
    view.content.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' })
    );
  const outer = () => state.doc.content![0]!.content![0]!;
  const inner = () => outer().content![1]!;
  return { view, caret, input, enter, outer, inner, state: () => state };
}

describe('nested list editing (block-form listItem)', () => {
  it('renders addressable paths for the item paragraph and nested items', () => {
    expect.hasAssertions();
    const { view } = setup();
    const paths = [...view.content.querySelectorAll('[data-ocm-path]')].map(
      (el) => (el as HTMLElement).dataset.ocmPath
    );
    expect(paths).toStrictEqual(['0.0', '0.0.0', '0.0.1.0', '0.0.1.1', '0.0.1.1.0']);
    expect(view.content.querySelector('li > p')?.textContent).toBe('ab');
  });

  it('types into the item paragraph without touching the nested list', () => {
    expect.hasAssertions();
    const { caret, input, outer, inner, state } = setup();
    caret('ab', 1);
    input('insertText', 'Z');
    expect(plainText(outer().content![0]!)).toBe('aZb');
    expect(state().selection.anchor).toStrictEqual({ path: [0, 0, 0], offset: 2 });
    expect(inner().content!.map(plainText)).toStrictEqual(['cd', 'ef']);
  });

  it('types into flat and block-form nested items', () => {
    expect.hasAssertions();
    const { caret, input, inner } = setup();
    caret('cd', 1);
    input('insertText', 'X');
    caret('ef', 2);
    input('insertText', 'Y');
    expect(inner().content!.map(plainText)).toStrictEqual(['cXd', 'efY']);
  });

  it('enter splits a nested item inside the nested list', () => {
    expect.hasAssertions();
    const { caret, enter, outer, inner, state } = setup();
    caret('cd', 1);
    enter();
    expect(outer().content).toHaveLength(2);
    expect(inner().content!.map(plainText)).toStrictEqual(['c', 'd', 'ef']);
    expect(state().selection.anchor.path).toStrictEqual([0, 0, 1, 1]);
  });

  it('backspace deletes inside nested item and merges nested items at offset 0', () => {
    expect.hasAssertions();
    const { caret, input, inner } = setup();
    caret('cd', 1);
    input('deleteContentBackward');
    expect(inner().content!.map(plainText)).toStrictEqual(['d', 'ef']);
    caret('ef', 0);
    input('deleteContentBackward');
    expect(inner().content!.map(plainText)).toStrictEqual(['def']);
  });

  it('caret in the item paragraph maps to the paragraph path, not the li', () => {
    expect.hasAssertions();
    const { view, caret, state } = setup();
    caret('ab', 2);
    view.content.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    expect(state().selection.anchor).toStrictEqual({ path: [0, 0, 0], offset: 2 });
  });

  it('enter in the item paragraph opens a new outer item that takes the nested list', () => {
    expect.hasAssertions();
    const { view, caret, enter, state } = setup();
    caret('ab', 2);
    enter();
    const items = state().doc.content![0]!.content!;
    expect(items).toHaveLength(2);
    expect(plainText(items[0]!)).toBe('ab');
    expect(items[1]!.content!.map((c) => c.type)).toStrictEqual(['paragraph', 'bulletList']);
    expect(state().selection.anchor).toStrictEqual({ path: [0, 1, 0], offset: 0 });
    expect(view.content.querySelector('[data-ocm-path="0.1.0"]')).toBeTruthy();
  });

  it('backspace at the start of the first item keeps the nested list', () => {
    expect.hasAssertions();
    const { caret, input, state } = setup();
    caret('ab', 0);
    input('deleteContentBackward');
    const top = state().doc.content!;
    expect(top.map((n) => n.type)).toStrictEqual(['paragraph', 'bulletList']);
    expect(plainText(top[0]!)).toBe('ab');
    expect(top[1]!.content!.map(plainText)).toStrictEqual(['cd', 'ef']);
  });
});
