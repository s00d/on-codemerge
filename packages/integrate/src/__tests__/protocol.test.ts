import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { editorSpies, mockOnCodemergeModule } from './helpers/editorSpies';

vi.mock('on-codemerge', () => mockOnCodemergeModule());

function load(source: Window | null, origin: string): void {
  window.dispatchEvent(
    new MessageEvent('message', {
      data: { type: 'ocm-load', value: '<p>x</p>' },
      origin,
      source: source as MessageEventSource | null,
    })
  );
}

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

  it('isOcmHostMessage rejects bad payloads', async () => {
    const { isOcmHostMessage } = await import('../protocol');
    expect(isOcmHostMessage({ type: 'ocm-load', value: 1 })).toBe(false);
    expect(isOcmHostMessage({ type: 'ocm-load', value: 'x', format: 'pdf' })).toBe(false);
    expect(isOcmHostMessage({ type: 'ocm-load', value: 'x', format: 'markdown' })).toBe(true);
  });

  it('bindHostBridge drops foreign origins and honors ocm-load format', async () => {
    const { bindHostBridge } = await import('../protocol');
    const target = { postMessage: vi.fn() } as unknown as Window;
    const { dispose } = bindHostBridge(document.createElement('div'), {
      messageTarget: target,
      targetOrigin: 'https://host.example',
    });
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'ocm-load', value: '<p>evil</p>' },
        origin: 'https://evil.example',
      })
    );
    expect(editorSpies.setHTML).not.toHaveBeenCalled();
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'ocm-load', value: '# md', format: 'markdown' },
        origin: 'https://host.example',
      })
    );
    expect(editorSpies.setMarkdown).toHaveBeenCalledWith('# md');
    expect(editorSpies.setHTML).not.toHaveBeenCalled();
    dispose();
  });

  it('bindHostBridge in an iframe targets the parent origin and checks event.source', async () => {
    const { bindHostBridge } = await import('../protocol');
    const parent = { postMessage: vi.fn() } as unknown as Window;
    const parentSpy = vi.spyOn(window, 'parent', 'get').mockReturnValue(parent);
    const refSpy = vi.spyOn(document, 'referrer', 'get').mockReturnValue('https://p.example/x');
    const { dispose } = bindHostBridge(document.createElement('div'));
    expect(parent.postMessage).toHaveBeenCalledWith({ type: 'ocm-ready' }, 'https://p.example');
    load(window, 'https://p.example');
    load(parent, 'https://evil.example');
    expect(editorSpies.setHTML).not.toHaveBeenCalled();
    load(parent, 'https://p.example');
    expect(editorSpies.setHTML).toHaveBeenCalledWith('<p>x</p>');
    dispose();
    parentSpy.mockRestore();
    refSpy.mockRestore();
  });

  it('bindPersistence loads { value, format } in that format', async () => {
    const { bindPersistence } = await import('../protocol');
    const handle = bindPersistence(document.createElement('div'), {
      load: () => ({ value: '# t', format: 'markdown' }),
      save: () => undefined,
    });
    await vi.waitFor(() => expect(editorSpies.setMarkdown).toHaveBeenCalledWith('# t'));
    expect(editorSpies.setHTML).not.toHaveBeenCalled();
    handle.dispose();
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

  it('bindPersistence follows <ocm-editor> remount', async () => {
    const { OcmEditorElement } = await import('../element');
    const { bindPersistence } = await import('../protocol');
    const el = new OcmEditorElement();
    document.body.append(el);
    const save = vi.fn();
    const io = bindPersistence(el, { load: () => '<p>a</p>', save, debounceMs: 10 });
    const before = io.host;
    el.configure({ locale: 'ru' });
    expect(el.host).not.toBe(before);
    expect(io.host).toBe(el.host);
    io.dispose();
  });
});
