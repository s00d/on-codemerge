import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { createApp, nextTick } from 'vue';
import type { App } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { editorSpies, mockOnCodemergeModule } from './helpers/editorSpies';

vi.mock('on-codemerge', () => mockOnCodemergeModule());

describe('adapters', () => {
  beforeEach(() => {
    editorSpies.reset();
  });

  describe('react', () => {
    let container: HTMLDivElement;
    let root: Root;
    beforeEach(() => {
      container = document.createElement('div');
      document.body.append(container);
      root = createRoot(container);
    });
    afterEach(() => {
      act(() => {
        root.unmount();
      });
      container.remove();
    });

    it('mounts and syncs', async () => {
      const { CodeMergeEditor } = await import('../react');
      const onChange = vi.fn();
      act(() => {
        root.render(createElement(CodeMergeEditor, { value: '<p>a</p>', onChange }));
      });
      expect(editorSpies.setHTML).toHaveBeenCalledWith('<p>a</p>');
      editorSpies.getHTML.mockReturnValue('<p>b</p>');
      editorSpies.docChangedCb?.();
      expect(onChange).toHaveBeenCalledWith('<p>b</p>', 'html');
    });
  });

  describe('vue', () => {
    let host: HTMLDivElement;
    let app: App | null = null;
    beforeEach(() => {
      host = document.createElement('div');
      document.body.append(host);
    });
    afterEach(() => {
      app?.unmount();
      host.remove();
    });

    it('mounts and emits', async () => {
      const { CodeMergeEditor } = await import('../vue');
      const onChange = vi.fn();
      app = createApp(CodeMergeEditor, { value: '<p>a</p>', onChange });
      app.mount(host);
      await nextTick();
      expect(editorSpies.setHTML).toHaveBeenCalledWith('<p>a</p>');
      editorSpies.docChangedCb?.();
      expect(onChange).toHaveBeenCalledWith('<p>hi</p>', 'html');
    });
  });

  it('jquery + alpine register', async () => {
    const { registerJQueryPlugin } = await import('../jquery');
    const { registerAlpine, mountCodeMergeEditor } = await import('../alpine');
    const $ = { fn: {} as Record<string, unknown> };
    registerJQueryPlugin($);
    expect(typeof $.fn.ocmEditor).toBe('function');

    let factory: ((o?: object) => Record<string, unknown>) | null = null;
    registerAlpine({
      data(_n, fn) {
        factory = fn;
      },
    });
    const ctx = factory!({ value: '<p>a</p>' }) as {
      init: () => void;
      destroy: () => void;
      $el: HTMLElement;
      value: string;
    };
    ctx.$el = document.createElement('div');
    ctx.init();
    expect(editorSpies.setHTML).toHaveBeenCalledWith('<p>a</p>');
    ctx.destroy();
    expect(editorSpies.destroy).toHaveBeenCalledWith();

    mountCodeMergeEditor(document.createElement('div'), { value: '<p>x</p>' }).destroy();
  });

  it('vue2 lifecycle', async () => {
    const { CodeMergeEditor } = await import('../vue2');
    const emit = vi.fn();
    const ctx = {
      $refs: { host: document.createElement('div') },
      $emit: emit,
      value: '<p>a</p>',
      format: 'html' as const,
      chrome: 'bar' as const,
      hostOptions: undefined,
      _ocmHandle: null as null | { destroy: () => void },
    };
    CodeMergeEditor.mounted!.call(ctx);
    expect(emit).toHaveBeenCalledWith('ready', expect.anything());
    CodeMergeEditor.beforeDestroy!.call(ctx);
    expect(editorSpies.destroy).toHaveBeenCalledWith();
  });

  it('next / nuxt / sveltekit helpers', async () => {
    const next = await import('../next');
    const result = next.createCodeMergeEditor(() =>
      Promise.resolve({ CodeMergeEditor: { name: 'E' } })
    ) as {
      ssr: false;
      loader: () => Promise<unknown>;
    };
    expect(result.ssr).toBe(false);
    await expect(result.loader()).resolves.toStrictEqual({ name: 'E' });

    const nuxt = await import('../nuxt');
    expect(nuxt.clientOnlyHint()).toContain('ClientOnly');

    const sk = await import('../sveltekit');
    expect(sk.browser).toBe(true);
    sk.mountCodeMergeEditor(document.createElement('div'))?.destroy();
  });
});
