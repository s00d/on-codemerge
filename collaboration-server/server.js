const WebSocket = require('ws');

const TOKEN = process.env.COLLAB_TOKEN;
if (!TOKEN) {
  console.error('COLLAB_TOKEN is required (fail-closed). Example: COLLAB_TOKEN=dev pnpm start');
  process.exit(1);
}

const PORT = Number(process.env.PORT) || 8080;
const wss = new WebSocket.Server({ port: PORT });
/** @type {Map<string, { clients: Set<import('ws')>, snapshot: unknown }>} */
const rooms = new Map();

function unauthorized(ws) {
  try {
    ws.close(1008, 'unauthorized');
  } catch {
    /* ignore */
  }
}

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    let data;
    try {
      data = JSON.parse(String(raw));
    } catch {
      return;
    }
    const { type, docId, ops, token, userId, snapshot } = data ?? {};
    if (token !== TOKEN) {
      unauthorized(ws);
      return;
    }
    if (typeof docId !== 'string' || !docId) {
      return;
    }

    if (type === 'join') {
      if (!rooms.has(docId)) {
        rooms.set(docId, { clients: new Set(), snapshot: snapshot ?? null });
      }
      const room = rooms.get(docId);
      room.clients.add(ws);
      ws.docId = docId;
      ws.send(
        JSON.stringify({
          type: 'init',
          docId,
          userId,
          snapshot: room.snapshot,
        })
      );
      return;
    }

    if (type === 'ops' && rooms.has(docId) && Array.isArray(ops)) {
      const room = rooms.get(docId);
      if (snapshot !== undefined) {
        room.snapshot = snapshot;
      }
      for (const client of room.clients) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'ops', docId, ops, userId }));
        }
      }
    }
  });

  ws.on('close', () => {
    const docId = ws.docId;
    if (typeof docId !== 'string' || !rooms.has(docId)) {
      return;
    }
    const room = rooms.get(docId);
    room.clients.delete(ws);
    if (room.clients.size === 0) {
      rooms.delete(docId);
    }
  });
});

console.log(`Collaboration ops server on ws://localhost:${PORT} (COLLAB_TOKEN required)`);
