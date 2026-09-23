# Track Changes Plugin

> Archive: on-codemerge **v1** (`HTMLEditor`, `editor.use(new …Plugin())`). Current: [Plugins](/plugins/) · [Migrate](/guide/migration-v1-to-v2).

Highlight inserts/deletes (v1 scaffold).

## Usage

```js
import { HTMLEditor, TrackChangesPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new TrackChangesPlugin());
```

Import editor CSS once at app level (`on-codemerge/index.css`, `on-codemerge/public.css`).
