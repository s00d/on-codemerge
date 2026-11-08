import { createRequire } from 'node:module';
import { resolve as resolvePath } from 'node:path';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { Editor } from '@codemerge/editor';
import type { ViewPort } from '@codemerge/editor';
import { createDoc, createParagraph, createText, transaction } from '@codemerge/kernel';
import type { DocNode, Operation } from '@codemerge/kernel';
import {
  createCollaborationServer,
  memoryStore,
  staticTokenAuth,
  type CollaborationServer,
} from '../../../packages/collaboration-server/src/index';
import { createCollabClient, type CollabClient } from '../client.ts';

// `ws` (the server's dep): Node's native WebSocket rejects jsdom's Event class.
const NativeWebSocket = createRequire(
  resolvePath(import.meta.dirname, '../../../packages/collaboration-server/package.json')
)('ws') as typeof WebSocket;

/** Test socket: records instances and can swallow incoming frames (lost ack). */
const sockets: TestSocket[] = [];
class TestSocket extends NativeWebSocket {
  dropIncoming = false;
  constructor(url: string | URL, protocols?: string | string[]) {
    super(url, protocols);
    sockets.push(this);
  }
  override addEventListener(type: string, listener: unknown, options?: unknown): void {
    if (type === 'message' && typeof listener === 'function') {
      const fn = listener as (ev: MessageEvent) => void;
      super.addEventListener(
        type,
        (ev: MessageEvent) => {
          if (!this.dropIncoming) {
            fn(ev);
          }
        },
        options as AddEventListenerOptions
      );
      return;
    }
    super.addEventListener(type, listener as EventListener, options as AddEventListenerOptions);
  }
}

function noopView(): ViewPort {
  return { update() {}, destroy() {}, contentTarget: () => new EventTarget() };
}

function text(doc: DocNode): string {
  return (doc.content ?? [])
    .map((b) => (b.content ?? []).map((t) => t.text ?? '').join(''))
    .join('|');
}

async function waitFor(cond: () => boolean, ms = 4000): Promise<void> {
  const t0 = Date.now();
  while (!cond()) {
    if (Date.now() - t0 > ms) {
      throw new Error('waitFor timeout');
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });
  }
}

type Peer = { editor: Editor; client: CollabClient; host: HTMLElement };

function makePeer(url: string, userId: string, doc: DocNode): Peer {
  sessionStorage.clear();
  const host = document.createElement('div');
  document.body.append(host);
  const editor = new Editor(host, { createView: () => noopView() });
  editor.setJSON(doc);
  const client = createCollabClient({
    serverUrl: url,
    getToken: () => 'dev',
    docId: 'conv',
    user: { id: userId },
    editor,
    offlineQueue: false,
  });
  client.start();
  return { editor, client, host };
}

const insert = (offset: number, t: string, path = [0]): Operation => ({
  type: 'insert_text',
  path,
  offset,
  text: t,
});

describe('CollabClient OT convergence (real server)', () => {
  let server: CollaborationServer | null = null;
  let store = memoryStore();
  let peers: Peer[] = [];
  let url = '';

  beforeAll(() => {
    globalThis.WebSocket = TestSocket as unknown as typeof WebSocket;
  });

  afterEach(async () => {
    for (const p of peers) {
      p.client.stop();
      p.editor.destroy();
      p.host.remove();
    }
    peers = [];
    sockets.length = 0;
    await server?.close();
    server = null;
  });

  async function boot(): Promise<[Peer, Peer]> {
    store = memoryStore();
    server = await createCollaborationServer({
      store,
      auth: staticTokenAuth({ token: 'dev' }),
    });
    const http = await server.listen(0, '127.0.0.1');
    const addr = http.address();
    if (!addr || typeof addr === 'string') {
      throw new Error('no port');
    }
    url = `ws://127.0.0.1:${addr.port}/collab`;
    const a = makePeer(url, 'alice', createDoc([createParagraph([createText('ab')])]));
    await waitFor(() => a.client.getStatus() === 'synced');
    const b = makePeer(url, 'bob', createDoc([createParagraph([createText('')])]));
    await waitFor(() => b.client.getStatus() === 'synced');
    peers = [a, b];
    return [a, b];
  }

  const settled = async (a: Peer, b: Peer) => {
    await waitFor(
      () =>
        a.client.getPendingCount() === 0 &&
        b.client.getPendingCount() === 0 &&
        a.client.getVersion() === b.client.getVersion()
    );
    const room = await store.loadRoom('conv');
    expect(a.client.getVersion()).toBe(room?.version);
    expect(text(a.editor.getState().doc)).toBe(text(b.editor.getState().doc));
    expect(text(a.editor.getState().doc)).toBe(text(room!.snapshot));
    return text(a.editor.getState().doc);
  };

  it('concurrent typing at the same spot + buffered batches converge', async () => {
    const [a, b] = await boot();
    expect(text(b.editor.getState().doc)).toBe('ab');
    // Same tick on both sides: both batches in flight, then each types more (buffered).
    a.editor.dispatch(transaction(insert(1, 'X')));
    b.editor.dispatch(transaction(insert(1, 'Y')));
    a.editor.dispatch(transaction(insert(2, '1')));
    b.editor.dispatch(transaction(insert(0, '<')));
    b.editor.dispatch(transaction(insert(3, '2')));
    const final = await settled(a, b);
    expect(final).toHaveLength(7);
    expect(final.split('').sort().join('')).toBe(
      ['<', '1', '2', 'X', 'Y', 'a', 'b'].sort().join('')
    );
  });

  it('undo/redo reach the peer', async () => {
    const [a, b] = await boot();
    a.editor.dispatch(transaction(insert(2, '!')));
    await settled(a, b);
    a.editor.undo();
    expect(await settled(a, b)).toBe('ab');
    a.editor.redo();
    expect(await settled(a, b)).toBe('ab!');
  });

  it('does not submit addToHistory:false (local decoration) transactions', async () => {
    const [a, b] = await boot();
    const v = a.client.getVersion();
    const tr = transaction(insert(0, 'local'));
    tr.meta = { addToHistory: false };
    a.editor.dispatch(tr);
    expect(a.client.getPendingCount()).toBe(0);
    a.editor.dispatch(transaction(insert(0, 'Z')));
    await waitFor(() => b.client.getVersion() === v + 1);
    expect(text(b.editor.getState().doc)).toBe('Zab');
  });

  it('offline edits are rebased on reconnect, a lost ack is not resubmitted twice', async () => {
    const [a, b] = await boot();
    // Lost ack: the server applies B's batch but B never sees the ack, then the socket dies.
    const bSock = sockets.at(-1)!;
    bSock.dropIncoming = true;
    b.editor.dispatch(transaction(insert(0, 'L')));
    await waitFor(() => a.client.getVersion() === 1);
    bSock.close();
    // While B is offline both sides keep editing.
    await waitFor(() => b.client.getStatus() === 'reconnecting');
    b.editor.dispatch(transaction(insert(3, 'off')));
    a.editor.dispatch(transaction(insert(1, 'on')));
    await waitFor(() => a.client.getPendingCount() === 0);
    await waitFor(() => b.client.getStatus() === 'synced');
    const final = await settled(a, b);
    expect(final.match(/L/g)).toHaveLength(1);
    expect(final).toContain('off');
    expect(final).toContain('on');
  });
});
