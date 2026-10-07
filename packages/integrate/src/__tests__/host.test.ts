import { beforeEach, describe, expect, it, vi } from 'vitest';
import { editorSpies, mockOnCodemergeModule } from './helpers/editorSpies';

vi.mock('on-codemerge', () => mockOnCodemergeModule());

describe('host', () => {
  beforeEach(() => {
    editorSpies.reset();
  });

  it('createEditorHost syncs html and onChange', async () => {
    const { createEditorHost } = await import('../host');
    const onChange = vi.fn();
    const onReady = vi.fn();
    const host = createEditorHost(document.createElement('div'), {
      value: '<p>x</p>',
      onChange,
      onReady,
      chrome: 'page',
    });
    expect(onReady).toHaveBeenCalledWith(host);
    expect(editorSpies.setHTML).toHaveBeenCalledWith('<p>x</p>');
    editorSpies.docChangedCb?.();
    expect(onChange).toHaveBeenCalledWith('<p>hi</p>', 'html');
    host.destroy();
    host.destroy();
    expect(editorSpies.destroy).toHaveBeenCalledTimes(1);
  });

  it('uses markdown IO for text format', async () => {
    const { createEditorHost } = await import('../host');
    createEditorHost(document.createElement('div'), { value: 'plain', format: 'text' });
    expect(editorSpies.setMarkdown).toHaveBeenCalledWith('plain');
  });

  it('createHostPlugins honors pack / explicit / emulation', async () => {
    const { createHostPlugins } = await import('../host');
    expect(
      createHostPlugins({ pack: 'none', pluginsAppend: [{ name: 'X' }] }).map((p) => p.name)
    ).toStrictEqual(['X']);
    const plugins = createHostPlugins({
      pack: 'default',
      image: { endpoints: { upload: '/m' }, useEmulation: true },
    });
    expect(plugins[0]?.name).toBe('default');
    expect(plugins[0]).toStrictEqual(
      expect.objectContaining({
        opts: expect.objectContaining({
          image: expect.objectContaining({ useEmulation: true }),
        }),
      })
    );
  });

  it('mountCodeMergeEditor delegates', async () => {
    const { mountCodeMergeEditor } = await import('../host');
    const host = mountCodeMergeEditor(document.createElement('div'), { value: '<p>m</p>' });
    expect(editorSpies.setHTML).toHaveBeenCalledWith('<p>m</p>');
    host.destroy();
  });
});
