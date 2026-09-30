import type { Operation, DocNode, Transaction } from '@codemerge/kernel';
import { transaction } from '@codemerge/kernel';
import type { EditorAPI } from '@codemerge/sdk';
import { core } from '@codemerge/sdk';
import type { ClientWire, CollabStatus, PresencePeer, ServerWire } from './protocol.ts';
import { PROTOCOL_VERSION, parseServerWire } from './protocol.ts';
import { clearPending, enqueuePending, listPending, removePending } from './offline.ts';

export type CollabClientOptions = {
  serverUrl: string;
  getToken: () => Promise<string> | string;
  docId: string;
  user: { id: string; name?: string; color?: string };
  editor: EditorAPI;
  onStatus?: (s: CollabStatus) => void;
  onPresence?: (peers: PresencePeer[]) => void;
  onBroadcast?: (ops: Operation[]) => void;
  /** Enable IndexedDB offline queue (default true) */
  offlineQueue?: boolean;
};

export type CollabClient = {
  start: () => void;
  stop: () => void;
  getStatus: () => CollabStatus;
  getPeers: () => PresencePeer[];
  getVersion: () => number;
  forceResync: () => void;
  sendPresence: () => void;
};

function wsUrl(base: string): string {
  // Accept bare host (legacy) → append /collab
  if (/^wss?:\/\/[^/]+\/?$/.test(base)) {
    return `${base.replace(/\/$/, '')}/collab`;
  }
  return base;
}

export function createCollabClient(opts: CollabClientOptions): CollabClient {
  let ws: WebSocket | null = null;
  let status: CollabStatus = 'idle';
  let version = 0;
  let peers: PresencePeer[] = [];
  let clientSeq = 0;
  let applyingRemote = false;
  let reconnectAttempt = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let pingTimer: ReturnType<typeof setInterval> | null = null;
  let stopped = true;
  let role = 'write';
  /** Canonical identity from auth_ok (must match ack.authorId). */
  let sessionUserId = opts.user.id;
  const inflightSeqs = new Set<number>();
  let unsubTx: (() => void) | null = null;

  const setStatus = (s: CollabStatus) => {
    status = s;
    opts.onStatus?.(s);
  };

  const send = (msg: ClientWire) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  };

  const applyRemoteOps = (ops: Operation[]) => {
    if (ops.length === 0) {
      return;
    }
    applyingRemote = true;
    try {
      const tr = transaction(...ops);
      opts.editor.dispatch(tr, { source: 'remote' });
      opts.onBroadcast?.(ops);
    } finally {
      applyingRemote = false;
    }
  };

  const applySnapshot = (snapshot: unknown) => {
    if (typeof snapshot !== 'object' || snapshot === null) {
      return;
    }
    applyingRemote = true;
    try {
      opts.editor.setJSON(snapshot as DocNode);
    } finally {
      applyingRemote = false;
    }
  };

  const flushOffline = async () => {
    if (opts.offlineQueue === false) {
      return;
    }
    const pending = await listPending(opts.docId);
    for (const batch of pending) {
      clientSeq = Math.max(clientSeq, batch.clientSeq);
      inflightSeqs.add(batch.clientSeq);
      send({
        type: 'submit',
        docId: opts.docId,
        baseVersion: version,
        ops: batch.ops,
        clientSeq: batch.clientSeq,
      });
    }
  };

  const isOwnAck = (msg: Extract<ServerWire, { type: 'ack' }>): boolean => {
    if (msg.clientSeq !== undefined && inflightSeqs.has(msg.clientSeq)) {
      return true;
    }
    return msg.authorId === sessionUserId;
  };

  const handleServer = async (msg: ServerWire) => {
    switch (msg.type) {
      case 'hello_ok':
        setStatus('authenticating');
        send({
          type: 'auth',
          token: await opts.getToken(),
          userId: opts.user.id,
        });
        break;
      case 'auth_ok':
        role = msg.role;
        sessionUserId = msg.userId || opts.user.id;
        setStatus('syncing');
        send({
          type: 'join',
          docId: opts.docId,
          snapshot: core.docFromJSON(opts.editor.getJSON()),
        });
        break;
      case 'auth_fail':
        setStatus('error');
        opts.editor.notify(opts.editor.t('common.collaborationRequiresATokenMatchingCollabToken'));
        break;
      case 'init':
        version = msg.version;
        if (msg.snapshot) {
          applySnapshot(msg.snapshot);
        }
        peers = msg.peers ?? [];
        opts.onPresence?.(peers);
        setStatus(role === 'read' ? 'readonly' : 'synced');
        reconnectAttempt = 0;
        await flushOffline();
        break;
      case 'ack':
        version = msg.version;
        if (isOwnAck(msg)) {
          if (msg.clientSeq !== undefined) {
            inflightSeqs.delete(msg.clientSeq);
            await removePending(`p_${opts.docId}_${msg.clientSeq}`);
          }
        } else {
          applyRemoteOps((msg.ops as Operation[]) ?? []);
        }
        break;
      case 'reject':
        if (msg.clientSeq !== undefined) {
          inflightSeqs.delete(msg.clientSeq);
        }
        if (msg.resync) {
          version = msg.resync.version;
          applySnapshot(msg.resync.snapshot);
          await clearPending(opts.docId);
          inflightSeqs.clear();
        }
        break;
      case 'presence':
        peers = msg.peers.filter((p) => p.userId !== sessionUserId);
        opts.onPresence?.(peers);
        break;
      case 'error':
        setStatus('error');
        break;
      default:
        break;
    }
  };

  const scheduleReconnect = () => {
    if (stopped) {
      return;
    }
    setStatus('reconnecting');
    const delay = Math.min(30_000, 500 * 2 ** reconnectAttempt);
    reconnectAttempt += 1;
    reconnectTimer = setTimeout(() => {
      connect();
    }, delay);
  };

  const onLocalTransaction = (event: { tr: Transaction; source: 'local' | 'remote' }) => {
    if (event.source !== 'local' || applyingRemote || status === 'readonly') {
      return;
    }
    const ops = event.tr.ops.filter((o) => o.type !== 'set_selection');
    if (ops.length === 0) {
      // presence only
      sendPresence();
      return;
    }
    clientSeq += 1;
    const seq = clientSeq;
    const batch = {
      id: `p_${opts.docId}_${seq}`,
      docId: opts.docId,
      baseVersion: version,
      ops,
      clientSeq: seq,
      at: Date.now(),
    };
    if (status === 'synced' && ws?.readyState === WebSocket.OPEN) {
      inflightSeqs.add(seq);
      send({
        type: 'submit',
        docId: opts.docId,
        baseVersion: version,
        ops,
        clientSeq: seq,
      });
    } else if (opts.offlineQueue !== false) {
      setStatus(status === 'idle' ? 'offline' : status);
      void enqueuePending(batch);
    }
  };

  const sendPresence = () => {
    if (status !== 'synced' && status !== 'readonly') {
      return;
    }
    const sel = opts.editor.getSelection();
    send({
      type: 'presence',
      docId: opts.docId,
      state: {
        name: opts.user.name,
        color: opts.user.color,
        selection: sel,
        cursor: sel.anchor,
      },
    });
  };

  const connect = () => {
    if (stopped) {
      return;
    }
    try {
      ws?.close();
      setStatus(reconnectAttempt > 0 ? 'reconnecting' : 'connecting');
      ws = new WebSocket(wsUrl(opts.serverUrl));
      ws.addEventListener('open', () => {
        send({ type: 'hello', protocolVersion: PROTOCOL_VERSION });
        if (pingTimer) {
          clearInterval(pingTimer);
        }
        pingTimer = setInterval(() => send({ type: 'ping', ts: Date.now() }), 25_000);
      });
      ws.addEventListener('message', (ev) => {
        try {
          const msg = parseServerWire(JSON.parse(String(ev.data)));
          if (msg) {
            void handleServer(msg);
          }
        } catch {
          /* ignore */
        }
      });
      ws.addEventListener('close', () => {
        if (pingTimer) {
          clearInterval(pingTimer);
          pingTimer = null;
        }
        if (!stopped) {
          scheduleReconnect();
        } else {
          setStatus('idle');
        }
      });
      ws.addEventListener('error', () => {
        /* close handler reconnects */
      });
    } catch {
      setStatus('error');
      opts.editor.notify(opts.editor.t('common.failedToConnect'));
    }
  };

  return {
    start() {
      stopped = false;
      unsubTx?.();
      unsubTx = opts.editor.on('transaction', onLocalTransaction);
      connect();
    },
    stop() {
      stopped = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (pingTimer) {
        clearInterval(pingTimer);
        pingTimer = null;
      }
      unsubTx?.();
      unsubTx = null;
      inflightSeqs.clear();
      if (ws && opts.docId) {
        send({ type: 'leave', docId: opts.docId });
      }
      ws?.close();
      ws = null;
      setStatus('idle');
    },
    getStatus: () => status,
    getPeers: () => peers.slice(),
    getVersion: () => version,
    forceResync() {
      if (ws?.readyState === WebSocket.OPEN) {
        send({ type: 'leave', docId: opts.docId });
        send({
          type: 'join',
          docId: opts.docId,
          snapshot: core.docFromJSON(opts.editor.getJSON()),
        });
      } else {
        connect();
      }
    },
    sendPresence,
  };
}

/** @deprecated Prefer createCollabClient — kept for unit tests / custom hosts */
export interface OpsCollabBinding {
  applyRemote(ops: Operation[]): DocNode;
  getDoc(): DocNode;
  onLocal(ops: Operation[]): void;
}

export function createOpsCollabBinding(
  initial: DocNode,
  broadcast: (ops: Operation[]) => void = () => {}
): OpsCollabBinding {
  let doc = initial;
  const selection = {
    anchor: { offset: 0, path: [0] },
    focus: { offset: 0, path: [0] },
  };
  return {
    applyRemote(ops) {
      doc = core.normalize(core.applyOps(doc, ops, selection).doc);
      return doc;
    },
    getDoc: () => doc,
    onLocal(ops) {
      doc = core.normalize(core.applyOps(doc, ops, selection).doc);
      broadcast(ops);
    },
  };
}
