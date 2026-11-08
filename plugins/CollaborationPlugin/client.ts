import { core } from '@codemerge/sdk';
import type { EditorAPI } from '@codemerge/sdk';
import type { Operation, DocNode, Transaction } from '@codemerge/kernel';
import { transaction, transformPair } from '@codemerge/kernel';

import type { ClientWire, CollabStatus, PresencePeer, ServerWire } from './protocol.ts';
import { PROTOCOL_VERSION, parseServerWire } from './protocol.ts';
import { clearPending, loadPending, pendingId, savePending } from './offline.ts';
import type { PendingState } from './offline.ts';

export type CollabClientOptions = {
  serverUrl: string;
  getToken: () => Promise<string> | string;
  docId: string;
  user: { id: string; name?: string; color?: string };
  editor: EditorAPI;
  onStatus?: (s: CollabStatus) => void;
  onPresence?: (peers: PresencePeer[]) => void;
  onBroadcast?: (ops: Operation[]) => void;
  /** Persist unconfirmed edits in IndexedDB so a reload while offline keeps them (default true) */
  offlineQueue?: boolean;
};

export type CollabClient = {
  start: () => void;
  stop: () => void;
  getStatus: () => CollabStatus;
  getPeers: () => PresencePeer[];
  getVersion: () => number;
  /** Local ops not yet confirmed by the server (in flight + buffered). 0 = in sync. */
  getPendingCount: () => number;
  forceResync: () => void;
  sendPresence: () => void;
};

/** Server default `maxOpsPerSubmit`: larger local batches are split instead of rejected. */
const MAX_BATCH_OPS = 500;

function wsUrl(base: string): string {
  // Accept bare host (legacy) → append /collab
  if (/^wss?:\/\/[^/]+\/?$/.test(base)) {
    return `${base.replace(/\/$/, '')}/collab`;
  }
  return base;
}

/** Per tab + doc (sessionStorage survives reload, not shared across tabs): keys server dedupe. */
function resolveClientId(docId: string): string {
  const key = `ocm.collab.clientId.${docId}`;
  try {
    const stored = globalThis.sessionStorage?.getItem(key);
    if (stored) {
      return stored;
    }
  } catch {
    /* private mode */
  }
  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `c${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  try {
    globalThis.sessionStorage?.setItem(key, id);
  } catch {
    /* ignore */
  }
  return id;
}

/** Run `job` after `prev` settles (strict ordering for messages / IndexedDB writes). */
async function after(prev: Promise<void>, job: () => Promise<void>): Promise<void> {
  await prev;
  await job();
}

function asOps(raw: unknown): Operation[] {
  return Array.isArray(raw)
    ? raw.filter(
        (o): o is Operation =>
          typeof o === 'object' && o !== null && typeof Reflect.get(o, 'type') === 'string'
      )
    : [];
}

/**
 * OT client (one batch in flight). Invariant: local doc == server doc @ `version`
 * + `outstanding` (sent, unacked) + `buffer` (not sent). Remote ops are transformed against
 * outstanding/buffer before they are applied, and outstanding/buffer against the remote ops —
 * the same `transformPair` the server's `rebaseOps` uses, so both sides converge.
 */
export function createCollabClient(opts: CollabClientOptions): CollabClient {
  let ws: WebSocket | null = null;
  let status: CollabStatus = 'idle';
  let version = 0;
  let peers: PresencePeer[] = [];
  // ponytail: wall-clock seed keeps seqs monotonic across reloads (server dedupe per clientId);
  // persist a counter if client clocks can jump backwards.
  let clientSeq = Date.now();
  const clientId = resolveClientId(opts.docId);
  const storeId = pendingId(opts.docId, clientId);
  let applyingRemote = false;
  let reconnectAttempt = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let pingTimer: ReturnType<typeof setInterval> | null = null;
  let stopped = true;
  let role = 'write';
  /** Canonical identity from auth_ok (must match ack.authorId). */
  let sessionUserId = opts.user.id;
  let unsubTx: (() => void) | null = null;

  let outstanding: { seq: number; ops: Operation[] } | null = null;
  let buffer: Operation[] = [];
  /** `version` names a server state the local doc derives from (false before first init / after resync). */
  let hasBase = false;
  /** Between (re)join and `init`: acks/rejects from the previous membership are stale. */
  let awaitingInit = true;
  /** Unconfirmed edits from IndexedDB (reload while offline), rebased onto the server at `init`. */
  let restored: PendingState | null = null;
  let restoreTried = false;
  /** Server doc while read-only (`read` / `comment` role): local doc edits are reverted to it. */
  let readonlyDoc: unknown = null;
  let msgChain: Promise<void> = Promise.resolve();
  let persistChain: Promise<void> = Promise.resolve();

  const isReadonlyRole = () => role === 'read' || role === 'comment';

  const setStatus = (s: CollabStatus) => {
    status = s;
    opts.onStatus?.(s);
  };

  const send = (msg: ClientWire) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  };

  const persist = () => {
    if (opts.offlineQueue === false || !hasBase) {
      return;
    }
    const state: PendingState | null =
      outstanding || buffer.length > 0
        ? {
            id: storeId,
            docId: opts.docId,
            clientId,
            baseVersion: version,
            outstanding: outstanding ? { seq: outstanding.seq, ops: outstanding.ops } : null,
            buffer: buffer.slice(),
            clientSeq,
            at: Date.now(),
          }
        : null;
    persistChain = after(persistChain, () => (state ? savePending(state) : clearPending(storeId)));
  };

  const applyRemoteOps = (ops: Operation[]) => {
    if (ops.length === 0) {
      return;
    }
    applyingRemote = true;
    try {
      opts.editor.dispatch(transaction(...ops), { source: 'remote' });
      opts.onBroadcast?.(ops);
    } finally {
      applyingRemote = false;
    }
    if (status === 'readonly') {
      readonlyDoc = opts.editor.getJSON();
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

  const sendOutstanding = () => {
    if (!outstanding) {
      return;
    }
    send({
      type: 'submit',
      docId: opts.docId,
      baseVersion: version,
      ops: outstanding.ops,
      clientSeq: outstanding.seq,
      clientId,
    });
  };

  /** Send the next buffered batch when nothing is in flight. */
  const flush = () => {
    if (
      outstanding ||
      buffer.length === 0 ||
      awaitingInit ||
      status !== 'synced' ||
      ws?.readyState !== WebSocket.OPEN
    ) {
      return;
    }
    clientSeq += 1;
    outstanding = { seq: clientSeq, ops: buffer.slice(0, MAX_BATCH_OPS) };
    buffer = buffer.slice(MAX_BATCH_OPS);
    sendOutstanding();
    persist();
  };

  /** Server ops landed after `version`: transform local state past them, then apply. */
  const receiveRemote = (ops: Operation[], apply: boolean) => {
    let remote = ops;
    if (outstanding) {
      const [o, r] = transformPair(outstanding.ops, remote);
      outstanding = { seq: outstanding.seq, ops: o };
      remote = r;
    }
    const [b, r] = transformPair(buffer, remote);
    buffer = b;
    version += ops.length;
    if (apply) {
      applyRemoteOps(r);
    }
  };

  /** Catch up on `init.ops` (server log since our version); `acked` = our batch the log contains. */
  const catchUp = (
    ops: Operation[],
    acked: { seq: number; from: number; to: number } | undefined,
    apply: boolean
  ) => {
    const start = version;
    if (
      outstanding &&
      acked?.seq === outstanding.seq &&
      acked.from >= start &&
      acked.from <= acked.to &&
      acked.to <= start + ops.length
    ) {
      // Our in-flight batch was applied but the ack was lost with the socket.
      receiveRemote(ops.slice(0, acked.from - start), apply);
      outstanding = null;
      version = acked.to;
      receiveRemote(ops.slice(acked.to - start), apply);
    } else {
      receiveRemote(ops, apply);
    }
  };

  const sendJoin = () => {
    const sinceVersion = hasBase ? version : restored?.baseVersion;
    send({
      type: 'join',
      docId: opts.docId,
      snapshot: core.docFromJSON(opts.editor.getJSON()),
      clientId,
      ...(sinceVersion !== undefined ? { sinceVersion } : {}),
    });
  };

  /** Drop local unconfirmed state and reload the authoritative snapshot. */
  const resync = () => {
    outstanding = null;
    buffer = [];
    hasBase = false;
    restored = null;
    restoreTried = true;
    awaitingInit = true;
    if (opts.offlineQueue !== false) {
      persistChain = after(persistChain, () => clearPending(storeId));
    }
    if (ws?.readyState === WebSocket.OPEN) {
      setStatus('syncing');
      send({ type: 'leave', docId: opts.docId });
      sendJoin();
    } else {
      connect();
    }
  };

  const handleInit = (msg: Extract<ServerWire, { type: 'init' }>) => {
    awaitingInit = false;
    const ops = Array.isArray(msg.ops) ? asOps(msg.ops) : null;
    if (hasBase && ops && msg.version - ops.length === version) {
      // Reconnect: the doc already holds server@version + local edits — rebase, no reset.
      catchUp(ops, msg.acked, true);
    } else if (!hasBase && restored && ops && msg.version - ops.length === restored.baseVersion) {
      // Reload with queued edits: rebase them onto the tip, then show tip + edits.
      version = restored.baseVersion;
      outstanding = restored.outstanding
        ? { seq: restored.outstanding.seq, ops: asOps(restored.outstanding.ops) }
        : null;
      buffer = asOps(restored.buffer);
      catchUp(ops, msg.acked, false);
      applySnapshot(msg.snapshot);
      applyRemoteOps([...(outstanding?.ops ?? []), ...buffer]);
    } else {
      // ponytail: op-log compacted past our base (or room reset): unconfirmed edits can't be
      // rebased and are dropped; keep more ops on the server (`compact --keep`) if this bites.
      outstanding = null;
      buffer = [];
      applySnapshot(msg.snapshot);
    }
    version = msg.version;
    restored = null;
    hasBase = true;
    peers = msg.peers ?? [];
    opts.onPresence?.(peers);
    if (isReadonlyRole()) {
      outstanding = null;
      buffer = [];
      setStatus('readonly');
      readonlyDoc = opts.editor.getJSON();
    } else {
      setStatus('synced');
    }
    reconnectAttempt = 0;
    persist();
    if (outstanding) {
      sendOutstanding();
    } else {
      flush();
    }
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
        awaitingInit = true;
        if (!hasBase && !restoreTried && opts.offlineQueue !== false) {
          restoreTried = true;
          restored = await loadPending(storeId);
          if (restored) {
            clientSeq = Math.max(clientSeq, restored.clientSeq);
          }
        }
        sendJoin();
        break;
      case 'auth_fail':
        setStatus('error');
        opts.editor.notify(opts.editor.t('common.collaborationRequiresATokenMatchingCollabToken'));
        break;
      case 'init':
        handleInit(msg);
        break;
      case 'ack': {
        if (awaitingInit || !hasBase) {
          break;
        }
        const ops = asOps(msg.ops);
        if (msg.version - ops.length !== version) {
          // Missed a message (gap in the log): never guess, reload.
          resync();
          break;
        }
        if (
          outstanding &&
          msg.clientSeq !== undefined &&
          msg.clientSeq === outstanding.seq &&
          msg.authorId === sessionUserId
        ) {
          if (JSON.stringify(ops) !== JSON.stringify(outstanding.ops)) {
            resync();
            break;
          }
          outstanding = null;
          version = msg.version;
          persist();
          flush();
        } else {
          receiveRemote(ops, true);
          if (outstanding || buffer.length > 0) {
            persist();
          }
        }
        break;
      }
      case 'reject':
        if (awaitingInit || !outstanding || msg.clientSeq !== outstanding.seq) {
          break;
        }
        if (msg.resync) {
          outstanding = null;
          buffer = [];
          version = msg.resync.version;
          applySnapshot(msg.resync.snapshot);
          persist();
          break;
        }
        if (msg.reason === 'noop_after_rebase' && outstanding.ops.length === 0) {
          // Our batch was cancelled by concurrent edits on both sides alike.
          outstanding = null;
          persist();
          flush();
          break;
        }
        resync();
        break;
      case 'presence':
        peers = msg.peers.filter((p) => p.userId !== sessionUserId);
        opts.onPresence?.(peers);
        break;
      case 'error':
        // Comment-channel refusals don't break the doc session.
        if (msg.reason !== 'readonly' && !msg.reason.startsWith('comment_')) {
          setStatus('error');
        }
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
    if (event.source !== 'local' || applyingRemote) {
      return;
    }
    // Local-only decorations (e.g. spell-check marks) are not document edits.
    if (event.tr.meta?.addToHistory === false) {
      return;
    }
    const ops = event.tr.ops.filter((o) => o.type !== 'set_selection');
    if (ops.length === 0) {
      // presence only
      sendPresence();
      return;
    }
    if (status === 'readonly') {
      const doc = readonlyDoc;
      if (doc) {
        queueMicrotask(() => applySnapshot(doc));
      }
      return;
    }
    if (!hasBase) {
      // Before the first `init`: the snapshot from `init` replaces this doc anyway.
      return;
    }
    buffer.push(...ops);
    persist();
    flush();
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
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    try {
      ws?.close();
      awaitingInit = true;
      setStatus(reconnectAttempt > 0 ? 'reconnecting' : 'connecting');
      const sock = new WebSocket(wsUrl(opts.serverUrl));
      ws = sock;
      // Events from a replaced socket (forceResync / reconnect) must not drive this client,
      // otherwise its late `close` schedules a reconnect that closes the live socket, forever.
      sock.addEventListener('open', () => {
        if (sock !== ws) {
          return;
        }
        send({ type: 'hello', protocolVersion: PROTOCOL_VERSION });
        if (pingTimer) {
          clearInterval(pingTimer);
        }
        pingTimer = setInterval(() => send({ type: 'ping', ts: Date.now() }), 25_000);
      });
      sock.addEventListener('message', (ev) => {
        if (sock !== ws) {
          return;
        }
        let msg: ServerWire | null = null;
        try {
          msg = parseServerWire(JSON.parse(String(ev.data)));
        } catch {
          /* ignore */
        }
        if (!msg) {
          return;
        }
        const m = msg;
        // Strictly in order: an `ack` must not overtake an `init` awaiting IndexedDB.
        msgChain = after(msgChain, async () => {
          try {
            await handleServer(m);
          } catch {
            // Remote ops that don't apply locally mean divergence: reload the snapshot.
            if (!stopped && sock === ws) {
              resync();
            }
          }
        });
      });
      sock.addEventListener('close', () => {
        if (sock !== ws) {
          return;
        }
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
      sock.addEventListener('error', () => {
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
      // Unconfirmed edits stay in IndexedDB; the next start rebases them from there.
      outstanding = null;
      buffer = [];
      hasBase = false;
      restoreTried = false;
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
    getPendingCount: () => (outstanding?.ops.length ?? 0) + buffer.length,
    forceResync: resync,
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
