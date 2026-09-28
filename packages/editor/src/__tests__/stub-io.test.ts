/**
 * @jest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import { Editor } from '../Editor';
import type { ViewPort } from '../ViewPort';

function noopView(): ViewPort {
  return {
    update() {},
    destroy() {},
    contentTarget: () => new EventTarget(),
  };
}

describe('shared Editor stub prose IO', () => {
  it('defaults do not throw and return empty when io omitted', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const editor = new Editor(host, { createView: () => noopView() });
    expect(editor.getHTML()).toBe('');
    expect(editor.getMarkdown()).toBe('');
    expect(editor.getPublishedHTML()).toBe('');
    expect(editor.getPublishedDocument()).toBe('');
    expect(editor.getPublishedJS()).toBeNull();
    expect(() => editor.setHTML('<p>x</p>')).not.toThrow();
    expect(() => editor.setMarkdown('# x')).not.toThrow();
    editor.destroy();
    host.remove();
  });
});
