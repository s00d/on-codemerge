import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { insertText } from '@on-codemerge/kernel';
import { Editor } from '../../editor/Editor';
import { ToolbarPlugin } from '../ToolbarPlugin';

describe('toolbarPlugin bold toggle', () => {
  let host: HTMLElement;
  let editor: Editor;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
    editor = new Editor(host, { plugins: [ToolbarPlugin()] });
    editor.run(insertText('Hello'));
    editor.setSelection({
      anchor: { offset: 0, path: [0] },
      focus: { offset: 5, path: [0] },
    });
  });

  afterEach(() => {
    editor.destroy();
    host.remove();
  });

  function boldBtn(): HTMLButtonElement {
    const btn = host.querySelector('[data-id="bold"]');
    if (!(btn instanceof HTMLButtonElement)) {
      throw new Error('bold button missing');
    }
    return btn;
  }

  function clickBold(): void {
    const btn = boldBtn();
    btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    btn.click();
  }

  it('bold on then bold off removes mark from document', () => {
    expect.hasAssertions();
    clickBold();
    expect(
      editor
        .getJSON()
        .doc.content?.[0]?.content?.some((n) => n.marks?.some((m) => m.type === 'bold'))
    ).toBe(true);
    expect(editor.getHTML().toLowerCase()).toMatch(/<strong>/);

    // Re-select then toggle off (toolbar.refresh remounts buttons — re-query)
    editor.setSelection({
      anchor: { offset: 0, path: [0] },
      focus: { offset: 5, path: [0] },
    });
    clickBold();
    const nodes = editor.getJSON().doc.content?.[0]?.content ?? [];
    expect(nodes.every((n) => !n.marks?.some((m) => m.type === 'bold'))).toBe(true);
    expect(editor.getHTML().toLowerCase()).not.toMatch(/<strong>/);
  });

  it('toolbar bold button reflects active state after toggle', () => {
    expect.hasAssertions();
    clickBold();
    editor.setSelection({
      anchor: { offset: 0, path: [0] },
      focus: { offset: 5, path: [0] },
    });
    editor.toolbar.refresh();
    expect(boldBtn().className).toMatch(/is-active/);

    clickBold();
    editor.setSelection({
      anchor: { offset: 0, path: [0] },
      focus: { offset: 5, path: [0] },
    });
    editor.toolbar.refresh();
    expect(boldBtn().className).not.toMatch(/is-active/);
  });
});
