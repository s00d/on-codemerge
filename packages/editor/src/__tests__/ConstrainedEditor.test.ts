import { describe, expect, it, afterEach } from 'vitest';
import { createDoc, createParagraph, createText, collapsedAt } from '@codemerge/kernel';
import type { DocNode } from '@codemerge/kernel';
import { ConstrainedEditor } from '../ConstrainedEditor';
import type { ViewPort } from '../ViewPort';

function noopView(): ViewPort {
  return {
    update() {},
    destroy() {},
    contentTarget: () => new EventTarget(),
  };
}

function isSingleType(doc: DocNode, type: string): boolean {
  return doc.type === 'doc' && doc.content?.length === 1 && doc.content[0]?.type === type;
}

class ProbeEditor extends ConstrainedEditor {
  protected isConstrainedDoc(doc: DocNode): boolean {
    return isSingleType(doc, 'json');
  }

  protected constrainedDocError(): string {
    return 'must be json SoT';
  }
}

function emptyJsonDoc(): DocNode {
  return {
    type: 'doc',
    content: [{ type: 'json', attrs: { value: null, indent: 2 }, content: [] }],
  };
}

describe('ConstrainedEditor', () => {
  const hosts: HTMLElement[] = [];

  afterEach(() => {
    for (const host of hosts) {
      const ed = Reflect.get(host, '__editor');
      if (ed && typeof ed.destroy === 'function') {
        ed.destroy();
      }
      host.remove();
    }
    hosts.length = 0;
  });

  function mount(): ProbeEditor {
    const host = document.createElement('div');
    document.body.append(host);
    hosts.push(host);
    const editor = new ProbeEditor(host, {
      createView: () => noopView(),
      doc: emptyJsonDoc(),
    });
    Reflect.set(host, '__editor', editor);
    return editor;
  }

  it('setJSON / replaceDocument throw on wrong shape', () => {
    const editor = mount();
    const prose = createDoc([createParagraph([createText('x')])]);
    expect(() => {
      editor.setJSON(prose);
    }).toThrow(/must be json SoT/);
    expect(() => {
      editor.replaceDocument(prose);
    }).toThrow(/must be json SoT/);
    expect(editor.getJSON().doc.content?.[0]?.type).toBe('json');
  });

  it('dispatch drops ops that break SoT; selection still applies', () => {
    const editor = mount();
    editor.dispatch({
      ops: [{ type: 'remove_node', path: [], index: 0 }],
    });
    expect(editor.getJSON().doc.content?.[0]?.type).toBe('json');
    expect(editor.getJSON().doc.content).toHaveLength(1);

    editor.dispatch({
      ops: [{ type: 'set_selection', selection: collapsedAt([0], 0) }],
    });
    expect(editor.getSelection().anchor.path).toStrictEqual([0]);
  });

  it('run returns false when command does not change state', () => {
    const editor = mount();
    expect(editor.run(() => null)).toBe(false);
  });
});
