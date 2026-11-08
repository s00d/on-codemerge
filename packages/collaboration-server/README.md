# `@codemerge/collaboration-server`

Authoritative real-time collaboration for CodeMerge (protocol **v2**).

- Versioned **op-log** over kernel ops (not Yjs)
- **Auth adapters** (static token, HS256 JWT, or custom)
- **Presence** channel (cursors / avatars)
- **SQLite** or memory store; optional **Postgres** + **Redis** fanout
- **REST** snapshot/inject + **webhooks**
- **Comments** channel + named **versions**
- **CLI** + **embed** into your Node HTTP server

## Install

```bash
pnpm add @codemerge/collaboration-server
```

Requires **Node.js ≥ 20**. SQLite store needs **Node ≥ 22.5** (`node:sqlite`); otherwise use `--store memory` or `memoryStore()`.

## CLI

```bash
COLLAB_TOKEN=dev npx codemerge-collaboration-server serve --port 8080 --store sqlite:./collab.db
```

```bash
codemerge-collaboration-server serve --auth jwt --jwt-secret "$SECRET" --store sqlite:./collab.db
codemerge-collaboration-server compact --doc <docId> --keep 200
codemerge-collaboration-server inspect <docId>
```

WS + REST base path defaults to `/collab`:

- `ws://host:8080/collab`
- `GET /collab/health`
- `GET /collab/rooms/:docId`
- `POST /collab/rooms/:docId` body `{ "ops": [...], "baseVersion": n }` (`write` role)
- `GET|POST /collab/rooms/:docId/versions` (POST: `write` role)

REST takes the token **only** from `Authorization: Bearer <token>`; `?token=` is ignored
(query strings end up in access logs, proxies and `Referer`). The WebSocket never puts the
token in the URL either: it is sent in-band as the `auth` message after `hello`, because
browsers cannot set headers on a WS upgrade.

## Roles

| Role      | Document ops (`submit`, REST POST) | Comments                                |
| --------- | ---------------------------------- | --------------------------------------- |
| `write`   | yes                                | add / edit own, resolve any, remove own |
| `comment` | no (`reject readonly`, REST 403)   | add / edit own, resolve own, remove own |
| `read`    | no (`reject readonly`, REST 403)   | no (`error readonly`)                   |

Comment threads are in memory per live room (dropped when its last client leaves), max
2000 threads per doc and 10 000 chars per body. Refusals come back as
`error { reason: 'comment_forbidden' | 'comment_too_large' | 'comment_limit' | 'comment_invalid' }`.

## Embed

```ts
import http from 'node:http';
import {
  createCollaborationServer,
  staticTokenAuth,
  sqliteStore,
} from '@codemerge/collaboration-server';

const collab = await createCollaborationServer({
  store: sqliteStore({ path: './collab.db' }),
  auth: staticTokenAuth({ token: process.env.COLLAB_TOKEN! }),
  path: '/collab',
  webhooks: [{ url: 'https://example.com/hooks/collab' }],
});

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('ok');
});
collab.attach(server);
server.listen(8080);
```

Custom auth:

```ts
auth: {
  async verify(token) {
    const user = await mySessionStore.get(token);
    if (!user) return null;
    return { userId: user.id, role: 'write', docs: user.docIds };
  },
}
```

## Protocol (v2)

Handshake: `hello` → `hello_ok` → `auth` → `auth_ok` → `join` → `init`  
Edits: `submit { baseVersion, ops }` → `ack | reject`  
Ephemeral: `presence`, `ping`/`pong`, `comment`

Clients must not send full document snapshots on every keystroke. Ops are rebased on the server when `baseVersion` lags.

Reconnect: `join { sinceVersion, clientId }` makes `init` carry `ops` (log since that version,
if not compacted) and `acked { seq, from, to }` (the last batch applied for that `clientId`,
in case its ack was lost). A `submit` with a `clientId` + `clientSeq` already applied is
rejected as `duplicate`, so a resubmit never applies twice. The `CollaborationPlugin` client
uses this to rebase offline edits onto the server instead of overwriting them.

## Peer deps (optional)

- `redis` — multi-instance fanout via `createRedisFanout({ url })`
- `pg` — `postgresStore(pool)` + `postgresMigrate(pool)`

## Migration from v1 demo

v1 `join`/`ops` + shared token-in-every-message is **removed**. Use protocol v2 + `CollaborationPlugin` from current `on-codemerge`.
