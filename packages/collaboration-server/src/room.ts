import type { WebSocket } from 'ws';
import type { AuthSession } from './auth';
import type { CollabStore } from './store/types';
import { emptyRoom } from './store/memory';
import { acceptSubmit } from './authority';
import type { PresenceHub } from './presence';
import type { AckedBatch, ServerMessage } from './protocol';
import type { DocNode } from '@codemerge/kernel';
import { ensureNodeIds } from '@codemerge/kernel';

export type ClientConn = {
  ws: WebSocket;
  session: AuthSession | null;
  docId: string | null;
  helloOk: boolean;
  preAuthBytes: number;
};

export type RoomFanout = (docId: string, msg: ServerMessage, except?: WebSocket) => void;

export type WebhookEmitter = (event: string, payload: Record<string, unknown>) => void;

/** Only `write` may change the document; `read` and `comment` sessions get `reject readonly`. */
export function canEditDoc(session: AuthSession): boolean {
  return session.role === 'write';
}

/** Cap for the resubmit-dedupe table (`docId+user+clientId` → last applied clientSeq). */
const MAX_DEDUPE_ENTRIES = 10_000;

export class RoomManager {
  private readonly live = new Map<string, Set<WebSocket>>();
  /** Per-doc promise chain: load → apply → append → fanout must not interleave. */
  private readonly locks = new Map<string, Promise<void>>();
  /**
   * Last applied clientSeq per `docId\0userId\0clientId`: a client that lost the ack on a
   * dropped socket resubmits after reconnect; the second copy must not be applied twice.
   * ponytail: in-memory + FIFO-capped, lost on restart; persist next to the op-log if that matters.
   */
  private readonly lastSeq = new Map<string, AckedBatch>();

  constructor(
    private readonly store: CollabStore,
    private readonly presence: PresenceHub,
    private readonly fanout: RoomFanout,
    private readonly webhook?: WebhookEmitter,
    /** Called when the last live socket leaves `docId` (room unloaded from memory). */
    private readonly onRoomEmpty?: (docId: string) => void
  ) {}

  clients(docId: string): Set<WebSocket> {
    let set = this.live.get(docId);
    if (!set) {
      set = new Set();
      this.live.set(docId, set);
    }
    return set;
  }

  /** Run `fn` exclusively for `docId` (serializes concurrent submits/joins/REST writes). */
  withDocLock<T>(docId: string, fn: () => Promise<T>): Promise<T> {
    const prev = this.locks.get(docId) ?? Promise.resolve();
    const run = prev.then(fn);
    const tail = run.then(
      () => undefined,
      () => undefined
    );
    this.locks.set(docId, tail);
    void tail.then(() => {
      if (this.locks.get(docId) === tail) {
        this.locks.delete(docId);
      }
      return undefined;
    });
    return run;
  }

  /** Sends `init` (or an error) to the joiner inside the doc lock so no ack can precede it. */
  async join(
    conn: ClientConn,
    docId: string,
    seedSnapshot?: unknown,
    sinceVersion?: number,
    clientId?: string
  ): Promise<void> {
    const session = conn.session;
    if (!session) {
      this.send(conn.ws, { type: 'error', reason: 'unauthenticated' });
      return;
    }
    if (session.docs && !session.docs.includes(docId)) {
      this.send(conn.ws, { type: 'error', reason: 'forbidden_doc' });
      return;
    }
    await this.withDocLock(docId, () =>
      this.joinLocked(conn, session, docId, seedSnapshot, sinceVersion, clientId)
    );
  }

  private async joinLocked(
    conn: ClientConn,
    session: AuthSession,
    docId: string,
    seedSnapshot: unknown,
    sinceVersion: number | undefined,
    clientId: string | undefined
  ): Promise<void> {
    let room = await this.store.loadRoom(docId);
    if (!room) {
      const snap =
        seedSnapshot && typeof seedSnapshot === 'object' && seedSnapshot !== null
          ? ensureNodeIds(seedSnapshot as DocNode)
          : undefined;
      room = emptyRoom(docId, snap);
      await this.store.saveRoom(room);
    }
    // Socket closed while loading: registering it would leak it in `live`.
    if (conn.ws.readyState !== conn.ws.OPEN) {
      return;
    }

    if (conn.docId && conn.docId !== docId) {
      this.leave(conn);
    }
    conn.docId = docId;
    this.clients(docId).add(conn.ws);

    this.webhook?.('presence.join', { docId, userId: session.userId });

    // Catch-up: ops since the client's confirmed version, if the (possibly compacted) log has them.
    const firstOpVersion = room.version - room.ops.length;
    const ops =
      sinceVersion !== undefined &&
      Number.isInteger(sinceVersion) &&
      sinceVersion >= firstOpVersion &&
      sinceVersion <= room.version
        ? room.ops.slice(sinceVersion - firstOpVersion)
        : undefined;
    const acked =
      clientId !== undefined ? this.lastSeq.get(this.seqKey(docId, session, clientId)) : undefined;

    this.send(conn.ws, {
      type: 'init',
      docId,
      version: room.version,
      snapshot: room.snapshot,
      peers: this.presence.list(docId),
      ...(ops ? { ops } : {}),
      ...(acked ? { acked } : {}),
    });
  }

  private seqKey(docId: string, session: AuthSession, clientId: string): string {
    return `${docId}\0${session.userId}\0${clientId}`;
  }

  leave(conn: ClientConn): void {
    const docId = conn.docId;
    if (!docId) {
      return;
    }
    this.clients(docId).delete(conn.ws);
    if (conn.session) {
      const peers = this.presence.remove(docId, conn.session.userId);
      this.fanout(docId, { type: 'presence', docId, peers }, conn.ws);
      this.webhook?.('presence.leave', { docId, userId: conn.session.userId });
    }
    conn.docId = null;
    if (this.clients(docId).size === 0) {
      this.live.delete(docId);
      this.onRoomEmpty?.(docId);
    }
  }

  async submit(
    conn: ClientConn,
    docId: string,
    baseVersion: number,
    ops: unknown[],
    clientSeq?: number,
    clientId?: string
  ): Promise<void> {
    const session = conn.session;
    if (!session) {
      this.send(conn.ws, { type: 'error', reason: 'unauthenticated' });
      return;
    }
    if (!canEditDoc(session)) {
      this.send(conn.ws, {
        type: 'reject',
        docId,
        reason: 'readonly',
        clientSeq,
      });
      return;
    }
    if (conn.docId !== docId) {
      this.send(conn.ws, { type: 'reject', docId, reason: 'not_joined', clientSeq });
      return;
    }
    await this.withDocLock(docId, async () => {
      const dedupeKey =
        clientId !== undefined && clientSeq !== undefined
          ? this.seqKey(docId, session, clientId)
          : null;
      const seen = dedupeKey ? this.lastSeq.get(dedupeKey) : undefined;
      if (seen !== undefined && clientSeq !== undefined && clientSeq <= seen.seq) {
        this.send(conn.ws, { type: 'reject', docId, reason: 'duplicate', clientSeq });
        return;
      }
      const room = (await this.store.loadRoom(docId)) ?? emptyRoom(docId);
      const result = acceptSubmit(room, baseVersion, ops);
      if (!result.ok) {
        this.send(conn.ws, {
          type: 'reject',
          docId,
          reason: result.reason,
          clientSeq,
          resync: result.resync,
        });
        return;
      }

      await this.store.appendOps(docId, result.ops, result.snapshot, result.version);
      if (dedupeKey && clientSeq !== undefined) {
        this.lastSeq.delete(dedupeKey);
        this.lastSeq.set(dedupeKey, {
          seq: clientSeq,
          from: result.version - result.ops.length,
          to: result.version,
        });
        if (this.lastSeq.size > MAX_DEDUPE_ENTRIES) {
          const oldest = this.lastSeq.keys().next().value;
          if (oldest !== undefined) {
            this.lastSeq.delete(oldest);
          }
        }
      }
      const ack = {
        type: 'ack',
        docId,
        version: result.version,
        ops: result.ops,
        authorId: session.userId,
      } as const;
      // clientSeq only to the submitter: peers (incl. the same user on another device)
      // must not mistake this ack for their own in-flight batch with the same seq.
      this.fanout(docId, ack, conn.ws);
      this.send(conn.ws, { ...ack, clientSeq });
      this.webhook?.('doc.changed', {
        docId,
        version: result.version,
        authorId: session.userId,
        opCount: result.ops.length,
      });
    });
  }

  send(ws: WebSocket, msg: ServerMessage): void {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }
}
