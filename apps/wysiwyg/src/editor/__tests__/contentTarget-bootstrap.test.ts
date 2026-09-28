/**
 * @jest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest';
import { Editor } from '../Editor';

describe('shim Editor bootstrap contentTarget', () => {
  it('onDom(content) binds CE surface, not host', () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const onClick = vi.fn();

    const editor = new Editor(host, {
      plugins: [
        {
          name: 'probe-content-target',
          setup(ctx) {
            ctx.onDom('content', 'click', onClick);
          },
        },
      ],
    });

    const ce = host.querySelector('.ocm-content');
    expect(ce).toBeInstanceOf(HTMLElement);
    expect(ce).not.toBe(host);

    ce!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClick).toHaveBeenCalledTimes(1);

    host.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClick).toHaveBeenCalledTimes(1);

    editor.destroy();
    host.remove();
  });
});
