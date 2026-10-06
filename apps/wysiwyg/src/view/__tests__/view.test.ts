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
} from '@codemerge/kernel';
import type { EditorAPI } from '@codemerge/sdk';
import { h } from '@codemerge/sdk';
import { EditorView } from '../EditorView';
import { InputBridge } from '../InputBridge';

describe('editorView', () => {
  it('mounts projection and updates from state', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    let state = createState(createDoc([createParagraph([createText('Hi')])]));
    const view = new EditorView(host, state);
    expect(view.content.textContent).toContain('Hi');
    state = applyTransaction(
      state,
      transaction({ offset: 2, path: [0], text: '!', type: 'insert_text' })
    ).state;
    view.update(state);
    expect(view.content.textContent).toContain('Hi!');
    view.destroy();
    host.remove();
  });

  it('viewport keeps mounted blocks bounded for large docs', () => {
    expect.hasAssertions();
    const paras = Array.from({ length: 500 }, (_, i) => createParagraph([createText(`p${i}`)])),
      state = createState(createDoc(paras)),
      host = document.createElement('div');
    document.body.append(host);
    const view = new EditorView(host, state, { overscan: 5, viewportSize: 50 });
    expect(view.mountedBlockCount()).toBeLessThanOrEqual(60);
    expect(view.mountedBlockCount()).toBeLessThan(500);
    view.destroy();
    host.remove();
  });

  it('does not remount a table atom when a sibling paragraph is edited', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    let renders = 0;
    const widgets = new Map([
      [
        'tableGrid',
        {
          render: () => {
            renders += 1;
            return h('div', { class: 'tbl' }, 'grid');
          },
        },
      ],
    ]);
    let state = createState(
      createDoc([
        createParagraph([createText('Hi')]),
        { type: 'tableGrid', attrs: { id: 'g1' } },
        createParagraph([createText('Lo')]),
      ])
    );
    const view = new EditorView(host, state, {}, widgets);
    const fakeEditor = {
      run: () => true,
      ui: { menu: { open: () => undefined } },
    } as unknown as EditorAPI;
    view.setEditorAccessor(() => fakeEditor);
    expect(renders).toBe(1);
    state = applyTransaction(
      state,
      transaction({ offset: 2, path: [0], text: '!', type: 'insert_text' })
    ).state;
    view.update(state);
    expect(view.content.textContent).toContain('Hi!');
    expect(renders).toBe(1);
    view.destroy();
    host.remove();
  });
});

describe('inputBridge', () => {
  it('insertText via beforeinput updates through dispatch', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    let state = createState();
    const view = new EditorView(host, state),
      dispatches: unknown[] = [],
      bridge = new InputBridge(
        view.content,
        () => state,
        (tr) => {
          dispatches.push(tr);
          state = applyTransaction(state, tr).state;
          view.update(state);
        }
      ),
      ev = new InputEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        data: 'A',
        inputType: 'insertText',
      });
    view.content.dispatchEvent(ev);
    expect(dispatches).toHaveLength(1);
    expect(state.doc.content![0].content![0].text).toBe('A');
    bridge.destroy();
    view.destroy();
    host.remove();
  });
});
