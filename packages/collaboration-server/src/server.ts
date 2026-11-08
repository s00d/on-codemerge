import http from 'node:http';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage, Server as HttpServer, ServerResponse } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';
import type { AuthAdapter, AuthSession } from './auth';
import { PROTOCOL_VERSION, parseClientMessage, type ServerMessage } from './protocol';
import { PresenceHub } from './presence';
import { RoomManager, canEditDoc, type ClientConn } from './room';
import type { CollabStore } from './store/types';
import { createWebhookEmitter, type WebhookConfig } from './webhooks';
import type { RedisFanout } from './redis';
import type { Operation } from '@codemerge/kernel';
import { acceptSubmit } from './authority';
import { emptyRoom } from './store/memory';

export type CollaborationServerOptions = {
  store: CollabStore;
  auth: AuthAdapter;
  /** WebSocket path when attached to an HTTP server (default `/collab`) */
  path?: string;
  /** Max JSON bytes before auth (default 64 KiB) */
  maxPreAuthBytes?: number;
  /** Max ops per submit (default 500) */
  maxOpsPerSubmit?: number;
  webhooks?: WebhookConfig | WebhookConfig[];
  redis?: RedisFanout;
  /** Enable REST under same HTTP server (default true) */
  rest?: boolean;
};

export type CollaborationServer = {
  /** Attach WS upgrade + REST to an existing Node HTTP server */
  attach: (server: HttpServer) => void;
  /** Create and listen on a port */
  listen: (port: number, host?: string) => Promise<HttpServer>;
  close: () => Promise<void>;
  /** Inject ops as a bot/system user (REST/agent) */
  injectOps: (
    docId: string,
    ops: Operation[],
    authorId?: string
  ) => Promise<{ version: number } | { error: string }>;
  store: CollabStore;
};

const CAPS = ['presence', 'oplog', 'versions', 'rest', 'webhooks', 'comments'] as const;

/** Comment channel limits (threads live in memory per live room). */
const MAX_COMMENT_THREADS = 2000;
const MAX_COMMENT_BODY = 10_000;

/** Cap for REST bodies and single WS messages. */
const MAX_REST_BODY_BYTES = 8 * 1024 * 1024;

class BodyTooLargeError extends Error {}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const c of req) {
    const chunk = c as Buffer;
    size += chunk.byteLength;
    if (size > MAX_REST_BODY_BYTES) {
      throw new BodyTooLargeError();
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

export async function createCollaborationServer(
  opts: CollaborationServerOptions
): Promise<CollaborationServer> {
  const path = opts.path ?? '/collab';
  const maxPreAuthBytes = opts.maxPreAuthBytes ?? 64 * 1024;
  const maxOpsPerSubmit = opts.maxOpsPerSubmit ?? 500;
  const presence = new PresenceHub();
  const webhook = createWebhookEmitter(opts.webhooks);
  const conns = new WeakMap<WebSocket, ClientConn>();
  const commentThreads = new Map<
    string,
    Array<{
      id: string;
      body: string;
      authorId: string;
      anchor: { nodeId?: string; path: number[]; from: number; to: number };
      createdAt: number;
      resolved?: boolean;
    }>
  >();
  let wss: WebSocketServer | null = null;
  let ownedServer: HttpServer | null = null;
  let redisUnsub: (() => void) | Promise<void> | null = null;
  /** Tags our Redis publishes so we don't re-deliver our own acks to local clients. */
  const instanceId = randomUUID();

  const fanoutLocal = (docId: string, msg: ServerMessage, except?: WebSocket) => {
    const set = rooms.clients(docId);
    const raw = JSON.stringify(msg);
    for (const ws of set) {
      if (ws !== except && ws.readyState === ws.OPEN) {
        ws.send(raw);
      }
    }
  };

  const fanout = (docId: string, msg: ServerMessage, except?: WebSocket) => {
    fanoutLocal(docId, msg, except);
    if (opts.redis && msg.type === 'ack') {
      void opts.redis
        .publish(`room:${docId}`, JSON.stringify({ ...msg, origin: instanceId }))
        .catch(() => {
          /* fanout is best-effort */
        });
    }
  };

  // Comment threads are ephemeral (in-memory): drop them when the room unloads.
  const rooms = new RoomManager(opts.store, presence, fanout, webhook, (docId) => {
    commentThreads.delete(docId);
  });

  if (opts.redis) {
    redisUnsub = await opts.redis.subscribe('room:*', (message) => {
      try {
        const { origin, ...msg } = JSON.parse(message) as ServerMessage & { origin?: string };
        if (origin !== instanceId && msg.type === 'ack' && 'docId' in msg) {
          fanoutLocal(msg.docId, msg);
        }
      } catch {
        /* ignore */
      }
    });
  }

  function send(ws: WebSocket, msg: ServerMessage): void {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  async function onMessage(ws: WebSocket, data: Buffer | ArrayBuffer | Buffer[]): Promise<void> {
    const conn = conns.get(ws);
    if (!conn) {
      return;
    }
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);
    if (!conn.session) {
      conn.preAuthBytes += buf.byteLength;
      if (conn.preAuthBytes > maxPreAuthBytes) {
        ws.close(1008, 'preauth_limit');
        return;
      }
    }
    let json: unknown;
    try {
      json = JSON.parse(buf.toString('utf8'));
    } catch {
      return;
    }
    const msg = parseClientMessage(json);
    if (!msg) {
      return;
    }

    if (msg.type === 'hello') {
      if (msg.protocolVersion !== PROTOCOL_VERSION) {
        send(ws, { type: 'error', reason: `unsupported_protocol_${msg.protocolVersion}` });
        ws.close(1002, 'protocol');
        return;
      }
      conn.helloOk = true;
      send(ws, {
        type: 'hello_ok',
        protocolVersion: PROTOCOL_VERSION,
        caps: [...CAPS],
      });
      return;
    }

    if (msg.type === 'ping') {
      send(ws, { type: 'pong', ts: msg.ts });
      return;
    }

    if (msg.type === 'auth') {
      const claimed =
        'userId' in msg && typeof Reflect.get(msg, 'userId') === 'string'
          ? String(Reflect.get(msg, 'userId'))
          : undefined;
      const session: AuthSession | null = await opts.auth.verify(msg.token, {
        claimedUserId: claimed,
      });
      if (!session) {
        send(ws, { type: 'auth_fail', reason: 'invalid_token' });
        ws.close(1008, 'unauthorized');
        return;
      }
      conn.session = session;
      send(ws, { type: 'auth_ok', userId: session.userId, role: session.role });
      return;
    }

    if (!conn.helloOk || !conn.session) {
      send(ws, { type: 'error', reason: 'handshake_required' });
      return;
    }

    if (msg.type === 'join') {
      await rooms.join(conn, msg.docId, msg.snapshot, msg.sinceVersion, msg.clientId);
      return;
    }

    if (msg.type === 'leave') {
      rooms.leave(conn);
      return;
    }

    if (msg.type === 'submit') {
      if (msg.ops.length > maxOpsPerSubmit) {
        send(ws, {
          type: 'reject',
          docId: msg.docId,
          reason: 'too_many_ops',
          clientSeq: msg.clientSeq,
        });
        return;
      }
      await rooms.submit(conn, msg.docId, msg.baseVersion, msg.ops, msg.clientSeq, msg.clientId);
      return;
    }

    if (msg.type === 'presence') {
      if (conn.docId !== msg.docId || !conn.session) {
        return;
      }
      const peers = presence.set(msg.docId, conn.session.userId, msg.state);
      fanout(msg.docId, { type: 'presence', docId: msg.docId, peers }, ws);
      return;
    }

    if (msg.type === 'comment') {
      const session = conn.session;
      if (!session || conn.docId !== msg.docId) {
        return;
      }
      if (session.role === 'read') {
        send(ws, { type: 'error', reason: 'readonly' });
        return;
      }
      const list = commentThreads.get(msg.docId) ?? [];
      const existing = list.find((t) => t.id === msg.thread.id);
      const isAuthor = existing?.authorId === session.userId;
      let next = list;
      if (msg.action === 'add') {
        const { body, anchor } = msg.thread;
        if (typeof body !== 'string' || typeof anchor !== 'object' || anchor === null) {
          send(ws, { type: 'error', reason: 'comment_invalid' });
          return;
        }
        if (body.length > MAX_COMMENT_BODY) {
          send(ws, { type: 'error', reason: 'comment_too_large' });
          return;
        }
        if (existing && !isAuthor) {
          send(ws, { type: 'error', reason: 'comment_forbidden' });
          return;
        }
        if (!existing && list.length >= MAX_COMMENT_THREADS) {
          send(ws, { type: 'error', reason: 'comment_limit' });
          return;
        }
        // authorId comes from the session, never from the client payload.
        const thread = { ...msg.thread, authorId: session.userId };
        next = [...list.filter((t) => t.id !== thread.id), thread];
      } else if (existing) {
        // resolve: author or a doc editor; remove: author only (no admin/owner roles exist).
        const allowed = isAuthor || (msg.action === 'resolve' && canEditDoc(session));
        if (!allowed) {
          send(ws, { type: 'error', reason: 'comment_forbidden' });
          return;
        }
        next =
          msg.action === 'resolve'
            ? list.map((t) => (t.id === existing.id ? { ...t, resolved: true } : t))
            : list.filter((t) => t.id !== existing.id);
      } else {
        return;
      }
      commentThreads.set(msg.docId, next);
      fanout(msg.docId, { type: 'comment', docId: msg.docId, threads: next });
      webhook('comment.changed', { docId: msg.docId, action: msg.action });
    }
  }

  function handleConnection(ws: WebSocket): void {
    const conn: ClientConn = {
      ws,
      session: null,
      docId: null,
      helloOk: false,
      preAuthBytes: 0,
    };
    conns.set(ws, conn);
    ws.on('message', (data) => {
      // A throwing auth adapter / store must not become an unhandled rejection (process crash).
      onMessage(ws, data as Buffer).catch(() => {
        send(ws, { type: 'error', reason: 'internal_error' });
      });
    });
    ws.on('close', () => {
      rooms.leave(conn);
      if (conn.session) {
        for (const docId of presence.removeFromAll(conn.session.userId)) {
          fanout(docId, { type: 'presence', docId, peers: presence.list(docId) });
        }
      }
    });
  }

  async function handleRest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    if (opts.rest === false) {
      return false;
    }
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (!url.pathname.startsWith(`${path}/`) && url.pathname !== `${path}/health`) {
      // also allow /collab/rooms/...
      if (!url.pathname.startsWith(path)) {
        return false;
      }
    }

    if (url.pathname === `${path}/health` || url.pathname === `${path}/healthz`) {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true, protocolVersion: PROTOCOL_VERSION }));
      return true;
    }

    const roomMatch = url.pathname.match(
      new RegExp(`^${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/rooms/([^/]+)(/versions)?/?$`)
    );
    if (!roomMatch) {
      return false;
    }
    let docId: string;
    try {
      docId = decodeURIComponent(roomMatch[1]!);
    } catch {
      sendJson(res, 400, { error: 'bad_doc_id' });
      return true;
    }
    const isVersions = Boolean(roomMatch[2]);

    // REST takes the token from `Authorization: Bearer` only: query strings leak into
    // access logs, proxies and Referer. (WS auth is the in-band `auth` message.)
    const authHeader = req.headers.authorization;
    const token =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const session = await opts.auth.verify(token, { docId });
    if (!session) {
      res.writeHead(401, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'unauthorized' }));
      return true;
    }
    if (session.docs && !session.docs.includes(docId)) {
      res.writeHead(403, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'forbidden' }));
      return true;
    }

    if (req.method === 'GET' && !isVersions) {
      const room = await opts.store.loadRoom(docId);
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(
        JSON.stringify(
          room
            ? { docId, version: room.version, snapshot: room.snapshot }
            : { docId, version: 0, snapshot: null }
        )
      );
      return true;
    }

    if (req.method === 'GET' && isVersions) {
      const list = (await opts.store.listVersions?.(docId)) ?? [];
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ docId, versions: list }));
      return true;
    }

    if (req.method === 'POST' && !canEditDoc(session)) {
      sendJson(res, 403, { error: 'readonly' });
      return true;
    }

    if (req.method === 'POST' && isVersions) {
      const raw = await readBody(req);
      let name = 'snapshot';
      try {
        const body = JSON.parse(raw) as { name?: unknown } | null;
        if (typeof body?.name === 'string') {
          name = body.name;
        }
      } catch {
        /* default name */
      }
      const entry = await opts.store.saveVersion?.(docId, name);
      if (!entry) {
        res.writeHead(404, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: 'room_not_found' }));
        return true;
      }
      res.writeHead(201, { 'content-type': 'application/json' });
      res.end(JSON.stringify(entry));
      return true;
    }

    if (req.method === 'POST' && !isVersions) {
      let body: { ops?: unknown; baseVersion?: number } | null;
      try {
        body = JSON.parse(await readBody(req)) as { ops?: unknown; baseVersion?: number } | null;
      } catch (err) {
        if (err instanceof BodyTooLargeError) {
          throw err;
        }
        sendJson(res, 400, { error: 'bad_json' });
        return true;
      }
      const ops = body?.ops ?? [];
      if (!Array.isArray(ops)) {
        sendJson(res, 400, { error: 'bad_ops' });
        return true;
      }
      if (ops.length > maxOpsPerSubmit) {
        sendJson(res, 413, { error: 'too_many_ops' });
        return true;
      }
      const result = await injectOpsInternal(
        docId,
        ops as Operation[],
        session.userId,
        body?.baseVersion
      );
      if ('error' in result) {
        res.writeHead(409, { 'content-type': 'application/json' });
        res.end(JSON.stringify(result));
        return true;
      }
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(result));
      return true;
    }

    return false;
  }

  async function injectOpsInternal(
    docId: string,
    ops: Operation[],
    authorId: string,
    baseVersion?: number
  ): Promise<{ version: number } | { error: string }> {
    return rooms.withDocLock(docId, async () => {
      const room = (await opts.store.loadRoom(docId)) ?? emptyRoom(docId);
      const result = acceptSubmit(room, baseVersion ?? room.version, ops);
      if (!result.ok) {
        return { error: result.reason };
      }
      await opts.store.appendOps(docId, result.ops, result.snapshot, result.version);
      fanout(docId, {
        type: 'ack',
        docId,
        version: result.version,
        ops: result.ops,
        authorId,
      });
      webhook('doc.changed', {
        docId,
        version: result.version,
        authorId,
        opCount: result.ops.length,
      });
      return { version: result.version };
    });
  }

  function attach(server: HttpServer): void {
    wss = new WebSocketServer({ noServer: true, maxPayload: MAX_REST_BODY_BYTES });
    wss.on('connection', handleConnection);
    server.on('upgrade', (req, socket, head) => {
      const url = new URL(req.url ?? '/', 'http://localhost');
      if (url.pathname !== path && url.pathname !== `${path}/`) {
        return;
      }
      wss!.handleUpgrade(req, socket, head, (ws) => {
        wss!.emit('connection', ws, req);
      });
    });
    const prev = server.listeners('request');
    server.removeAllListeners('request');
    server.on('request', (req, res) => {
      void (async () => {
        let handled: boolean;
        try {
          handled = await handleRest(req, res);
        } catch (err) {
          // Unhandled rejections here would crash the process (malformed body, store failure).
          if (!res.headersSent) {
            sendJson(res, err instanceof BodyTooLargeError ? 413 : 500, {
              error: err instanceof BodyTooLargeError ? 'body_too_large' : 'internal_error',
            });
          } else {
            res.destroy();
          }
          return;
        }
        if (handled) {
          return;
        }
        for (const listener of prev) {
          (listener as (r: IncomingMessage, s: ServerResponse) => void).call(server, req, res);
        }
        if (prev.length === 0 && !res.writableEnded) {
          res.writeHead(404);
          res.end();
        }
      })();
    });
  }

  return {
    attach,
    async listen(port, host = '0.0.0.0') {
      const server = http.createServer();
      ownedServer = server;
      attach(server);
      await new Promise<void>((resolve) => {
        server.listen(port, host, () => resolve());
      });
      return server;
    },
    async close() {
      if (typeof redisUnsub === 'function') {
        await redisUnsub();
      } else if (redisUnsub) {
        await redisUnsub;
      }
      // ws v8 `close()` leaves client sockets open, which keeps `ownedServer.close` pending.
      for (const client of wss?.clients ?? []) {
        client.terminate();
      }
      await new Promise<void>((resolve) => {
        wss?.close(() => resolve());
        if (!wss) {
          resolve();
        }
      });
      await new Promise<void>((resolve, reject) => {
        if (!ownedServer) {
          resolve();
          return;
        }
        ownedServer.close((err) => (err ? reject(err) : resolve()));
      });
      await opts.store.close?.();
      await opts.redis?.close();
    },
    injectOps: (docId, ops, authorId = 'system') => injectOpsInternal(docId, ops, authorId),
    store: opts.store,
  };
}
