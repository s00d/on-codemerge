import { describe, expect, it } from 'vitest';
/**
 * @jest-environment jsdom
 */
import {
  applyTransaction,
  createDoc,
  createParagraph,
  createState,
  createText,
  transaction,
} from '@on-codemerge/kernel';
import type { Mark } from '@on-codemerge/kernel';
import { EditorView } from '../EditorView';
import { InputBridge } from '../InputBridge';

describe('editorView integrity', () => {
  it('forceSync restores model after DOM tamper', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const state = createState(createDoc([createParagraph([createText('Safe')])])),
      view = new EditorView(host, state);
    expect(view.content.textContent).toContain('Safe');
    view.content.innerHTML = '<p>HACKED</p>';
    expect(view.content.textContent).toContain('HACKED');
    view.forceSync();
    expect(view.content.textContent).toContain('Safe');
    expect(view.content.textContent).not.toContain('HACKED');
    view.destroy();
    host.remove();
  });

  it('selection-only update does not remount DOM (dblclick-safe)', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    let state = createState(createDoc([createParagraph([createText('hello')])]));
    const view = new EditorView(host, state);
    const block = view.content.querySelector('[data-ocm-block="0"]') as HTMLElement;
    expect(block).toBeTruthy();
    block.dataset.probe = '1';
    state = applyTransaction(
      state,
      transaction({
        type: 'set_selection',
        selection: {
          anchor: { offset: 2, path: [0] },
          focus: { offset: 2, path: [0] },
        },
      })
    ).state;
    view.updateSelection(state);
    expect(view.content.querySelector('[data-ocm-block="0"]')?.dataset.probe).toBe('1');
    view.destroy();
    host.remove();
  });

  it('update after dispatch reprojects selection path blocks', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    let state = createState(createDoc([createParagraph([createText('ab')])]));
    const view = new EditorView(host, state);
    state = applyTransaction(
      state,
      transaction({ offset: 2, path: [0], text: 'c', type: 'insert_text' })
    ).state;
    view.update(state);
    expect(view.content.querySelector('[data-ocm-block="0"]')?.textContent).toBe('abc');
    view.destroy();
    host.remove();
  });
});

describe('inputBridge selection', () => {
  it('dispatches set_selection on mouseup after click inside block', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    let state = createState(createDoc([createParagraph([createText('hello')])]));
    const view = new EditorView(host, state),
      dispatches: unknown[] = [],
      bridge = new InputBridge(
        view.content,
        () => state,
        (tr) => {
          dispatches.push(tr);
          state = applyTransaction(state, tr).state;
          view.update(state);
        },
        () => view.isProjecting
      ),
      block = view.content.querySelector('[data-ocm-block="0"]') as HTMLElement,
      // Place caret at offset 2 via Range
      textNode = block.firstChild as Text,
      range = document.createRange();
    range.setStart(textNode, 2);
    range.collapse(true);
    const sel = globalThis.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);
    view.content.focus();
    view.content.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    expect(dispatches.some((d: any) => d.ops?.[0]?.type === 'set_selection')).toBe(true);
    expect(state.selection.anchor.offset).toBe(2);
    bridge.destroy();
    view.destroy();
    host.remove();
  });

  it('enter keeps caret on new empty paragraph (not doc start)', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    let state = createState(createDoc([createParagraph([createText('hello')])]));
    state = {
      ...state,
      selection: { anchor: { offset: 5, path: [0] }, focus: { offset: 5, path: [0] } },
    };
    const view = new EditorView(host, state);
    view.update(state);
    const bridge = new InputBridge(
      view.content,
      () => state,
      (tr) => {
        state = applyTransaction(state, tr).state;
        view.update(state);
      },
      () => view.isProjecting
    );
    view.content.focus();
    view.content.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' })
    );
    expect(state.doc.content).toHaveLength(2);
    expect(state.selection.anchor.path[0]).toBe(1);
    expect(state.selection.anchor.offset).toBe(0);
    const native = globalThis.getSelection();
    const block = view.content.querySelector('[data-ocm-block="1"]');
    expect(block).toBeTruthy();
    expect(native?.anchorNode === block || block?.contains(native?.anchorNode ?? null)).toBe(true);
    bridge.destroy();
    view.destroy();
    host.remove();
  });

  it('enter on list item splits without destroying list', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    let state = createState(
      createDoc([
        {
          type: 'bulletList',
          content: [{ type: 'listItem', content: [createText('abcd')] }],
        },
      ])
    );
    state = {
      ...state,
      selection: { anchor: { offset: 2, path: [0, 0] }, focus: { offset: 2, path: [0, 0] } },
    };
    const view = new EditorView(host, state);
    view.update(state);
    const bridge = new InputBridge(
      view.content,
      () => state,
      (tr) => {
        state = applyTransaction(state, tr).state;
        view.update(state);
      },
      () => view.isProjecting
    );
    view.content.focus();
    view.content.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' })
    );
    expect(state.doc.content![0].type).toBe('bulletList');
    expect(state.doc.content![0].content).toHaveLength(2);
    expect(state.selection.anchor.path).toStrictEqual([0, 1]);
    expect(view.content.querySelectorAll('li')).toHaveLength(2);
    bridge.destroy();
    view.destroy();
    host.remove();
  });

  it('applies storedMarks on insert and softDelete on backspace', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    let state = createState(createDoc([createParagraph([createText('')])]));
    const view = new EditorView(host, state);
    view.update(state);
    let soft: Mark | null = {
      type: 'deletion',
      attrs: { author: 't' },
    };
    const bridge = new InputBridge(
      view.content,
      () => state,
      (tr) => {
        state = applyTransaction(state, tr).state;
        view.update(state);
      },
      () => false,
      () => ({
        storedMarks: [{ type: 'insertion', attrs: { author: 't' } }],
        softDelete: soft,
      })
    );
    view.content.dispatchEvent(
      new InputEvent('beforeinput', {
        inputType: 'insertText',
        data: 'Hi',
        bubbles: true,
        cancelable: true,
      })
    );
    expect(state.doc.content![0].content![0].text).toBe('Hi');
    expect(state.doc.content![0].content![0].marks?.[0].type).toBe('insertion');

    view.content.dispatchEvent(
      new InputEvent('beforeinput', {
        inputType: 'deleteContentBackward',
        bubbles: true,
        cancelable: true,
      })
    );
    // insertion mark → hard delete
    expect(state.doc.content![0].content![0].text).toBe('H');
    soft = null;
    bridge.destroy();
    view.destroy();
    host.remove();
  });
});
