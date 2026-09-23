# Anchor Link Plugin

> Archive: on-codemerge **v1** (`HTMLEditor`, `editor.use(new …Plugin())`). Current: [Plugins](/plugins/) · [Migrate](/guide/migration-v1-to-v2).


Insert in-document anchors and jump links.

## Usage

```js
import { HTMLEditor, AnchorLinkPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new AnchorLinkPlugin());
```

Import editor CSS once at app level (`on-codemerge/index.css`, `on-codemerge/public.css`).
