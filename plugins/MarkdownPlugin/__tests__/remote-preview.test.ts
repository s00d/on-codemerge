import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Editor as MdEditor, createDefaultPlugins, emptyEditorDoc } from 'on-codemerge/markdown';

async function flushPaint(): Promise<void> {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
  await Promise.resolve();
  await Promise.resolve();
}

function requestBody(init: RequestInit | undefined): { markdown?: string } {
  const raw = init?.body;
  if (typeof raw !== 'string') {
    return {};
  }
  return JSON.parse(raw) as { markdown?: string };
}

describe('MarkdownPlugin remote preview', () => {
  const hosts: HTMLElement[] = [];
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn((_url: string, init?: RequestInit) => {
      const body = requestBody(init);
      return Promise.resolve(
        new Response(`<p data-remote="1">${body.markdown ?? ''}</p>`, {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        })
      );
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    for (const host of hosts) {
      const ed = Reflect.get(host, '__editor');
      if (ed && typeof ed.destroy === 'function') {
        ed.destroy();
      }
      host.remove();
    }
    hosts.length = 0;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function mountRemote(text = '# hello\n', debounceMs = 40) {
    const host = document.createElement('div');
    document.body.append(host);
    hosts.push(host);
    const editor = new MdEditor(host, {
      chrome: 'bar',
      doc: emptyEditorDoc(text),
      plugins: createDefaultPlugins({
        preview: {
          url: 'https://example.test/render',
          headers: { 'X-Token': 't' },
          debounceMs,
        },
      }),
    });
    Reflect.set(host, '__editor', editor);
    return { host, editor };
  }

  it('POSTs markdown and paints returned HTML on mount', async () => {
    const { editor } = mountRemote('# hi\n');
    await flushPaint();
    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'https://example.test/render',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Accept: 'text/html',
            'X-Token': 't',
          }),
        })
      );
    });

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
    expect(requestBody(init).markdown).toMatch(/hi/);

    await vi.waitFor(() => {
      const preview = editor.contentElement()?.querySelector('.ocm-md-pane--preview');
      expect(preview?.querySelector('[data-remote="1"]')).toBeTruthy();
      expect(preview?.textContent ?? '').toMatch(/hi/);
    });
  });

  it('skips fetch when markdown is unchanged after a successful paint', async () => {
    const { editor } = mountRemote('# same\n');
    await flushPaint();
    await vi.waitFor(() => {
      expect(fetchMock.mock.calls.length).toBe(1);
    });

    expect(editor.setText('# same\n')).toBeNull();
    await flushPaint();
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 30);
    });
    expect(fetchMock.mock.calls.length).toBe(1);
  });

  it('aborts in-flight fetch when a newer paint supersedes it', async () => {
    let resolveFirst: ((r: Response) => void) | null = null;
    fetchMock.mockImplementationOnce(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((resolve, reject) => {
          const signal = init?.signal;
          signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
          resolveFirst = resolve;
        })
    );
    fetchMock.mockImplementationOnce((_url: string, init?: RequestInit) => {
      const body = requestBody(init);
      return Promise.resolve(
        new Response(`<p data-remote="2">${body.markdown}</p>`, { status: 200 })
      );
    });

    const { editor } = mountRemote('# one\n');
    await flushPaint();
    await vi.waitFor(() => {
      expect(fetchMock.mock.calls.length).toBe(1);
    });

    expect(editor.setText('# two\n')).toBeNull();
    await flushPaint();
    await vi.waitFor(() => {
      expect(fetchMock.mock.calls.length).toBe(2);
    });

    // Finish the stale first response — must not overwrite pane.
    resolveFirst?.(new Response('<p data-stale="1">one</p>', { status: 200 }));
    await flushPaint();

    await vi.waitFor(() => {
      const preview = editor.contentElement()?.querySelector('.ocm-md-pane--preview');
      expect(preview?.querySelector('[data-remote="2"]')).toBeTruthy();
      expect(preview?.querySelector('[data-stale="1"]')).toBeNull();
    });
  });

  it('coalesces typing into one remote POST via debounce', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const { editor } = mountRemote('# start\n', 80);
      await flushPaint();
      await vi.waitFor(() => {
        expect(fetchMock.mock.calls.length).toBe(1);
      });

      const ta = editor
        .contentElement()
        ?.querySelector('textarea[aria-label="Source editor"]') as HTMLTextAreaElement | null;
      expect(ta).toBeTruthy();

      // Simulate rapid CM edits (SoT debounce 150 + remote 80).
      for (const chunk of ['a', 'ab', 'abc']) {
        ta!.value = `# ${chunk}\n`;
        ta!.dispatchEvent(new Event('input', { bubbles: true }));
        await vi.advanceTimersByTimeAsync(40);
      }
      await vi.advanceTimersByTimeAsync(300);
      await flushPaint();

      // Mount + one coalesced typing fetch (not one per keystroke).
      expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(3);
      expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2);
      const lastInit = fetchMock.mock.calls.at(-1)?.[1] as RequestInit | undefined;
      expect(requestBody(lastInit).markdown).toMatch(/abc/);
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows error stub when first fetch fails and pane is empty', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(new Response('nope', { status: 500 })));
    const { editor } = mountRemote('# fail\n');
    await flushPaint();
    await vi.waitFor(() => {
      const preview = editor.contentElement()?.querySelector('.ocm-md-pane--preview');
      expect(preview?.textContent ?? '').toMatch(/Preview HTTP 500/);
    });
  });

  it('shows toolbar busy chrome while remote preview fetch is in flight', async () => {
    let release!: (value: Response) => void;
    const gate = new Promise<Response>((resolve) => {
      release = resolve;
    });
    fetchMock.mockImplementation(() => gate);

    const { host } = mountRemote('# busy\n', 20);
    await flushPaint();

    await vi.waitFor(() => {
      expect(host.querySelector('[data-ocm-md-preview-busy]')).toBeTruthy();
      expect(host.querySelector('[data-ocm-toolbar-spacer]')).toBeTruthy();
    });

    release(
      new Response('<p data-remote="1">busy</p>', {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      })
    );

    await vi.waitFor(() => {
      expect(host.querySelector('[data-ocm-md-preview-busy]')).toBeNull();
    });
  });
});
