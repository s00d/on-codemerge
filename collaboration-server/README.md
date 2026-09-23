# Collaboration Server

WebSocket **ops** relay for On-Codemerge’s `CollaborationPlugin`. Rooms are keyed by `docId`. Auth is fail-closed: **`COLLAB_TOKEN` is required**.

This is a **local / demo** server, not a production collaboration product.

## Features

- Real-time WebSocket fan-out of kernel ops
- Per-document rooms with optional snapshot for late joiners
- Token check on every message
- Room cleanup when the last client disconnects
- Simple single-file Node server

## Setup

```bash
cd collaboration-server
pnpm install   # or npm install
COLLAB_TOKEN=dev pnpm start
```

Listens on `ws://localhost:8080` (override with `PORT`).

### Environment

| Variable       | Required | Default | Role                                                       |
| -------------- | -------- | ------- | ---------------------------------------------------------- |
| `COLLAB_TOKEN` | **yes**  | —       | Shared secret; must match `CollaborationPlugin({ token })` |
| `PORT`         | no       | `8080`  | Listen port                                                |

Without `COLLAB_TOKEN` the process exits immediately.

## Protocol

All client payloads must include `token` (=== `COLLAB_TOKEN`), `docId`, and usually `userId`.

### Join

```json
{
  "type": "join",
  "docId": "abc",
  "token": "dev",
  "userId": "u1",
  "snapshot": null
}
```

Server responds:

```json
{
  "type": "init",
  "docId": "abc",
  "userId": "u1",
  "snapshot": null
}
```

### Ops

```json
{
  "type": "ops",
  "docId": "abc",
  "token": "dev",
  "userId": "u1",
  "ops": [],
  "snapshot": {}
}
```

Server fans out to other clients in the room (not echo):

```json
{
  "type": "ops",
  "docId": "abc",
  "ops": [],
  "userId": "u1"
}
```

Bad token → close code `1008` (`unauthorized`).

There is **no** HTML `content` field in this protocol. Document SoT is JSON / ops.

## Editor wiring

```ts
CollaborationPlugin({
  serverUrl: 'ws://localhost:8080',
  token: 'dev',
  autoStart: false,
});
```

See [Collaboration Plugin](https://github.com/s00d/on-codemerge/blob/main/docs/plugins/collaboration-plugin.md) in the docs site.

## Custom server sketch

Mirror `server.js`: Map of rooms `{ clients, snapshot }`, validate token, handle `join` / `ops`. You can swap storage or add auth — keep the message shapes the plugin expects.

## Out of scope

- PM2 / Docker / Railway “production” recipes for this sample
- Presence lists, OT/CRDT merging beyond last-snapshot + ops fan-out
- TLS termination (put a reverse proxy in front if you must expose it)
