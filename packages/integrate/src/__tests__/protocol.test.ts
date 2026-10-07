import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { editorSpies, mockOnCodemergeModule } from './helpers/editorSpies';

vi.mock('on-codemerge', () => mockOnCodemergeModule());

describe('protocol', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    editorSpies.reset();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it('isOcmHostMessage', async () => {
    const { isOcmHostMessage, OCM_MESSAGE_TYPES } = await import('../protocol');
    expect(isOcmHostMessage({ type: 'ocm-ready' })).toBe(true);
    expect(isOcmHostMessage({ type: 'nope' })).toBe(false);
    expect(OCM_MESSAGE_TYPES).toContain('ocm-load');
  });

  it('bindHostBridge posts and handles load', async () => {
    const { bindHostBridge } = await import('../protocol');
    const target = { postMessage: vi.fn() } as unknown as Window;
    const { dispose } = bindHostBridge(document.createElement('div'), {
      messageTarget: target,
      targetOrigin: 'https://host.example',
    });
    expect(target.postMessage).toHaveBeenCalledWith({ type: 'ocm-ready' }, 'https://host.example');
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'ocm-load', value: '<p>in</p>' },
        origin: 'https://host.example',
      })
    );
    expect(editorSpies.setHTML).toHaveBeenCalledWith('<p>in</p>');
    dispose();
  });

  it('bindPersistence debounces save', async () => {
    const { bindPersistence } = await import('../protocol');
    const save = vi.fn(() => Promise.resolve(undefined));
    const handle = bindPersistence(document.createElement('div'), {
      load: () => Promise.resolve('<p>a</p>'),
      save,
      debounceMs: 50,
    });
    await vi.waitFor(() => expect(editorSpies.setHTML).toHaveBeenCalledWith('<p>a</p>'));
    editorSpies.getHTML.mockReturnValue('<p>b</p>');
    editorSpies.docChangedCb?.();
    await vi.advanceTimersByTimeAsync(50);
    expect(save).toHaveBeenCalledWith('<p>b</p>', 'html');
    handle.dispose();
  });

  it('restPersistence split urls + errors', async () => {
    const { restPersistence } = await import('../protocol');
    const fetchMock = vi.fn(() =>
      Promise.resolve(new Response('x', { status: 500, statusText: 'E' }))
    );
    const io = restPersistence({
      url: { load: '/l', save: '/s' },
      fetch: fetchMock as unknown as typeof fetch,
      parse: () => '',
      serialize: (v) => ({ v }),
    });
    await expect(io.load()).rejects.toThrow(/load failed/);
  });

  it('bindPersistence on ready ocm-editor', async () => {
    await import('../element');
    const { bindPersistence } = await import('../protocol');
    const el = document.createElement('ocm-editor');
    document.body.append(el);
    const onError = vi.fn();
    const io = bindPersistence(el, {
      load: () => Promise.reject(new Error('fail')),
      save: () => undefined,
      onError,
    });
    await vi.waitFor(() => expect(onError).toHaveBeenCalledWith(expect.any(Error), 'load'));
    io.dispose();
  });
});
