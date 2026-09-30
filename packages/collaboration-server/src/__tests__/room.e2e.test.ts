import { afterEach, describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import {
  createCollaborationServer,
  staticTokenAuth,
  memoryStore,
  type CollaborationServer,
} from '../index.ts';
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
