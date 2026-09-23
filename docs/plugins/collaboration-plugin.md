# Collaboration Plugin

Opt-in real-time collaboration over **kernel ops** (not HTML string sync). Not included in `createDefaultPlugins()` — you must pass a `token` that matches the server `COLLAB_TOKEN`.

## Features

- **Ops protocol**: local transactions fan out as ops; remotes apply via `createOpsCollabBinding`
- **WebSocket rooms**: keyed by `docId` (also reflected in the URL query for sharing)
- **Token auth**: every message carries `token`; server is fail-closed without `COLLAB_TOKEN`
- **Join + snapshot**: first joiner may seed a snapshot; late joiners receive `init` with room snapshot
- **Toolbar UI**: Review menu opens a popup (status, user id, share link, Start)
- **Auto-start**: optional when `autoStart`, `token`, and `docId` (URL) are present
- **Hotkey**: `Mod-Alt-O` opens the collaboration popup
- **Local demo only**: sample server is not a production collab stack

## Usage

> Install and CSS: see [Editor API — Getting Started](/guide/editor#getting-started).

```ts
import { Editor, CollaborationPlugin, createCorePlugins } from 'on-codemerge';

const editor = new Editor(container, {
  plugins: [
    ...createCorePlugins(),
    CollaborationPlugin({
      serverUrl: 'ws://localhost:8080',
      token: 'dev', // must match COLLAB_TOKEN
      autoStart: false,
    }),
  ],
});
```

Open the Review → Collaboration popup and click **Start**, or set `autoStart: true` with `?docId=` already in the URL.

## Demo

<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['CollaborationPlugin']" />

## Options

```ts
interface CollaborationPluginOptions {
  /** WebSocket base URL (default `ws://localhost:8080`) */
  serverUrl?: string;
  /** Start when `docId` is already in the URL (default `false`) */
  autoStart?: boolean;
  /** Shared secret matching server `COLLAB_TOKEN` (required to join) */
  token?: string;
  /** Optional hook when local ops are broadcast */
  onBroadcast?: (ops: Operation[]) => void;
}
```

There is **no** public instance API such as `plugin.startCollaboration()` / `getConnectionStatus()` — the factory returns a sealed `definePlugin` descriptor. Control flow is: options + toolbar popup + `autoStart`.

## Helpers

`createOpsCollabBinding(initialDoc, broadcast?)` — apply remote ops / track local ops against a `DocNode`. Used internally; exportable for custom hosts.

## Protocol (with sample server)

Client messages include `token`, `userId`, `docId`:

**Join**

```json
{
  "type": "join",
  "docId": "…",
  "token": "…",
  "userId": "…",
  "snapshot": {}
}
```

**Ops**

```json
{
  "type": "ops",
  "docId": "…",
  "token": "…",
  "userId": "…",
  "ops": [],
  "snapshot": {}
}
```

**Server → client**

- `init` — `{ type, docId, userId, snapshot }`
- `ops` — `{ type, docId, ops, userId }`

Unauthorized token → WebSocket close `1008`.

## Collaboration server

Sample implementation: [`collaboration-server/`](https://github.com/s00d/on-codemerge/tree/main/collaboration-server).

```bash
cd collaboration-server
pnpm install
COLLAB_TOKEN=dev pnpm start
# ws://localhost:8080
```

See that README for env vars and a minimal custom-server sketch. **Not** production-hardened (no PM2/Docker recipe as a recommended deploy).

## React example

```tsx
import { useEffect, useRef } from 'react';
import { Editor, CollaborationPlugin, createCorePlugins } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

export function CollaborativeEditor() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const editor = new Editor(host, {
      plugins: [
        ...createCorePlugins(),
        CollaborationPlugin({
          serverUrl: 'ws://localhost:8080',
          token: 'dev',
          autoStart: true,
        }),
      ],
    });

    const off = editor.on('docChanged', () => {
      // optional local persist of SoT
      void editor.getJSON();
    });

    return () => {
      off();
      editor.destroy();
    };
  }, []);

  return <div ref={hostRef} />;
}
```

## Notes

- Share the page URL after Start — it gains `docId` / `userId` query params.
- Persist SoT with `getJSON()` / `setJSON()`; do not treat HTML as the collaboration payload.
- Sample server cleans up a room when the last client disconnects.

## Related

- [collaboration-server README](https://github.com/s00d/on-codemerge/tree/main/collaboration-server)
- [Plugins overview](/plugins/)
- [Document model](/guide/document-model)
