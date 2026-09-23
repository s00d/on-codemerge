# Block Style Plugin

> Archive: on-codemerge **v1** (`HTMLEditor`, `editor.use(new …Plugin())`). Current: [Plugins](/plugins/) · [Migrate](/guide/migration-v1-to-v2).

CSS class / inline style editor for blocks.

## Usage

```js
import { HTMLEditor, BlockStylePlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new BlockStylePlugin());
```

Import editor CSS once at app level (`on-codemerge/index.css`, `on-codemerge/public.css`).
