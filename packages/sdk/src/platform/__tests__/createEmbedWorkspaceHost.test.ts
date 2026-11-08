import { describe, expect, it, vi } from 'vitest';
import { createDoc, createParagraph, createText, transaction } from '@codemerge/kernel';
import type { DocNode } from '@codemerge/kernel';
import type { EditorAPI } from '../../types';
import { createEmbedWorkspaceHost } from '../createEmbedWorkspaceHost';

describe('createEmbedWorkspaceHost', () => {
  it('undo / redo emit selectionChanged like dispatch', () => {
    expect.hasAssertions();
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- minimal parent stub
    const parent = new Proxy({ host: document.createElement('div') } as Record<string, unknown>, {
      get: (target, key: string) => (key in target ? target[key] : () => {}),
    }) as unknown as EditorAPI;
    const ctl = createEmbedWorkspaceHost({
      parent,
      seed: createDoc([createParagraph([createText('a')])]),
      isValidDoc: () => true,
      serialize: (d: DocNode) => JSON.stringify(d),
      parse: () => ({ ok: false }),
      invalidMessage: 'bad',
    });
    const sel = vi.fn();
    ctl.host.on('selectionChanged', sel);
    ctl.host.dispatch(transaction({ type: 'insert_text', path: [0], offset: 1, text: 'b' }));
    expect(sel).toHaveBeenCalledTimes(1);
    expect(ctl.host.undo()).toBe(true);
    expect(sel).toHaveBeenCalledTimes(2);
    expect(ctl.host.redo()).toBe(true);
    expect(sel).toHaveBeenCalledTimes(3);
    ctl.destroy();
  });
});
