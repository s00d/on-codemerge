import http from 'node:http';
import type { IncomingMessage, Server as HttpServer, ServerResponse } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';
import type { AuthAdapter, AuthSession } from './auth';
import { PROTOCOL_VERSION, parseClientMessage, type ServerMessage } from './protocol';
import { PresenceHub } from './presence';
import { RoomManager, type ClientConn } from './room';
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
      void opts.redis.publish(`room:${docId}`, JSON.stringify(msg));
    }
  };

  const rooms = new RoomManager(opts.store, presence, fanout, webhook);

  if (opts.redis) {
    redisUnsub = await opts.redis.subscribe('room:*', (message) => {
      try {
        const msg = JSON.parse(message) as ServerMessage;
        if (msg.type === 'ack' && 'docId' in msg) {
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
      const init = await rooms.join(conn, msg.docId, msg.snapshot);
      send(ws, init);
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
      await rooms.submit(conn, msg.docId, msg.baseVersion, msg.ops, msg.clientSeq);
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
      if (!conn.session || conn.docId !== msg.docId) {
        return;
      }
      if (conn.session.role === 'read' && msg.action === 'add') {
        send(ws, { type: 'error', reason: 'readonly' });
        return;
      }
      let list = commentThreads.get(msg.docId) ?? [];
      if (msg.action === 'add') {
        list = [...list.filter((t) => t.id !== msg.thread.id), msg.thread];
      } else if (msg.action === 'resolve') {
        list = list.map((t) => (t.id === msg.thread.id ? { ...t, resolved: true } : t));
      } else if (msg.action === 'remove') {
        list = list.filter((t) => t.id !== msg.thread.id);
      }
      commentThreads.set(msg.docId, list);
      fanout(msg.docId, { type: 'comment', docId: msg.docId, threads: list });
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
      void onMessage(ws, data as Buffer);
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
    const docId = decodeURIComponent(roomMatch[1]!);
    const isVersions = Boolean(roomMatch[2]);

    const authHeader = req.headers.authorization;
    const token =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : typeof url.searchParams.get('token') === 'string'
          ? url.searchParams.get('token')!
          : '';
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

    if (req.method === 'POST' && isVersions) {
      const chunks: Buffer[] = [];
      for await (const c of req) {
        chunks.push(c as Buffer);
      }
      let name = 'snapshot';
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as { name?: string };
        if (typeof body.name === 'string') {
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
      if (session.role === 'read') {
        res.writeHead(403, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: 'readonly' }));
        return true;
      }
      const chunks: Buffer[] = [];
      for await (const c of req) {
        chunks.push(c as Buffer);
      }
      let body: { ops?: unknown[]; baseVersion?: number };
      try {
        body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as {
          ops?: unknown[];
          baseVersion?: number;
        };
      } catch {
        res.writeHead(400, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: 'bad_json' }));
        return true;
      }
      const result = await injectOpsInternal(
        docId,
        (body.ops ?? []) as Operation[],
        session.userId,
        body.baseVersion
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
  }

  function attach(server: HttpServer): void {
    wss = new WebSocketServer({ noServer: true });
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
        const handled = await handleRest(req, res);
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
