/**
 * @jest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { insertText } from '@codemerge/kernel';
import { Editor } from '../Editor';
import type { ViewPort } from '../ViewPort';

function noopView(): ViewPort {
  return {
    update() {},
    destroy() {},
    contentTarget: () => new EventTarget(),
  };
}

describe('Editor diagnostics', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('calls onMeasure for dispatch / view.update / toolbar.refresh', () => {
    expect.hasAssertions();
    const measures: string[] = [];
    const host = document.createElement('div');
    document.body.append(host);
    const editor = new Editor(host, {
      createView: () => noopView(),
      diagnostics: {
        onMeasure: (name) => {
          measures.push(name);
        },
      },
    });
    editor.run(insertText('hi'));
    expect(measures).toContain('dispatch');
    expect(measures).toContain('view.update');
    expect(measures).toContain('toolbar.refresh');
    editor.destroy();
    host.remove();
    vi.clearAllMocks();
  });
});
