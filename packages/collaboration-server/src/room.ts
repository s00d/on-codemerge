import type { WebSocket } from 'ws';
import type { AuthSession } from './auth';
import type { CollabStore, RoomRecord } from './store/types';
import { emptyRoom } from './store/memory';
import { acceptSubmit } from './authority';
import type { PresenceHub } from './presence';
import type { ServerMessage } from './protocol';
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

export class RoomManager {
  private readonly live = new Map<string, Set<WebSocket>>();

  constructor(
    private readonly store: CollabStore,
    private readonly presence: PresenceHub,
    private readonly fanout: RoomFanout,
    private readonly webhook?: WebhookEmitter
  ) {}

  clients(docId: string): Set<WebSocket> {
    let set = this.live.get(docId);
    if (!set) {
      set = new Set();
      this.live.set(docId, set);
    }
    return set;
  }

  async join(conn: ClientConn, docId: string, seedSnapshot?: unknown): Promise<ServerMessage> {
    if (!conn.session) {
      return { type: 'error', reason: 'unauthenticated' };
    }
    if (conn.session.docs && !conn.session.docs.includes(docId)) {
      return { type: 'error', reason: 'forbidden_doc' };
    }

    let room = await this.store.loadRoom(docId);
    if (!room) {
      const snap =
        seedSnapshot && typeof seedSnapshot === 'object' && seedSnapshot !== null
          ? ensureNodeIds(seedSnapshot as DocNode)
          : undefined;
      room = emptyRoom(docId, snap);
      await this.store.saveRoom(room);
    }

    if (conn.docId && conn.docId !== docId) {
      this.leave(conn);
    }
    conn.docId = docId;
    this.clients(docId).add(conn.ws);

    this.webhook?.('presence.join', { docId, userId: conn.session.userId });

    return {
      type: 'init',
      docId,
      version: room.version,
      snapshot: room.snapshot,
      peers: this.presence.list(docId),
    };
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
    }
  }

  async submit(
    conn: ClientConn,
    docId: string,
    baseVersion: number,
    ops: unknown[],
    clientSeq?: number
  ): Promise<void> {
    if (!conn.session) {
      this.send(conn.ws, { type: 'error', reason: 'unauthenticated' });
      return;
    }
    if (conn.session.role === 'read') {
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
    const ack: ServerMessage = {
      type: 'ack',
      docId,
      version: result.version,
      ops: result.ops,
      clientSeq,
      authorId: conn.session.userId,
    };
    this.fanout(docId, ack);
    this.webhook?.('doc.changed', {
      docId,
      version: result.version,
      authorId: conn.session.userId,
      opCount: result.ops.length,
    });
  }

  async getRoom(docId: string): Promise<RoomRecord | null> {
    return this.store.loadRoom(docId);
  }

  send(ws: WebSocket, msg: ServerMessage): void {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }
}
