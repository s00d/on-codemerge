import { afterEach, describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import {
  createCollaborationServer,
  staticTokenAuth,
  hmacJwtAuth,
  signHmacJwt,
  memoryStore,
  type CollaborationServer,
} from '../index';
import { createDoc, createParagraph, createText } from '@codemerge/kernel';

async function openClient(url: string): Promise<WebSocket> {
  const ws = new WebSocket(url);
  await new Promise<void>((resolve, reject) => {
    ws.once('open', () => resolve());
    ws.once('error', reject);
  });
  return ws;
}

function waitMsg(ws: WebSocket, type: string, timeoutMs = 3000): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout waiting for ${type}`)), timeoutMs);
    const onMsg = (raw: WebSocket.RawData) => {
      const data = JSON.parse(String(raw)) as Record<string, unknown>;
      if (data.type === type) {
        clearTimeout(t);
        ws.off('message', onMsg);
        resolve(data);
      }
    };
    ws.on('message', onMsg);
  });
}

async function handshake(ws: WebSocket, token: string, userId: string): Promise<string> {
  ws.send(JSON.stringify({ type: 'hello', protocolVersion: 2 }));
  await waitMsg(ws, 'hello_ok');
  ws.send(JSON.stringify({ type: 'auth', token, userId }));
  const ok = await waitMsg(ws, 'auth_ok');
  expect(ok.userId).toBe(userId);
  return String(ok.userId);
}

describe('collab room e2e', () => {
  let server: CollaborationServer | null = null;

  afterEach(async () => {
    await server?.close();
    server = null;
  });

  it('hello → auth → join → submit ack to peer', async () => {
    server = await createCollaborationServer({
      store: memoryStore(),
      auth: staticTokenAuth({ token: 'dev', userId: 'u1' }),
      path: '/collab',
    });
    const httpServer = await server.listen(0, '127.0.0.1');
    const addr = httpServer.address();
    if (!addr || typeof addr === 'string') {
      throw new Error('no port');
    }
    const url = `ws://127.0.0.1:${addr.port}/collab`;

    const a = await openClient(url);
    const b = await openClient(url);

    await handshake(a, 'dev', 'alice');
    await handshake(b, 'dev', 'bob');

    const snap = createDoc([createParagraph([createText('')])]);
    a.send(JSON.stringify({ type: 'join', docId: 'doc1', snapshot: snap }));
    await waitMsg(a, 'init');
    b.send(JSON.stringify({ type: 'join', docId: 'doc1' }));
    await waitMsg(b, 'init');

    const bAck = waitMsg(b, 'ack');
    a.send(
      JSON.stringify({
        type: 'submit',
        docId: 'doc1',
        baseVersion: 0,
        ops: [{ type: 'insert_text', path: [0], offset: 0, text: 'Hello' }],
        clientSeq: 1,
      })
    );
    const ackA = await waitMsg(a, 'ack');
    const ackB = await bAck;
    expect(ackA.version).toBe(1);
    expect(ackA.authorId).toBe('alice');
    expect(ackA.clientSeq).toBe(1);
    expect(ackB.version).toBe(1);
    expect(ackB.authorId).toBe('alice');
    expect(ackB.authorId).not.toBe('bob');

    a.close();
    b.close();
  });

  it('same static token + different claimed userIds stay distinct on ack', async () => {
    server = await createCollaborationServer({
      store: memoryStore(),
      auth: staticTokenAuth({ token: 'dev' }),
      path: '/collab',
    });
    const httpServer = await server.listen(0, '127.0.0.1');
    const addr = httpServer.address();
    if (!addr || typeof addr === 'string') {
      throw new Error('no port');
    }
    const url = `ws://127.0.0.1:${addr.port}/collab`;

    const a = await openClient(url);
    const b = await openClient(url);
    await handshake(a, 'dev', 'J6S4k0Om');
    await handshake(b, 'dev', 'OtherUser1');

    const snap = createDoc([createParagraph([createText('')])]);
    a.send(JSON.stringify({ type: 'join', docId: 'echo-doc', snapshot: snap }));
    await waitMsg(a, 'init');
    b.send(JSON.stringify({ type: 'join', docId: 'echo-doc' }));
    await waitMsg(b, 'init');

    const peerAckP = waitMsg(b, 'ack');
    a.send(
      JSON.stringify({
        type: 'submit',
        docId: 'echo-doc',
        baseVersion: 0,
        ops: [{ type: 'insert_text', path: [0], offset: 0, text: 'x' }],
        clientSeq: 1,
      })
    );
    const selfAck = await waitMsg(a, 'ack');
    const peerAck = await peerAckP;

    // Self-echo guard: authorId must match claimed id so client does NOT re-apply
    expect(selfAck.authorId).toBe('J6S4k0Om');
    expect(selfAck.clientSeq).toBe(1);
    expect(peerAck.authorId).toBe('J6S4k0Om');
    expect(peerAck.ops).toStrictEqual([{ type: 'insert_text', path: [0], offset: 0, text: 'x' }]);

    a.close();
    b.close();
  });

  it('survives malformed messages, serializes concurrent submits, scopes clientSeq', async () => {
    server = await createCollaborationServer({
      store: memoryStore(),
      auth: hmacJwtAuth({ secret: 's' }),
      path: '/collab',
    });
    const httpServer = await server.listen(0, '127.0.0.1');
    const addr = httpServer.address();
    if (!addr || typeof addr === 'string') {
      throw new Error('no port');
    }
    const url = `ws://127.0.0.1:${addr.port}/collab`;
    const a = await openClient(url);
    const b = await openClient(url);

    // Pre-auth: missing token used to throw inside hmacJwtAuth → unhandled rejection.
    a.send(JSON.stringify({ type: 'auth' }));
    await handshake(a, await signHmacJwt('s', { sub: 'alice' }), 'alice');
    await handshake(b, await signHmacJwt('s', { sub: 'bob', role: 'read' }), 'bob');

    const snap = createDoc([createParagraph([createText('')])]);
    a.send(JSON.stringify({ type: 'join', docId: 'd', snapshot: snap }));
    await waitMsg(a, 'init');
    b.send(JSON.stringify({ type: 'join', docId: 'd' }));
    await waitMsg(b, 'init');

    a.send(JSON.stringify({ type: 'submit', docId: 'd', baseVersion: 0 }));
    a.send(JSON.stringify({ type: 'comment', docId: 'd', action: 'add' }));

    const acks: Record<string, unknown>[] = [];
    const peerAcks: Record<string, unknown>[] = [];
    const done = new Promise<void>((resolve) => {
      a.on('message', (raw) => {
        const m = JSON.parse(String(raw)) as Record<string, unknown>;
        if (m.type === 'ack') {
          acks.push(m);
          if (acks.length === 2) {
            resolve();
          }
        }
      });
    });
    b.on('message', (raw) => {
      const m = JSON.parse(String(raw)) as Record<string, unknown>;
      if (m.type === 'ack') {
        peerAcks.push(m);
      }
    });
    for (const seq of [1, 2]) {
      a.send(
        JSON.stringify({
          type: 'submit',
          docId: 'd',
          baseVersion: 0,
          ops: [{ type: 'insert_text', path: [0], offset: 0, text: String(seq) }],
          clientSeq: seq,
        })
      );
    }
    await done;
    expect(acks.map((m) => m.version)).toStrictEqual([1, 2]);
    expect(acks.map((m) => m.clientSeq)).toStrictEqual([1, 2]);
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 50);
    });
    expect(peerAcks).toHaveLength(2);
    expect(peerAcks.every((m) => m.clientSeq === undefined)).toBe(true);

    // Read-only role may not remove comments.
    const err = waitMsg(b, 'error');
    b.send(JSON.stringify({ type: 'comment', docId: 'd', action: 'remove', thread: { id: 'c1' } }));
    expect((await err).reason).toBe('readonly');
    // a/b stay open on purpose: close() must terminate them instead of hanging.
  });

  it('comment role: no doc ops (WS + REST), own comments only, limits', async () => {
    server = await createCollaborationServer({
      store: memoryStore(),
      auth: hmacJwtAuth({ secret: 's' }),
      path: '/collab',
    });
    const httpServer = await server.listen(0, '127.0.0.1');
    const addr = httpServer.address();
    if (!addr || typeof addr === 'string') {
      throw new Error('no port');
    }
    const url = `ws://127.0.0.1:${addr.port}/collab`;
    const writerToken = await signHmacJwt('s', { sub: 'alice' });
    const commenterToken = await signHmacJwt('s', { sub: 'carol', role: 'comment' });
    const a = await openClient(url);
    const c = await openClient(url);
    await handshake(a, writerToken, 'alice');
    await handshake(c, commenterToken, 'carol');
    const snap = createDoc([createParagraph([createText('')])]);
    a.send(JSON.stringify({ type: 'join', docId: 'cd', snapshot: snap }));
    await waitMsg(a, 'init');
    c.send(JSON.stringify({ type: 'join', docId: 'cd' }));
    await waitMsg(c, 'init');

    const rej = waitMsg(c, 'reject');
    c.send(
      JSON.stringify({
        type: 'submit',
        docId: 'cd',
        baseVersion: 0,
        ops: [{ type: 'insert_text', path: [0], offset: 0, text: 'x' }],
        clientSeq: 1,
      })
    );
    expect((await rej).reason).toBe('readonly');

    const base = `http://127.0.0.1:${addr.port}/collab/rooms/cd`;
    const post = (token: string) =>
      fetch(base, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ ops: [{ type: 'insert_text', path: [0], offset: 0, text: 'r' }] }),
      });
    expect((await post(commenterToken)).status).toBe(403);
    expect((await post(writerToken)).status).toBe(200);
    // REST token only via Authorization header: ?token= is ignored.
    expect((await fetch(`${base}?token=${encodeURIComponent(writerToken)}`)).status).toBe(401);
    expect(
      (await fetch(base, { headers: { authorization: `Bearer ${writerToken}` } })).status
    ).toBe(200);

    const thread = (id: string, body = 'hi') => ({
      id,
      body,
      authorId: 'spoofed',
      anchor: { path: [0], from: 0, to: 0 },
      createdAt: 0,
    });
    // Commenter adds own thread; authorId comes from the session.
    const added = waitMsg(a, 'comment');
    const echo = waitMsg(c, 'comment');
    c.send(JSON.stringify({ type: 'comment', docId: 'cd', action: 'add', thread: thread('t1') }));
    await echo;
    const threads = (await added).threads as Array<{ authorId: string }>;
    expect(threads[0]?.authorId).toBe('carol');

    // Writer may resolve but not remove someone else's thread, nor overwrite it.
    const resolved = waitMsg(c, 'comment');
    a.send(
      JSON.stringify({ type: 'comment', docId: 'cd', action: 'resolve', thread: thread('t1') })
    );
    expect((await resolved).threads).toMatchObject([{ id: 't1', resolved: true }]);
    let err = waitMsg(a, 'error');
    a.send(
      JSON.stringify({ type: 'comment', docId: 'cd', action: 'remove', thread: thread('t1') })
    );
    expect((await err).reason).toBe('comment_forbidden');
    err = waitMsg(a, 'error');
    a.send(JSON.stringify({ type: 'comment', docId: 'cd', action: 'add', thread: thread('t1') }));
    expect((await err).reason).toBe('comment_forbidden');
    err = waitMsg(c, 'error');
    c.send(
      JSON.stringify({
        type: 'comment',
        docId: 'cd',
        action: 'add',
        thread: thread('big', 'x'.repeat(10_001)),
      })
    );
    expect((await err).reason).toBe('comment_too_large');

    // Author removes own thread.
    const removed = waitMsg(a, 'comment');
    c.send(
      JSON.stringify({ type: 'comment', docId: 'cd', action: 'remove', thread: thread('t1') })
    );
    expect((await removed).threads).toStrictEqual([]);
    a.close();
    c.close();
  });

  it('join with sinceVersion returns the missed ops and the acked batch for clientId', async () => {
    server = await createCollaborationServer({
      store: memoryStore(),
      auth: staticTokenAuth({ token: 'dev' }),
      path: '/collab',
    });
    const httpServer = await server.listen(0, '127.0.0.1');
    const addr = httpServer.address();
    if (!addr || typeof addr === 'string') {
      throw new Error('no port');
    }
    const url = `ws://127.0.0.1:${addr.port}/collab`;
    const a = await openClient(url);
    await handshake(a, 'dev', 'alice');
    const snap = createDoc([createParagraph([createText('')])]);
    a.send(JSON.stringify({ type: 'join', docId: 'cu', snapshot: snap, clientId: 'tab1' }));
    await waitMsg(a, 'init');
    const op = { type: 'insert_text', path: [0], offset: 0, text: 'x' };
    const submit = () =>
      a.send(
        JSON.stringify({
          type: 'submit',
          docId: 'cu',
          baseVersion: 0,
          ops: [op],
          clientSeq: 7,
          clientId: 'tab1',
        })
      );
    submit();
    await waitMsg(a, 'ack');
    // Resubmitting the same clientSeq (lost ack) must not apply twice.
    const dup = waitMsg(a, 'reject');
    submit();
    expect((await dup).reason).toBe('duplicate');

    a.send(JSON.stringify({ type: 'join', docId: 'cu', sinceVersion: 0, clientId: 'tab1' }));
    const init = await waitMsg(a, 'init');
    expect(init.version).toBe(1);
    expect(init.ops).toStrictEqual([op]);
    expect(init.acked).toStrictEqual({ seq: 7, from: 0, to: 1 });
    a.close();
  });

  it('rejects bad token', async () => {
    server = await createCollaborationServer({
      store: memoryStore(),
      auth: staticTokenAuth({ token: 'secret' }),
      path: '/collab',
    });
    const httpServer = await server.listen(0, '127.0.0.1');
    const addr = httpServer.address();
    if (!addr || typeof addr === 'string') {
      throw new Error('no port');
    }
    const url = `ws://127.0.0.1:${addr.port}/collab`;
    const ws = await openClient(url);
    ws.send(JSON.stringify({ type: 'hello', protocolVersion: 2 }));
    await waitMsg(ws, 'hello_ok');
    const fail = waitMsg(ws, 'auth_fail');
    ws.send(JSON.stringify({ type: 'auth', token: 'nope' }));
    await fail;
    ws.close();
  });
});
