# Collaboration Plugin

> Archive: on-codemerge **v1** (`HTMLEditor`, `editor.use(new …Plugin())`). Current: [Plugins](/plugins/) · [Migrate](/guide/migration-v1-to-v2).

Realtime multi-user editing over WebSocket.

## Usage

```js
import { HTMLEditor, CollaborationPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new CollaborationPlugin());
```

## Options

```js
editor.use(
  new CollaborationPlugin({
    serverUrl: 'ws://localhost:8080',
    autoStart: true,
  })
);
```

Import editor CSS once at app level (`on-codemerge/index.css`, `on-codemerge/public.css`).
