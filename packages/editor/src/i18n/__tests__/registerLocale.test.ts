/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import { Editor } from '../../Editor';
import { createShellView } from '../../createShellView';
import { wirePluginLocales } from '../wirePluginLocales';

describe('registerLocale overlay', () => {
  it('merges plugin overlay without blocking base locale load', async () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const editor = new Editor(host, {
      createView: createShellView,
      plugins: [
        {
          name: 'overlay-probe',
          setup: (ctx) => {
            ctx.editor.registerLocale('en', {
              overlayProbe: { hello: 'Hello' },
            });
          },
        },
      ],
    });

    expect(editor.t('overlayProbe.hello')).toBe('Hello');
    // Overlay before setLocale must not skip loading core `ru.json`.
    editor.registerLocale('ru', { overlayProbe: { hello: 'Привет' } });
    await editor.setLocale('ru');
    expect(editor.getLocale()).toBe('ru');
    expect(editor.t('overlayProbe.hello')).toBe('Привет');
    // Core common key still present after base load.
    expect(editor.t('common.cancel')).not.toBe('common.cancel');
    editor.destroy();
    host.remove();
  });

  it('awaits registerLocaleOverlay before finishing setLocale', async () => {
    expect.hasAssertions();
    const host = document.createElement('div');
    document.body.append(host);
    const modules = {
      './locales/ru.json': () =>
        Promise.resolve({
          default: { overlayProbe: { hello: 'Привет' } },
        }),
    };
    const editor = new Editor(host, {
      createView: createShellView,
      plugins: [
        {
          name: 'overlay-glob',
          setup: (ctx) => {
            ctx.disposable(
              wirePluginLocales(ctx.editor, { overlayProbe: { hello: 'Hello' } }, modules)
            );
          },
        },
      ],
    });
    expect(editor.t('overlayProbe.hello')).toBe('Hello');
    await editor.setLocale('ru');
    expect(editor.t('overlayProbe.hello')).toBe('Привет');
    expect(editor.t('common.cancel')).not.toBe('common.cancel');
    editor.destroy();
    host.remove();
  });
});
