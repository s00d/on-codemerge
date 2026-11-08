import { describe, expect, it } from 'vitest';
import { createDoc, createParagraph, createText, transaction } from '@codemerge/kernel';
import { Editor } from '../Editor';
import type { TransactionEvent } from '../Editor';
import type { ViewPort } from '../ViewPort';

const docOps = (e: TransactionEvent) => e.tr.ops.filter((o) => o.type !== 'set_selection');

function noopView(): ViewPort {
  return {
    update() {},
    destroy() {},
    contentTarget: () => new EventTarget(),
  };
}

describe('Editor undo/redo transactions', () => {
  it('emits local transactions carrying the undo/redo ops (collab forwards them)', () => {
    const host = document.createElement('div');
    document.body.append(host);
    const editor = new Editor(host, { createView: () => noopView() });
    editor.setJSON(createDoc([createParagraph([createText('')])]));
    editor.dispatch(transaction({ type: 'insert_text', path: [0], offset: 0, text: 'Hi' }));

    const events: TransactionEvent[] = [];
    editor.on('transaction', (e) => events.push(e as unknown as TransactionEvent));

    expect(editor.undo()).toBe(true);
    expect(editor.getState().doc.content?.[0]?.content?.[0]?.text ?? '').toBe('');
    expect(editor.redo()).toBe(true);
    expect(editor.getState().doc.content?.[0]?.content?.[0]?.text).toBe('Hi');

    expect(events.map((e) => e.source)).toStrictEqual(['local', 'local']);
    expect(docOps(events[0]!)).toStrictEqual([
      { type: 'delete_text', path: [0], offset: 0, length: 2 },
    ]);
    expect(docOps(events[1]!)).toStrictEqual([
      { type: 'insert_text', path: [0], offset: 0, text: 'Hi' },
    ]);
    editor.destroy();
    host.remove();
  });
});
