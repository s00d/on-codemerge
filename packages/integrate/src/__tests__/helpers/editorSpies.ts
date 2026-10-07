import { vi } from 'vitest';

export const editorSpies = {
  destroy: vi.fn(),
  setHTML: vi.fn(),
  setMarkdown: vi.fn(),
  getHTML: vi.fn(() => '<p>hi</p>'),
  getMarkdown: vi.fn(() => 'hi'),
  constructOpts: null as unknown,
  docChangedCb: null as (() => void) | null,
  reset() {
    this.destroy.mockClear();
    this.setHTML.mockClear();
    this.setMarkdown.mockClear();
    this.getHTML.mockClear();
    this.getMarkdown.mockClear();
    this.getHTML.mockReturnValue('<p>hi</p>');
    this.getMarkdown.mockReturnValue('hi');
    this.constructOpts = null;
    this.docChangedCb = null;
  },
};

export function mockOnCodemergeModule() {
  const spies = editorSpies;
  return {
    createCorePlugins: (opts?: unknown) => [{ name: 'core', opts }],
    createDefaultPlugins: (opts?: unknown) => [{ name: 'default', opts }],
    Editor: class MockEditor {
      getHTML = spies.getHTML;
      setHTML = spies.setHTML;
      getMarkdown = spies.getMarkdown;
      setMarkdown = spies.setMarkdown;
      destroy = spies.destroy;
      constructor(_el: HTMLElement, opts: unknown) {
        spies.constructOpts = opts;
      }
      on(event: string, cb: () => void) {
        if (event === 'docChanged') {
          spies.docChangedCb = cb;
        }
        return () => {
          spies.docChangedCb = null;
        };
      }
    },
  };
}
